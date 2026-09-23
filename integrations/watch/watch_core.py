#!/usr/bin/env python3
"""Pure parsing and analysis helpers for the Maxim H Band collector.

This module deliberately has no Bluetooth dependency.  Keeping packet decoding
and calibration analysis pure makes it possible to test them with known BLE
payloads before trusting a live study run.
"""

from __future__ import annotations

import json
import math
import statistics
from collections.abc import Iterable, Sequence
from pathlib import Path
from typing import Any


RR_UNIT_SECONDS = 1.0 / 1024.0
MIN_PLAUSIBLE_RR_MS = 300.0
MAX_PLAUSIBLE_RR_MS = 2000.0


def live_arousal_assessment(
    samples: Sequence[dict[str, Any]],
    *,
    now: float,
    baseline_heart_rate: float | None = None,
    current_seconds: float = 15.0,
    reference_seconds: float = 60.0,
    threshold_bpm: float = 5.0,
    minimum_current_samples: int = 5,
    minimum_reference_samples: int = 10,
) -> dict[str, Any]:
    """Return a conservative, researcher-facing arousal advisory.

    This deliberately does not classify stress.  It detects a short-window
    heart-rate rise against the participant's immediately preceding rolling
    reference (or their calibrated baseline while that reference builds).
    RR quality is reported separately so noisy RR data cannot masquerade as a
    physiological conclusion.
    """
    current_start = now - current_seconds
    reference_start = current_start - reference_seconds
    current = [sample for sample in samples if float(sample.get("timestamp", 0)) >= current_start]
    reference = [
        sample for sample in samples
        if reference_start <= float(sample.get("timestamp", 0)) < current_start
    ]

    current_hr = [
        float(sample["heart_rate_bpm"])
        for sample in current
        if sample.get("heart_rate_bpm") is not None
        and 30.0 <= float(sample["heart_rate_bpm"]) <= 240.0
        and sample.get("sensor_contact_detected") is not False
    ]
    reference_hr = [
        float(sample["heart_rate_bpm"])
        for sample in reference
        if sample.get("heart_rate_bpm") is not None
        and 30.0 <= float(sample["heart_rate_bpm"]) <= 240.0
        and sample.get("sensor_contact_detected") is not False
    ]
    contact_samples = [sample for sample in current if sample.get("sensor_contact_supported")]
    poor_contact_pct = (
        100.0 * sum(sample.get("sensor_contact_detected") is False for sample in contact_samples)
        / len(contact_samples)
        if contact_samples else None
    )
    heart_rate_reliable = len(current_hr) >= minimum_current_samples and (
        poor_contact_pct is None or poor_contact_pct <= 20.0
    )

    current_summary = summarize_samples(current)
    review = current_summary.get("signal_review", {})
    rr_change_pct = review.get("successive_rr_change_over_20_pct")
    rr_disagreement_pct = review.get("rr_implied_hr_difference_over_20_bpm_pct")
    hrv_reliable = (
        current_summary.get("valid_rr_count", 0) >= 20
        and rr_change_pct is not None and rr_change_pct <= 10.0
        and rr_disagreement_pct is not None and rr_disagreement_pct <= 10.0
    )

    current_median = statistics.median(current_hr) if current_hr else None
    if len(reference_hr) >= minimum_reference_samples:
        reference_median = statistics.median(reference_hr)
        reference_source = "rolling"
    elif (
        baseline_heart_rate is not None
        and math.isfinite(float(baseline_heart_rate))
        and 30.0 <= float(baseline_heart_rate) <= 240.0
    ):
        reference_median = float(baseline_heart_rate)
        reference_source = "calibrated_baseline"
    else:
        reference_median = None
        reference_source = None

    delta = (
        current_median - reference_median
        if current_median is not None and reference_median is not None
        else None
    )

    if not heart_rate_reliable:
        status = "signal_unreliable"
        label = "Signal unreliable — do not interpret"
        possible = False
        score = 0.0
    elif reference_median is None:
        status = "establishing_reference"
        label = "Establishing rolling reference"
        possible = False
        score = 0.0
    elif delta >= threshold_bpm:
        status = "possible_arousal"
        label = "Possible arousal — review participant"
        possible = True
        # Keep this advisory below the app's automatic intervention threshold.
        score = min(0.70, 0.50 + max(0.0, delta - threshold_bpm) / 50.0)
    else:
        status = "normal"
        label = "No arousal flag"
        possible = False
        score = 0.10

    return {
        "status": status,
        "label": label,
        "possible": possible,
        "score": round(score, 3),
        "heart_rate_delta_bpm": round(delta, 1) if delta is not None else None,
        "current_median_bpm": round(current_median, 1) if current_median is not None else None,
        "reference_median_bpm": round(reference_median, 1) if reference_median is not None else None,
        "reference_source": reference_source,
        "threshold_bpm": threshold_bpm,
        "current_window_seconds": current_seconds,
        "reference_window_seconds": reference_seconds,
        "quality": {
            "heart_rate_reliable": heart_rate_reliable,
            "hrv_reliable": hrv_reliable,
            "current_packet_count": len(current),
            "current_heart_rate_samples": len(current_hr),
            "valid_rr_count": current_summary.get("valid_rr_count", 0),
            "poor_contact_packet_pct": poor_contact_pct,
            "successive_rr_change_over_20_pct": rr_change_pct,
            "rr_implied_hr_difference_over_20_bpm_pct": rr_disagreement_pct,
        },
    }


