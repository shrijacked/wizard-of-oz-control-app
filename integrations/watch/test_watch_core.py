#!/usr/bin/env python3
import math
import unittest

from watch_core import analyze_capture, hrv_metrics, live_arousal_assessment, parse_heart_rate_measurement


class HeartRateMeasurementTests(unittest.TestCase):
    def test_decodes_energy_before_rr_and_converts_1024_units(self):
        # flags: contact detected/supported + energy present + RR present
        packet = bytes([0x1E, 75, 0xD2, 0x04, 0x00, 0x04, 0x00, 0x02])
        decoded = parse_heart_rate_measurement(packet)

        self.assertEqual(decoded["heart_rate_bpm"], 75)
        self.assertTrue(decoded["sensor_contact_supported"])
        self.assertTrue(decoded["sensor_contact_detected"])
        self.assertEqual(decoded["energy_expended_kj"], 1234)
        self.assertEqual(decoded["rr_raw_1024"], [1024, 512])
        self.assertEqual(decoded["rr_ms"], [1000.0, 500.0])

    def test_decodes_uint16_heart_rate(self):
        decoded = parse_heart_rate_measurement(bytes([0x11, 0x2C, 0x01, 0x00, 0x04]))
        self.assertEqual(decoded["heart_rate_bpm"], 300)
        self.assertEqual(decoded["heart_rate_format"], "uint16")
        self.assertEqual(decoded["rr_ms"], [1000.0])

    def test_rejects_partial_rr_field(self):
        with self.assertRaisesRegex(ValueError, "partial RR"):
            parse_heart_rate_measurement(bytes([0x10, 70, 0x01]))


class HrvAnalysisTests(unittest.TestCase):
    def test_live_advisory_flags_short_hr_rise_without_calling_it_stress(self):
        samples = []
        for second in range(61):
            samples.append(self.sample(second, "live", 70, 850))
        for second in range(61, 76):
            samples.append(self.sample(second, "live", 78, 770))

        advisory = live_arousal_assessment(samples, now=75, threshold_bpm=5)
        self.assertEqual(advisory["status"], "possible_arousal")
        self.assertTrue(advisory["possible"])
        self.assertEqual(advisory["heart_rate_delta_bpm"], 8.0)
        self.assertLess(advisory["score"], 0.75)

    def test_live_advisory_refuses_to_interpret_bad_contact(self):
        samples = [
            {
                **self.sample(second, "live", 90, 670),
                "sensor_contact_detected": False,
            }
            for second in range(20)
        ]
        advisory = live_arousal_assessment(samples, now=19, baseline_heart_rate=70)
        self.assertEqual(advisory["status"], "signal_unreliable")
        self.assertFalse(advisory["possible"])

    def test_time_domain_metrics(self):
        metrics = hrv_metrics([800, 850, 800])
        self.assertEqual(metrics["rr_count"], 3)
        self.assertAlmostEqual(metrics["mean_rr_ms"], 816.6666667)
        self.assertAlmostEqual(metrics["rmssd_ms"], 50.0)
        self.assertEqual(metrics["pnn50_pct"], 0.0)

    def test_calibration_builds_candidate_deviation_model(self):
        records = []
        for second in range(301):
            records.append(self.sample(second, "baseline", 72 + second % 2, 820 + (second % 3) * 5))
        for second in range(301, 482):
            records.append(self.sample(second, "task", 96 + second % 2, 620 + (second % 3) * 5))
        records.extend([
            {"type": "self_report", "stage": "baseline", "stress_rating_0_10": 1},
            {"type": "self_report", "stage": "task", "stress_rating_0_10": 8, "difficulty_rating_0_10": 8},
        ])

        report = analyze_capture(records)
        self.assertTrue(report["quality"]["passed"])
        self.assertTrue(report["hrv_signal_quality"]["passed"])
        self.assertIsNotNone(report["candidate_model"])
        model = report["candidate_model"]
        self.assertGreaterEqual(model["candidate_thresholds"]["observe"], 0.2)
        self.assertGreater(model["candidate_thresholds"]["intervene"], model["candidate_thresholds"]["observe"])
        self.assertTrue(model["task_validation"]["available"])
        self.assertGreater(model["task_validation"]["observe_exceedance_pct"], 50)
        self.assertTrue(model["task_validation"]["task_separation_detected"])
        self.assertTrue(report["threshold_readiness"]["ready_for_live_integration"])

    def test_no_rr_fails_quality_gate(self):
        records = [{
            "type": "sample",
            "timestamp": 1.0,
            "stage": "diagnostic",
            "heart_rate_bpm": 70,
            "rr_ms": [],
            "sensor_contact_supported": False,
            "sensor_contact_detected": None,
        }]
        report = analyze_capture(records)
        self.assertFalse(report["quality"]["passed"])
        self.assertIn("did not transmit RR-Interval", report["quality"]["failures"][0])

    def test_stress_protocol_prefers_high_challenge_and_keeps_self_reports(self):
        records = []
        for second in range(301):
            records.append(self.sample(second, "baseline", 72 + second % 2, 820 + (second % 3) * 5))
        for second in range(301, 482):
            records.append(self.sample(second, "low_task", 76 + second % 2, 780 + (second % 3) * 5))
        for second in range(482, 663):
            records.append(self.sample(second, "high_task", 100 + second % 2, 600 + (second % 3) * 5))
        records.append({
            "type": "self_report",
            "stage": "high_task",
            "stress_rating_0_10": 8,
            "difficulty_rating_0_10": 9,
        })
        records.extend([
            {"type": "self_report", "stage": "baseline", "stress_rating_0_10": 1},
            {"type": "self_report", "stage": "low_task", "stress_rating_0_10": 2, "difficulty_rating_0_10": 2},
        ])

        report = analyze_capture(records)
        self.assertEqual(report["candidate_model"]["task_validation"]["validation_stage"], "high_task")
        self.assertEqual(report["self_reports"][0]["stress_rating_0_10"], 8)
        self.assertTrue(report["fast_arousal_separation"]["separation_supported"])
        sweep = report["candidate_model"]["threshold_sweep"]
        self.assertIn("low_task", sweep[0]["stage_detection_pct"])
        self.assertIn("high_task", sweep[0]["stage_detection_pct"])

    @staticmethod
    def sample(timestamp, stage, heart_rate, rr_ms):
        return {
            "type": "sample",
            "timestamp": float(timestamp),
            "stage": stage,
            "heart_rate_bpm": heart_rate,
            "rr_ms": [rr_ms],
            "sensor_contact_supported": True,
            "sensor_contact_detected": True,
            "energy_expended_kj": None,
        }


if __name__ == "__main__":
    unittest.main()
