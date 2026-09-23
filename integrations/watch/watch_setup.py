#!/usr/bin/env python3
"""Standalone BLE diagnostic and calibration utility for the Maxim H Band.

This script does not start the study server or write watch/watch_data.json.
It is intentionally isolated so a watch can be qualified and calibrated before
its model is connected to the experiment.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bleak import BleakClient, BleakScanner

from watch_core import analyze_capture, parse_heart_rate_measurement, read_jsonl, write_json


HEART_RATE_UUID = "00002a37-0000-1000-8000-00805f9b34fb"
DEFAULT_DEVICE_NAME = os.environ.get("WATCH_DEVICE_NAME", "hBand").strip() or "hBand"
DEFAULT_DEVICE_ID = os.environ.get("WATCH_DEVICE_ID", "").strip()
DEFAULT_OUTPUT_DIR = Path("watch") / "calibration-runs"


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip()).strip("-.")
    return cleaned or "watch"


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def discover_devices(seconds: float) -> list[Any]:
    return list(await BleakScanner.discover(timeout=seconds))


async def select_device(device_id: str, device_name: str, scan_seconds: float) -> Any:
    devices = await discover_devices(scan_seconds)
    if device_id:
        for device in devices:
            if str(device.address).lower() == device_id.lower():
                return device
        raise RuntimeError(f"No BLE device matched id {device_id!r}")

    matches = [
        device
        for device in devices
        if device.name and device_name.lower() in device.name.lower()
    ]
    if not matches:
        visible = ", ".join(f"{device.name or 'Unknown'} ({device.address})" for device in devices)
        raise RuntimeError(f"No BLE device name contained {device_name!r}. Visible devices: {visible or 'none'}")
    if len(matches) > 1:
        choices = ", ".join(f"{device.name} ({device.address})" for device in matches)
        raise RuntimeError(f"More than one device matched {device_name!r}: {choices}. Re-run with --device-id.")
    return matches[0]


class CaptureSession:
    def __init__(self, destination: Path, device: Any):
        self.destination = destination
        self.device = device
        self.handle = None
        self.stage = "diagnostic"
        self.stage_started_at = None
        self.packet_count = 0
        self.rr_count = 0
        self.decode_errors = 0

    def write(self, record: dict[str, Any]) -> None:
        assert self.handle is not None
        self.handle.write(json.dumps(record, separators=(",", ":")) + "\n")
        self.handle.flush()

    def begin(self) -> None:
        self.destination.parent.mkdir(parents=True, exist_ok=True)
        self.handle = self.destination.open("x", encoding="utf-8")
        self.write({
            "type": "capture_header",
            "schema_version": 1,
            "created_at": iso_now(),
            "device": {"name": self.device.name, "address": str(self.device.address)},
            "rr_unit": "1/1024 second",
        })

    def set_stage(self, stage: str) -> None:
        self.stage = stage
        self.stage_started_at = time.time()
        self.write({"type": "stage", "event": "start", "stage": stage, "timestamp": self.stage_started_at, "at": iso_now()})

    def end_stage(self) -> None:
        now = time.time()
        self.write({"type": "stage", "event": "end", "stage": self.stage, "timestamp": now, "at": iso_now()})
        # Keep operator setup time out of the baseline/task/recovery analysis.
        self.stage = "transition"
        self.stage_started_at = None

    def notification(self, _sender: Any, payload: bytearray) -> None:
        timestamp = time.time()
        raw = bytes(payload)
        try:
            decoded = parse_heart_rate_measurement(raw)
            self.packet_count += 1
            self.rr_count += len(decoded["rr_ms"])
            self.write({
                "type": "sample",
                "timestamp": timestamp,
                "at": datetime.fromtimestamp(timestamp, timezone.utc).isoformat(),
                "stage": self.stage,
                "stage_elapsed_seconds": timestamp - self.stage_started_at if self.stage_started_at else None,
                "raw_hex": raw.hex(),
                **decoded,
            })
        except (ValueError, OSError) as error:
            self.decode_errors += 1
            self.write({
                "type": "decode_error",
                "timestamp": timestamp,
                "at": datetime.fromtimestamp(timestamp, timezone.utc).isoformat(),
                "stage": self.stage,
                "raw_hex": raw.hex(),
                "error": str(error),
            })

    def close(self) -> None:
        if not self.handle:
            return
        self.write({
            "type": "capture_footer",
            "closed_at": iso_now(),
            "packet_count": self.packet_count,
            "rr_count": self.rr_count,
            "decode_error_count": self.decode_errors,
        })
        self.handle.close()
        self.handle = None


async def wait_stage(duration: float, session: CaptureSession) -> None:
    started = time.monotonic()
    last_display = None
    while True:
        elapsed = time.monotonic() - started
        remaining = max(0, duration - elapsed)
        display = int(remaining)
        if display != last_display and (display % 10 == 0 or remaining <= 5):
            print(
                f"  {session.stage}: {display:>3}s remaining | "
                f"packets {session.packet_count} | RR intervals {session.rr_count}",
                flush=True,
            )
            last_display = display
        if remaining <= 0:
            return
        await asyncio.sleep(min(1.0, remaining))


async def operator_ready(message: str, no_prompt: bool) -> None:
    if no_prompt:
        print(message, flush=True)
        return
    await asyncio.to_thread(input, f"\n{message}\nPress Return when ready: ")


def prompt_rating(label: str) -> int:
    while True:
        value = input(f"{label} (0-10): ").strip()
        try:
            rating = int(value)
        except ValueError:
            rating = -1
        if 0 <= rating <= 10:
            return rating
        print("Please enter a whole number from 0 to 10.")


async def collect_self_report(session: CaptureSession, stage: str, mode: str, no_prompt: bool) -> None:
    if no_prompt or mode == "none":
        return
    print("\nAsk the participant for the following ratings. Do not interpret the watch display for them.")
    stress = await asyncio.to_thread(prompt_rating, "How stressed, tense, or pressured did you feel")
    difficulty = None
    if mode == "task":
        difficulty = await asyncio.to_thread(prompt_rating, "How difficult was that task")
    session.write({
        "type": "self_report",
        "timestamp": time.time(),
        "at": iso_now(),
        "stage": stage,
        "stress_rating_0_10": stress,
        "difficulty_rating_0_10": difficulty,
    })


async def run_capture(args: argparse.Namespace, stages: list[tuple[str, float, str, str]]) -> Path:
    device = await select_device(args.device_id, args.device_name, args.scan_seconds)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = safe_name(getattr(args, "participant_id", "diagnostic"))
    destination = Path(args.output) if args.output else DEFAULT_OUTPUT_DIR / f"{stamp}_{suffix}.jsonl"
    session = CaptureSession(destination, device)
    session.begin()

    print(f"Connecting to {device.name or 'Unknown'} ({device.address}) ...", flush=True)
    try:
        async with BleakClient(device) as client:
            if not client.is_connected:
                raise RuntimeError("Bleak did not establish a connection")
            await client.start_notify(HEART_RATE_UUID, session.notification)
            print(f"Connected. Raw capture: {destination}", flush=True)

            for stage, duration, instructions, rating_mode in stages:
                await operator_ready(instructions, args.no_prompt)
                session.set_stage(stage)
                await wait_stage(duration, session)
                session.end_stage()
                await collect_self_report(session, stage, rating_mode, args.no_prompt)

            await client.stop_notify(HEART_RATE_UUID)
    finally:
        session.close()

    return destination


def report_paths(capture_path: Path) -> tuple[Path, Path]:
    return capture_path.with_suffix(".report.json"), capture_path.with_suffix(".profile.json")


def print_report(report: dict[str, Any], capture_path: Path) -> None:
    overall = report["overall"]
    quality = report["quality"]
    print("\nWatch qualification result")
    print(f"  Capture: {capture_path}")
    print(f"  Packets: {overall['packet_count']}")
    print(f"  RR intervals: {overall['rr_count']} ({overall['rr_packet_pct']:.1f}% of packets carried RR)")
    print(f"  Plausible RR: {overall['rr_valid_pct']:.1f}%")
    print(f"  BLE transport gate: {'PASS' if quality['passed'] else 'FAIL'}")
    for failure in quality["failures"]:
        print(f"    - {failure}")
    signal_quality = report.get("hrv_signal_quality", {})
    print(f"  HRV signal-quality gate: {'PASS' if signal_quality.get('passed') else 'FAIL'}")
    for failure in signal_quality.get("failures", []):
        print(f"    - {failure}")
    metrics = overall["metrics"]
    if metrics["rmssd_ms"] is not None:
        print(f"  Overall RMSSD: {metrics['rmssd_ms']:.1f} ms")
        print(f"  Overall SDNN: {metrics['sdnn_ms']:.1f} ms")
    if report.get("candidate_model"):
        thresholds = report["candidate_model"]["candidate_thresholds"]
        print(f"  Candidate observe threshold: {thresholds['observe']:.3f}")
        print(f"  Candidate intervene threshold: {thresholds['intervene']:.3f}")
        print("  These indicate physiological deviation, not a diagnosis of stress.")
    labels = report.get("self_report_validation", {})
    if labels.get("available"):
        print(
            "  Self-reported challenge: "
            f"baseline {labels['baseline_stress_0_10']}/10 -> "
            f"{labels['challenge_stage']} {labels['challenge_stress_0_10']}/10"
        )
        print(
            "  Declared stress-scenario rule: "
            f"{'SUPPORTED' if labels.get('stress_scenario_supported') else 'NOT SUPPORTED'}"
        )
    else:
        print("  Declared stress-scenario rule: NOT CHECKED (paired self-report ratings unavailable)")
    fast = report.get("fast_arousal_separation", {})
    if fast.get("available"):
        print(
            "  Fast HR response: "
            f"low {fast.get('low_task_peak_delta_bpm'):+.1f} bpm | "
            f"{fast.get('challenge_stage')} {fast.get('challenge_peak_delta_bpm'):+.1f} bpm"
        )
        print(
            "  Provisional fast-arousal rule: "
            f"{'SUPPORTED' if fast.get('separation_supported') else 'NOT SUPPORTED'}"
        )
    readiness = report.get("threshold_readiness", {})
    print(f"  Ready for live threshold integration: {'YES' if readiness.get('ready_for_live_integration') else 'NO'}")
    for warning in readiness.get("warnings", []):
        print(f"    - {warning}")


def analyze_and_save(capture_path: Path) -> dict[str, Any]:
    report = analyze_capture(read_jsonl(capture_path))
    report_path, profile_path = report_paths(capture_path)
    write_json(report_path, report)
    if report.get("candidate_model"):
        write_json(profile_path, {
            "schema_version": 1,
            "source_capture": str(capture_path),
            "created_at": iso_now(),
            "quality": report["quality"],
            **report["candidate_model"],
        })
    print_report(report, capture_path)
    print(f"  Full report: {report_path}")
    if report.get("candidate_model"):
        print(f"  Candidate profile: {profile_path}")
    return report


async def command_scan(args: argparse.Namespace) -> int:
    devices = await discover_devices(args.scan_seconds)
    print(f"Found {len(devices)} BLE device(s):")
    for device in devices:
        marker = "  <== name match" if device.name and args.device_name.lower() in device.name.lower() else ""
        print(f"  {device.name or 'Unknown':30} {device.address}{marker}")
    return 0


async def command_check(args: argparse.Namespace) -> int:
    capture = await run_capture(args, [(
        "diagnostic",
        args.duration,
        "Wear the band snugly, keep the wrist still, and remain seated for the device check.",
        "none",
    )])
    report = analyze_and_save(capture)
    return 0 if report["overall"]["rr_count"] and report["overall"]["rr_valid_pct"] >= 90 else 2


async def command_calibrate(args: argparse.Namespace) -> int:
    stages = [(
        "baseline",
        args.baseline_seconds,
        "BASELINE: sit quietly, keep both feet supported, do not talk, and keep the watch wrist still.",
        "stress",
    )]
    if args.task_seconds > 0:
        stages.append((
            "task",
            args.task_seconds,
            "TASK: perform a representative tangram trial. Avoid deliberate exercise; we want normal task physiology.",
            "task",
        ))
    if args.recovery_seconds > 0:
        stages.append((
            "recovery",
            args.recovery_seconds,
            "RECOVERY: stop the task and sit quietly again.",
            "stress",
        ))
    capture = await run_capture(args, stages)
    report = analyze_and_save(capture)
    return 0 if report["quality"]["passed"] and report.get("candidate_model") else 2


async def command_stress_test(args: argparse.Namespace) -> int:
    print(
        "\nSAFETY: Use only with informed consent and your approved human-subjects protocol. "
        "The participant may stop at any time. Stop immediately if they request it or show concerning distress. "
        "Do not use threats, humiliation, deception, pain, or false performance feedback.\n",
        flush=True,
    )
    baseline_seconds = args.baseline_seconds if args.baseline_seconds is not None else (120.0 if args.quick else 300.0)
    settling_seconds = args.settling_seconds if args.settling_seconds is not None else (60.0 if args.quick else 90.0)
    task_seconds = args.task_seconds if args.task_seconds is not None else (90.0 if args.quick else 180.0)
    between_recovery_seconds = (
        args.between_recovery_seconds
        if args.between_recovery_seconds is not None
        else (60.0 if args.quick else 180.0)
    )
    recovery_seconds = args.recovery_seconds if args.recovery_seconds is not None else (120.0 if args.quick else 300.0)
    if args.quick:
        print(
            "QUICK MODE: about 9 minutes plus ratings. This can test whether the conditions separate, "
            "but its short baseline is provisional and will not be marked ready for final live integration.\n",
            flush=True,
        )

    low_task = (
        "low_task",
        task_seconds,
        "LOW-PRESSURE TASK: use an easy/familiar tangram. No countdown, competition, or performance feedback. Ask for normal accuracy.",
        "task",
    )
    high_task = (
        "high_task",
        task_seconds,
        "HIGH-CHALLENGE TASK: use a difficult/unfamiliar tangram with the normal visible countdown. Ask for speed and accuracy, but use only neutral standardized prompts and no deceptive feedback.",
        "task",
    )
    ordered_tasks = [low_task, high_task] if args.challenge_order == "low-high" else [high_task, low_task]
    stages = [(
        "settling",
        settling_seconds,
        "SETTLING: sit quietly before baseline. Keep both feet supported, do not talk, and keep the watch wrist still.",
        "none",
    ), (
        "baseline",
        baseline_seconds,
        "BASELINE: sit quietly, keep both feet supported, do not talk, and keep the watch wrist still.",
        "stress",
    )]
    for index, task in enumerate(ordered_tasks):
        stages.append(task)
        if index == 0:
            stages.append((
                "recovery_between",
                between_recovery_seconds,
                "RECOVERY: stop the task, remove the puzzle, and sit quietly before the next condition.",
                "stress",
            ))
    stages.append((
        "recovery",
        recovery_seconds,
        "FINAL RECOVERY: stop the task and sit quietly.",
        "stress",
    ))
    capture = await run_capture(args, stages)
    report = analyze_and_save(capture)
    return 0 if report["quality"]["passed"] and report.get("candidate_model") else 2


def command_analyze(args: argparse.Namespace) -> int:
    report = analyze_and_save(Path(args.capture))
    return 0 if report["quality"]["passed"] else 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Qualify the hBand BLE stream and derive a participant-specific candidate profile.",
    )
    parser.add_argument("--device-name", default=DEFAULT_DEVICE_NAME, help=f"BLE name substring (default: {DEFAULT_DEVICE_NAME})")
    parser.add_argument("--device-id", default=DEFAULT_DEVICE_ID, help="Exact BLE address/UUID; overrides --device-name")
    parser.add_argument("--scan-seconds", type=float, default=8.0, help="BLE discovery duration")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan = subparsers.add_parser("scan", help="List nearby BLE devices")
    scan.set_defaults(handler=command_scan)

    check = subparsers.add_parser("check", help="Run a short RR/contact/data-quality check")
    check.add_argument("--duration", type=float, default=60.0)
    check.add_argument("--output")
    check.add_argument("--no-prompt", action="store_true")
    check.set_defaults(handler=command_check)

    calibrate = subparsers.add_parser("calibrate", help="Record quiet baseline, task, and recovery stages")
    calibrate.add_argument("--participant-id", required=True, help="Pilot/participant label used in the filename")
    calibrate.add_argument("--baseline-seconds", type=float, default=300.0)
    calibrate.add_argument("--task-seconds", type=float, default=180.0)
    calibrate.add_argument("--recovery-seconds", type=float, default=120.0)
    calibrate.add_argument("--output")
    calibrate.add_argument("--no-prompt", action="store_true", help="Run stages sequentially without Return prompts")
    calibrate.set_defaults(handler=command_calibrate)

    stress_test = subparsers.add_parser("stress-test", help="Record baseline, low-pressure, high-challenge, and recovery stages")
    stress_test.add_argument("--participant-id", required=True, help="Pilot/participant label used in the filename")
    stress_test.add_argument("--quick", action="store_true", help="Use an approximately 9-minute provisional protocol")
    stress_test.add_argument("--settling-seconds", type=float)
    stress_test.add_argument("--baseline-seconds", type=float)
    stress_test.add_argument("--task-seconds", type=float)
    stress_test.add_argument("--between-recovery-seconds", type=float)
    stress_test.add_argument("--recovery-seconds", type=float)
    stress_test.add_argument("--challenge-order", choices=("low-high", "high-low"), default="low-high")
    stress_test.add_argument("--output")
    stress_test.add_argument("--no-prompt", action="store_true", help="Run stages sequentially without prompts or ratings")
    stress_test.set_defaults(handler=command_stress_test)

    analyze = subparsers.add_parser("analyze", help="Re-analyze an existing JSONL capture without connecting")
    analyze.add_argument("capture")
    analyze.set_defaults(handler=command_analyze)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = args.handler(args)
        return asyncio.run(result) if asyncio.iscoroutine(result) else int(result)
    except KeyboardInterrupt:
        print("\nStopped. The partial JSONL capture is preserved.", file=sys.stderr)
        return 130
    except (OSError, RuntimeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