def parse_heart_rate_measurement(payload: bytes) -> dict[str, Any]:
    """Decode a Bluetooth Heart Rate Measurement (0x2A37) notification.

    RR-Interval values use 1/1024-second units.  Energy Expended, when its
    flag is set, occupies two bytes before the RR values and must be skipped.
    """
    if len(payload) < 2:
        raise ValueError("Heart Rate Measurement must contain flags and a heart-rate value")

    flags = payload[0]
    heart_rate_uint16 = bool(flags & 0x01)
    sensor_contact_supported = bool(flags & 0x04)
    sensor_contact_detected = bool(flags & 0x02) if sensor_contact_supported else None
    energy_expended_present = bool(flags & 0x08)
    rr_present = bool(flags & 0x10)

    index = 1
    heart_rate_size = 2 if heart_rate_uint16 else 1
    if len(payload) < index + heart_rate_size:
        raise ValueError("Heart Rate Measurement ends inside the heart-rate field")
    heart_rate = int.from_bytes(payload[index : index + heart_rate_size], "little")
    index += heart_rate_size

    energy_expended_kj = None
    if energy_expended_present:
        if len(payload) < index + 2:
            raise ValueError("Heart Rate Measurement ends inside Energy Expended")
        energy_expended_kj = int.from_bytes(payload[index : index + 2], "little")
        index += 2

    remaining = len(payload) - index
    if rr_present and remaining % 2:
        raise ValueError("Heart Rate Measurement contains a partial RR-Interval")

    rr_raw = []
    if rr_present:
        while index < len(payload):
            rr_raw.append(int.from_bytes(payload[index : index + 2], "little"))
            index += 2

    return {
        "flags": flags,
        "heart_rate_bpm": heart_rate,
        "heart_rate_format": "uint16" if heart_rate_uint16 else "uint8",
        "sensor_contact_supported": sensor_contact_supported,
        "sensor_contact_detected": sensor_contact_detected,
        "energy_expended_kj": energy_expended_kj,
        "rr_present": rr_present,
        "rr_raw_1024": rr_raw,
        "rr_ms": [value * 1000.0 * RR_UNIT_SECONDS for value in rr_raw],
    }


def hrv_metrics(rr_ms: Sequence[float]) -> dict[str, float | int | None]:
    """Return standard time-domain metrics without silently editing the data."""
    values = [float(value) for value in rr_ms if math.isfinite(float(value))]
    if not values:
        return {"rr_count": 0, "mean_rr_ms": None, "sdnn_ms": None, "rmssd_ms": None, "pnn50_pct": None}

    differences = [values[index] - values[index - 1] for index in range(1, len(values))]
    return {
        "rr_count": len(values),
        "mean_rr_ms": statistics.fmean(values),
        "sdnn_ms": statistics.stdev(values) if len(values) > 1 else None,
        "rmssd_ms": math.sqrt(statistics.fmean(diff * diff for diff in differences)) if differences else None,
        "pnn50_pct": (
            100.0 * sum(abs(diff) > 50.0 for diff in differences) / len(differences)
            if differences
            else None
        ),
    }


def percentile(values: Sequence[float], probability: float) -> float | None:
    clean = sorted(float(value) for value in values if math.isfinite(float(value)))
    if not clean:
        return None
    probability = min(1.0, max(0.0, probability))
    position = probability * (len(clean) - 1)
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return clean[lower]
    fraction = position - lower
    return clean[lower] + (clean[upper] - clean[lower]) * fraction


def median_absolute_deviation(values: Sequence[float]) -> float | None:
    clean = [float(value) for value in values if math.isfinite(float(value))]
    if not clean:
        return None
    center = statistics.median(clean)
    return statistics.median(abs(value - center) for value in clean)


def _sample_rr(sample: dict[str, Any]) -> list[float]:
    return [float(value) for value in sample.get("rr_ms", []) if math.isfinite(float(value))]


def _valid_rr(sample: dict[str, Any]) -> list[float]:
    if sample.get("sensor_contact_detected") is False:
        return []
    return [
        value
        for value in _sample_rr(sample)
        if MIN_PLAUSIBLE_RR_MS <= value <= MAX_PLAUSIBLE_RR_MS
    ]


def summarize_samples(samples: Sequence[dict[str, Any]]) -> dict[str, Any]:
    if not samples:
        return {
            "duration_seconds": 0,
            "packet_count": 0,
            "rr_count": 0,
            "valid_rr_count": 0,
            "rr_valid_pct": 0,
            "rr_packet_pct": 0,
            "poor_contact_packet_pct": None,
            "metrics": hrv_metrics([]),
        }

    timestamps = [float(sample["timestamp"]) for sample in samples]
    duration = max(timestamps) - min(timestamps)
    all_rr = [value for sample in samples for value in _sample_rr(sample)]
    valid_rr = [value for sample in samples for value in _valid_rr(sample)]
    successive_changes = [
        abs(valid_rr[index] - valid_rr[index - 1])
        / max(1.0, (valid_rr[index] + valid_rr[index - 1]) / 2.0)
        for index in range(1, len(valid_rr))
    ]
    rr_hr_differences = [
        abs((60000.0 / rr) - float(sample["heart_rate_bpm"]))
        for sample in samples
        for rr in _valid_rr(sample)
    ]
    rr_packets = sum(bool(sample.get("rr_ms")) for sample in samples)
    contact_packets = [sample for sample in samples if sample.get("sensor_contact_supported")]
    poor_contact = sum(sample.get("sensor_contact_detected") is False for sample in contact_packets)
    gaps = [timestamps[index] - timestamps[index - 1] for index in range(1, len(timestamps))]
    heart_rates = [float(sample["heart_rate_bpm"]) for sample in samples]

    return {
        "duration_seconds": duration,
        "packet_count": len(samples),
        "packet_rate_hz": len(samples) / duration if duration > 0 else None,
        "largest_notification_gap_seconds": max(gaps) if gaps else None,
        "heart_rate_bpm": {
            "min": min(heart_rates),
            "median": statistics.median(heart_rates),
            "max": max(heart_rates),
        },
        "rr_count": len(all_rr),
        "valid_rr_count": len(valid_rr),
        "rr_valid_pct": 100.0 * len(valid_rr) / len(all_rr) if all_rr else 0,
        "rr_packet_pct": 100.0 * rr_packets / len(samples),
        "energy_expended_packet_count": sum(sample.get("energy_expended_kj") is not None for sample in samples),
        "poor_contact_packet_pct": 100.0 * poor_contact / len(contact_packets) if contact_packets else None,
        "signal_review": {
            # These are review flags, not automatic corrections. Large values
            # often indicate motion/beat-detection artifacts, but can also
            # reflect real rhythm variation requiring expert review.
            "successive_rr_change_over_20_pct": (
                100.0 * sum(value > 0.20 for value in successive_changes) / len(successive_changes)
                if successive_changes
                else None
            ),
            "rr_implied_hr_difference_over_20_bpm_pct": (
                100.0 * sum(value > 20.0 for value in rr_hr_differences) / len(rr_hr_differences)
                if rr_hr_differences
                else None
            ),
            "median_rr_implied_hr_difference_bpm": (
                statistics.median(rr_hr_differences) if rr_hr_differences else None
            ),
        },
        "metrics": hrv_metrics(valid_rr),
    }


def _windows(
    samples: Sequence[dict[str, Any]],
    stage: str,
    window_seconds: float = 30.0,
    step_seconds: float = 5.0,
) -> list[dict[str, float]]:
    stage_samples = [sample for sample in samples if sample.get("stage") == stage]
    if not stage_samples:
        return []
    start = min(float(sample["timestamp"]) for sample in stage_samples)
    end = max(float(sample["timestamp"]) for sample in stage_samples)
    results = []
    cursor = start
    while cursor + window_seconds <= end + 0.001:
        selected = [sample for sample in stage_samples if cursor <= float(sample["timestamp"]) < cursor + window_seconds]
        rr_ms = [value for sample in selected for value in _valid_rr(sample)]
        heart_rates = [float(sample["heart_rate_bpm"]) for sample in selected]
        metrics = hrv_metrics(rr_ms)
        if heart_rates and metrics["rr_count"] >= 20 and metrics["rmssd_ms"] and metrics["rmssd_ms"] > 0:
            results.append({
                "start": cursor,
                "heart_rate_bpm": statistics.median(heart_rates),
                "rmssd_ms": float(metrics["rmssd_ms"]),
                "sdnn_ms": float(metrics["sdnn_ms"]),
            })
        cursor += step_seconds
    return results


def event_heart_rate_response(
    samples: Sequence[dict[str, Any]],
    stage: str,
    pre_seconds: float = 30.0,
    segment_seconds: float = 30.0,
) -> dict[str, Any] | None:
    """Describe fast HR changes relative to the moments immediately before a stage."""
    stage_samples = [sample for sample in samples if sample.get("stage") == stage]
    if not stage_samples:
        return None
    start = min(float(sample["timestamp"]) for sample in stage_samples)
    pre = [
        float(sample["heart_rate_bpm"])
        for sample in samples
        if start - pre_seconds <= float(sample["timestamp"]) < start
    ]
    if not pre:
        return None
    pre_median = statistics.median(pre)
    segments = []
    for index in range(3):
        lower = start + index * segment_seconds
        upper = lower + segment_seconds
        values = [
            float(sample["heart_rate_bpm"])
            for sample in stage_samples
            if lower <= float(sample["timestamp"]) < upper
        ]
        if not values:
            continue
        median_hr = statistics.median(values)
        segments.append({
            "start_seconds": index * segment_seconds,
            "end_seconds": (index + 1) * segment_seconds,
            "median_hr_bpm": median_hr,
            "delta_from_pre_bpm": median_hr - pre_median,
            "sample_count": len(values),
        })
    return {
        "stage": stage,
        "pre_window_seconds": pre_seconds,
        "pre_median_hr_bpm": pre_median,
        "segments": segments,
        "peak_segment_delta_bpm": max((segment["delta_from_pre_bpm"] for segment in segments), default=None),
    }


def derive_candidate_model(samples: Sequence[dict[str, Any]]) -> dict[str, Any] | None:
    """Derive participant-specific *candidate* deviation thresholds.

    These cutoffs describe deviation from a quiet baseline.  A task segment is
    used only to report sensitivity; it does not turn the result into a
    validated psychological-stress classifier.
    """
    baseline = _windows(samples, "baseline")
    if len(baseline) < 12:
        return None

    baseline_hr = [window["heart_rate_bpm"] for window in baseline]
    baseline_log_rmssd = [math.log(window["rmssd_ms"]) for window in baseline]
    hr_center = statistics.median(baseline_hr)
    log_rmssd_center = statistics.median(baseline_log_rmssd)
    # 1.4826 scales MAD to the standard deviation for normally distributed data.
    hr_scale = max(1.0, 1.4826 * (median_absolute_deviation(baseline_hr) or 0.0))
    log_rmssd_scale = max(0.05, 1.4826 * (median_absolute_deviation(baseline_log_rmssd) or 0.0))

    def score(window: dict[str, float]) -> float:
        hr_elevation = max(0.0, (window["heart_rate_bpm"] - hr_center) / hr_scale)
        rmssd_drop = max(0.0, (log_rmssd_center - math.log(window["rmssd_ms"])) / log_rmssd_scale)
        raw = 0.4 * hr_elevation + 0.6 * rmssd_drop
        return 1.0 - math.exp(-raw / 3.0)

    baseline_scores = [score(window) for window in baseline]
    observe = min(0.9, max(0.2, percentile(baseline_scores, 0.95) or 0.2))
    intervene = min(0.98, max(observe + 0.12, percentile(baseline_scores, 0.99) or 0.0))

    validation_stage = "high_task" if any(sample.get("stage") == "high_task" for sample in samples) else "task"
    task_windows = _windows(samples, validation_stage)
    task_scores = [score(window) for window in task_windows]
    baseline_median = percentile(baseline_scores, 0.5)
    baseline_p75 = percentile(baseline_scores, 0.75)
    task_median = percentile(task_scores, 0.5)
    task_observe_exceedance = (
        100.0 * sum(value >= observe for value in task_scores) / len(task_scores)
        if task_scores
        else None
    )
    task_separation_detected = bool(
        task_scores
        and task_median is not None
        and baseline_p75 is not None
        and task_median > baseline_p75
        and task_observe_exceedance is not None
        and task_observe_exceedance >= 20.0
    )

    threshold_sweep = []
    scored_stages = {}
    for stage in ("low_task", validation_stage, "recovery"):
        windows = _windows(samples, stage)
        if windows:
            scored_stages[stage] = [score(window) for window in windows]
    cutoffs = sorted({0.2, 0.3, 0.4, 0.45, 0.5, 0.6, 0.7, 0.75, round(observe, 6), round(intervene, 6)})
    for cutoff in cutoffs:
        threshold_sweep.append({
            "threshold": cutoff,
            "baseline_false_positive_pct": 100.0 * sum(value >= cutoff for value in baseline_scores) / len(baseline_scores),
            "task_detection_pct": (
                100.0 * sum(value >= cutoff for value in task_scores) / len(task_scores)
                if task_scores
                else None
            ),
            "stage_detection_pct": {
                stage: 100.0 * sum(value >= cutoff for value in scores) / len(scores)
                for stage, scores in scored_stages.items()
            },
        })
    return {
        "model": "participant_deviation_v1",
        "meaning": "Physiological deviation from this participant's quiet baseline; not a diagnosis of stress.",
        "window_seconds": 30,
        "step_seconds": 5,
        "features": {
            "heart_rate_weight": 0.4,
            "log_rmssd_weight": 0.6,
            "heart_rate_center_bpm": hr_center,
            "heart_rate_scale_bpm": hr_scale,
            "log_rmssd_center": log_rmssd_center,
            "log_rmssd_scale": log_rmssd_scale,
        },
        "candidate_thresholds": {
            "observe": observe,
            "intervene": intervene,
        },
        "baseline_window_count": len(baseline_scores),
        "baseline_score_percentiles": {
            "p50": percentile(baseline_scores, 0.5),
            "p95": percentile(baseline_scores, 0.95),
            "p99": percentile(baseline_scores, 0.99),
        },
        "task_validation": {
            "available": bool(task_scores),
            "validation_stage": validation_stage,
            "window_count": len(task_scores),
            "median_score": task_median,
            "baseline_median_score": baseline_median,
            "baseline_p75_score": baseline_p75,
            "observe_exceedance_pct": task_observe_exceedance,
            "intervene_exceedance_pct": (
                100.0 * sum(value >= intervene for value in task_scores) / len(task_scores)
                if task_scores
                else None
            ),
            "task_separation_detected": task_separation_detected,
            "note": "This checks physiological separation only. The task needs a separate self-report or protocol label before it can be treated as a stress-validation segment.",
        },
        "threshold_sweep": threshold_sweep,
    }


def analyze_capture(records: Sequence[dict[str, Any]]) -> dict[str, Any]:
    samples = [record for record in records if record.get("type") == "sample"]
    stages = sorted({str(sample.get("stage")) for sample in samples if sample.get("stage")})
    self_reports = [record for record in records if record.get("type") == "self_report"]
    overall = summarize_samples(samples)
    stage_summaries = {
        stage: summarize_samples([sample for sample in samples if sample.get("stage") == stage])
        for stage in stages
    }
    event_responses = {
        stage: response
        for stage in ("low_task", "high_task", "task")
        if (response := event_heart_rate_response(samples, stage)) is not None
    }

    failures = []
    if overall["rr_count"] == 0:
        failures.append("The band did not transmit RR-Interval data, so HRV cannot be calculated.")
    elif overall["rr_valid_pct"] < 90:
        failures.append("Fewer than 90% of RR intervals were physiologically plausible.")
    if overall["poor_contact_packet_pct"] is not None and overall["poor_contact_packet_pct"] > 5:
        failures.append("The band reported poor skin contact in more than 5% of contact-aware packets.")
    if overall["largest_notification_gap_seconds"] and overall["largest_notification_gap_seconds"] > 5:
        failures.append("The BLE stream contains a notification gap longer than 5 seconds.")

    baseline = stage_summaries.get("baseline")
    if baseline:
        if baseline["duration_seconds"] < 105:
            failures.append("The quiet baseline is shorter than the 2-minute quick protocol.")
        if baseline["valid_rr_count"] < 80:
            failures.append("The quiet baseline contains fewer than 80 valid RR intervals.")

    model = derive_candidate_model(samples) if not failures else None
    readiness_warnings = []
    baseline_review = (stage_summaries.get("baseline") or overall).get("signal_review", {})
    signal_quality_failures = []
    if (baseline_review.get("successive_rr_change_over_20_pct") or 0) > 10:
        signal_quality_failures.append(
            "More than 10% of successive baseline RR intervals changed by over 20%."
        )
    if (baseline_review.get("rr_implied_hr_difference_over_20_bpm_pct") or 0) > 10:
        signal_quality_failures.append(
            "More than 10% of baseline RR intervals disagreed with reported heart rate by over 20 bpm."
        )
    signal_quality = {
        "passed": bool(samples) and not signal_quality_failures,
        "failures": signal_quality_failures,
        "meaning": "Review gate for HRV thresholding; separate from BLE transport completeness.",
    }
    if baseline and baseline["duration_seconds"] < 240:
        readiness_warnings.append(
            "The short baseline is suitable only for provisional separation testing; use the 5-minute protocol before final live integration."
        )
    if (baseline_review.get("successive_rr_change_over_20_pct") or 0) > 10:
        readiness_warnings.append(
            "More than 10% of successive baseline RR intervals changed by over 20%; inspect fit, motion, and beat-detection artifacts."
        )
    if (baseline_review.get("rr_implied_hr_difference_over_20_bpm_pct") or 0) > 10:
        readiness_warnings.append(
            "More than 10% of baseline RR intervals disagreed with the reported heart rate by over 20 bpm."
        )
    if model and not model["task_validation"]["task_separation_detected"]:
        readiness_warnings.append(
            "The task windows did not separate cleanly from baseline, so these candidate thresholds are not ready for the live intervention system."
        )
    if model is None and not failures:
        readiness_warnings.append("There were not enough usable baseline windows to derive a candidate model.")

    report_by_stage = {report.get("stage"): report for report in self_reports}
    validation_stage = model["task_validation"]["validation_stage"] if model else None
    baseline_rating = report_by_stage.get("baseline", {}).get("stress_rating_0_10")
    low_rating = report_by_stage.get("low_task", {}).get("stress_rating_0_10")
    challenge_rating = report_by_stage.get(validation_stage, {}).get("stress_rating_0_10") if validation_stage else None
    stress_label_supported = bool(
        challenge_rating is not None
        and baseline_rating is not None
        and challenge_rating >= 6
        and challenge_rating - baseline_rating >= 2
        and (low_rating is None or challenge_rating - low_rating >= 2)
    )
    self_report_validation = {
        "available": challenge_rating is not None and baseline_rating is not None,
        "baseline_stress_0_10": baseline_rating,
        "low_task_stress_0_10": low_rating,
        "challenge_stage": validation_stage,
        "challenge_stress_0_10": challenge_rating,
        "stress_scenario_supported": stress_label_supported,
        "pilot_rule": "Challenge rating >= 6/10 and at least 2 points above baseline and low task. This is a declared pilot criterion, not a universal clinical cutoff.",
    }
    low_fast_delta = event_responses.get("low_task", {}).get("peak_segment_delta_bpm")
    challenge_fast_delta = event_responses.get(validation_stage, {}).get("peak_segment_delta_bpm") if validation_stage else None
    fast_arousal_separation = {
        "available": challenge_fast_delta is not None,
        "low_task_peak_delta_bpm": low_fast_delta,
        "challenge_stage": validation_stage,
        "challenge_peak_delta_bpm": challenge_fast_delta,
        "separation_supported": bool(
            challenge_fast_delta is not None
            and challenge_fast_delta >= 5.0
            and (low_fast_delta is None or challenge_fast_delta - low_fast_delta >= 5.0)
        ),
        "pilot_rule": "Challenge has a >=5 bpm 30-second median HR rise and is >=5 bpm above the low-task response. This is a provisional event-response rule, not a stress diagnosis.",
    }
    if model:
        model["self_report_validation"] = self_report_validation
        if not self_report_validation["available"]:
            readiness_warnings.append(
                "No paired baseline/challenge self-report labels were captured, so the task cannot be called a validated stress scenario."
            )
        elif not stress_label_supported:
            readiness_warnings.append(
                "The participant ratings did not meet the declared pilot rule for a successful stress challenge."
            )

    threshold_readiness = {
        "ready_for_live_integration": bool(model) and not readiness_warnings,
        "warnings": readiness_warnings,
    }
    if model:
        model["deployment_readiness"] = threshold_readiness

    return {
        "schema_version": 1,
        "quality": {
            "passed": not failures,
            "failures": failures,
            "meaning": "BLE transport/data-completeness gate only.",
        },
        "hrv_signal_quality": signal_quality,
        "overall": overall,
        "stages": stage_summaries,
        "event_heart_rate_responses": event_responses,
        "fast_arousal_separation": fast_arousal_separation,
        "self_reports": self_reports,
        "self_report_validation": self_report_validation,
        "candidate_model": model,
        "threshold_readiness": threshold_readiness,
    }


def read_jsonl(path: str | Path) -> list[dict[str, Any]]:
    records = []
    with Path(path).open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSON on line {line_number}: {error}") from error
    return records


def write_json(path: str | Path, value: Any) -> None:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2)
        handle.write("\n")
    temporary.replace(destination)
