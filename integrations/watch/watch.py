#!/usr/bin/env python3
import argparse
import asyncio
import json
import logging
import os
import sys
import threading
import time
from collections import deque
from datetime import datetime

# For Windows GUI thread handling - moved to top of file
import platform
if platform.system() == 'Windows':
    # Set the event loop policy for Windows
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    from asyncio.windows_events import ProactorEventLoop
    # Force use of ProactorEventLoop for BLE operations
    if sys.version_info >= (3, 8):
        asyncio.set_event_loop(ProactorEventLoop())

import numpy as np
from bleak import BleakClient, BleakScanner
from watch_core import has_usable_sensor_contact, live_arousal_assessment, parse_heart_rate_measurement

try:
    from pylsl import StreamInfo, StreamOutlet
    HAS_LSL = True
except ImportError:
    StreamInfo = None
    StreamOutlet = None
    HAS_LSL = False

# --- PARAMETERS ------------------------------------------------
BASELINE_DURATION = 60.0  # seconds
WINDOW_DURATION = 30.0  # seconds
AROUSAL_CURRENT_SECONDS = float(os.environ.get("WATCH_AROUSAL_CURRENT_SECONDS", "15"))
AROUSAL_REFERENCE_SECONDS = float(os.environ.get("WATCH_AROUSAL_REFERENCE_SECONDS", "60"))
AROUSAL_HR_RISE_BPM = float(os.environ.get("WATCH_AROUSAL_HR_RISE_BPM", "5"))
SAMPLE_STALE_TIMEOUT = float(os.environ.get("WATCH_SAMPLE_STALE_SECONDS", "90"))
RECONNECT_DELAY = float(os.environ.get("WATCH_RECONNECT_DELAY_SECONDS", "3"))
MIN_BASELINE_HR_SAMPLES = int(os.environ.get("WATCH_MIN_BASELINE_HR_SAMPLES", "20"))
MIN_BASELINE_RR_INTERVALS = int(os.environ.get("WATCH_MIN_BASELINE_RR_INTERVALS", "20"))

OUTPUT_DIR = "./watch"
RAW_DIR = os.path.join(OUTPUT_DIR, "raw")
METRICS_DIR = os.path.join(OUTPUT_DIR, "metrics")
LOG_FILE = os.path.join(OUTPUT_DIR, "hrv_processor.log")

# Path for storing the JSON data file
WATCH_DATA_FILE = os.path.join(OUTPUT_DIR, "watch_data.json")
BASELINE_FILE = os.path.join(OUTPUT_DIR, "baseline_calibration.json")
CONTROL_FILE = os.path.join(OUTPUT_DIR, "control.json")

HEART_RATE_UUID = "00002a37-0000-1000-8000-00805f9b34fb"
TARGET_DEVICE_NAME = os.environ.get("WATCH_DEVICE_NAME", "hBand").strip() or "hBand"
TARGET_DEVICE_ID = os.environ.get("WATCH_DEVICE_ID", "").strip()

# --- LOGGING SETUP --------------------------------------------
# Create directories first
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)

# --- Configure logging ----------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE),
    ],
)
logger = logging.getLogger("hrv_processor")


# --- MAIN PROCESSOR CLASS -------------------------------------
class HRVProcessor:
    """
    Connects to MAX-HEALTH-BAND, computes windowed metrics, emits a cautious
    possible-arousal advisory, and saves every raw notification.
    """

    def __init__(self):
        # Data buffers
        self.heart_rate_values = deque()
        self.rr_intervals_values = deque()
        self.raw_hr_data = []
        self.pending_raw_readings = []
        self.raw_capture_path = os.path.join(
            RAW_DIR, f"watch_raw_{datetime.now():%Y%m%d_%H%M%S}.jsonl"
        )

        # LSL stream: 4 channels (HR, SDNN, RMSSD, pNN50)
        self.stream_info = None
        self.lsl_outlet = None
        if HAS_LSL:
            self.stream_info = StreamInfo(
                "HRV_CognitiveLoad", "HRV", 4, 1, "float32", "hrvuid12345"
            )
            self.lsl_outlet = StreamOutlet(self.stream_info)
        else:
            logger.warning("pylsl is not installed. JSON watch output still works.")

        self.last_live_write_time = None

        # State
        self.session_start_time = None
        self.baseline_start_time = None
        self.current_window_start = None
        self.baseline_metrics = {}
        self.baseline_complete = False
        self.ble_client = None

        # JSON data tracking - always start with sequence 1
        self.current_sequence = 0
        self.reset_json_file()

        # Try to load existing baseline
        self.load_baseline_from_file()

        # Monitoring control
        self.monitoring_mode = False
        self.monitoring_start_time = None
        self.last_control_request_id = self.load_existing_control_request_id()
        self.connected_at = None
        self.last_notification_time = None
        self.disconnected = False
        self.last_insufficient_baseline_log = None
        self.active_calibration_request_id = None

    def load_existing_control_request_id(self):
        """Ignore only calibration commands that the collector acknowledged."""
        try:
            with open(CONTROL_FILE, "r", encoding="utf-8") as handle:
                command = json.load(handle)
            return command.get("requestId") if command.get("acknowledgedAt") else None
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            return None

    def begin_calibration(self, request_id=None):
        """Start a fresh participant baseline while the collector remains connected."""
        self.active_calibration_request_id = request_id
        self.heart_rate_values.clear()
        self.rr_intervals_values.clear()
        self.raw_hr_data.clear()
        self.baseline_metrics = {}
        self.baseline_complete = False
        # Start timing on the first fresh notification, not on the request.
        self.baseline_start_time = None
        self.current_window_start = None
        self.monitoring_mode = False
        self.last_insufficient_baseline_log = None
        self.save_to_json({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "watch_data": {
                "is_baseline": False,
                "current_metrics": {},
                "stress_score": 0,
                "stress_level": "Calibrating",
                "distraction_detected": False,
                "arousal": self.current_arousal_assessment(time.time(), calibrating=True),
                "quality": {
                    "heart_rate_reliable": False,
                    "hrv_reliable": False,
                },
                "interpretation": "Fresh participant baseline calibration started.",
                "feedback": "Keep the participant still and relaxed.",
                "calibration": {
                    "active": True,
                    "progress": 0,
                    "started_at": None,
                    "duration_seconds": BASELINE_DURATION,
                    "request_id": request_id,
                },
            },
        })
        logger.info("Fresh watch baseline requested; waiting for the first live sample.")

    def handle_disconnect(self, _client):
        """Record an unexpected BLE disconnect for the reconnect supervisor."""
        self.disconnected = True
        logger.warning("Watch disconnected; automatic reconnection will begin.")

    def samples_are_stale(self):
        """Return True when a connected band has stopped sending HR samples."""
        reference = self.last_notification_time or self.connected_at
        return bool(reference and time.time() - reference > SAMPLE_STALE_TIMEOUT)

    def check_control_file(self):
        try:
            with open(CONTROL_FILE, "r", encoding="utf-8") as handle:
                command = json.load(handle)
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            return
        request_id = command.get("requestId")
        if request_id and request_id != self.last_control_request_id and command.get("action") == "calibrate":
            self.last_control_request_id = request_id
            self.begin_calibration(request_id=request_id)
            command["acknowledgedAt"] = datetime.now().isoformat()
            temporary_path = f"{CONTROL_FILE}.tmp"
            try:
                with open(temporary_path, "w", encoding="utf-8") as handle:
                    json.dump(command, handle, indent=2)
                os.replace(temporary_path, CONTROL_FILE)
            except OSError as error:
                logger.warning(f"Could not acknowledge calibration request {request_id}: {error}")

    def reset_json_file(self):
        """Reset the JSON file with an empty structure for a new session"""
        data = {
            "entries": [],
            "current_sequence": 0
        }
        with open(WATCH_DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Reset watch data file at {WATCH_DATA_FILE}")

    def initialize_json_file(self):
        """Initialize the JSON file with an empty structure if it doesn't exist"""
        # This method is kept for compatibility but now just calls reset_json_file
        self.reset_json_file()

    def save_to_json(self, data_entry):
        """Save a new entry to the JSON file"""
        try:
            # Load existing data
            with open(WATCH_DATA_FILE, 'r') as f:
                file_data = json.load(f)

            # Update sequence number
            self.current_sequence += 1
            data_entry["sequence_number"] = self.current_sequence

            # Carry every decoded notification through the bridge so it can be
            # assigned to the currently active app session and round.
            pending_raw = list(self.pending_raw_readings)
            if pending_raw:
                data_entry["raw_readings"] = pending_raw

            # Add new entry
            file_data["entries"].append(data_entry)
            file_data["current_sequence"] = self.current_sequence

            # Write back to file
            with open(WATCH_DATA_FILE, 'w') as f:
                json.dump(file_data, f, indent=2)

            if pending_raw:
                del self.pending_raw_readings[:len(pending_raw)]

            logger.info(f"Saved entry #{self.current_sequence} to watch data file")
            return True
        except Exception as e:
            logger.error(f"Error saving to watch data file: {e}")
            return False

    async def initialize_device(self):
        target_description = TARGET_DEVICE_ID or TARGET_DEVICE_NAME
        logger.info(f"Scanning for BLE devices matching '{target_description}'...")

        # Add retries for device scanning
        max_scan_attempts = 3
        target = None
        for attempt in range(1, max_scan_attempts + 1):
            try:
                logger.info(f"Scan attempt {attempt}/{max_scan_attempts}...")
                devices = await BleakScanner.discover()

                # Log all discovered devices for debugging
                logger.info(f"Found {len(devices)} Bluetooth devices:")
                for i, d in enumerate(devices):
                    dev_name = d.name if d.name else "Unknown"
                    logger.info(f"  {i+1}. {dev_name} ({d.address})")

                # Look for our target device
                for d in devices:
                    matches_saved_id = TARGET_DEVICE_ID and str(d.address).lower() == TARGET_DEVICE_ID.lower()
                    matches_name = d.name and TARGET_DEVICE_NAME.lower() in d.name.lower()
                    if matches_saved_id or matches_name:
                        target = d
                        break

                if target is not None:
                    break

                if attempt < max_scan_attempts:
                    logger.info(f"Target device not found, retrying in 2 seconds...")
                    await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"Error during BLE scan attempt {attempt}: {e}")
                if attempt < max_scan_attempts:
                    logger.info(f"Retrying scan in 2 seconds...")
                    await asyncio.sleep(2)

        if target is None:
            logger.error(
                f"Device '{target_description}' not found after {max_scan_attempts} attempts. "
                "Make sure it is on, advertising, and disconnected from other phones or computers."
            )
            return False

        logger.info(f"Found target device: {target.name} ({target.address})")

        try:
            # Connect to device with retry logic
            max_connect_attempts = 2
            for attempt in range(1, max_connect_attempts + 1):
                try:
                    logger.info(f"Connection attempt {attempt}/{max_connect_attempts}...")
                    self.ble_client = BleakClient(
                        target,
                        disconnected_callback=self.handle_disconnect,
                    )
                    await self.ble_client.connect()

                    if not self.ble_client.is_connected:
                        logger.error("Failed to connect - client reports not connected")
                        if attempt < max_connect_attempts:
                            logger.info("Retrying connection in 2 seconds...")
                            await asyncio.sleep(2)
                            continue
                        else:
                            return False

                    logger.info("Connected to device successfully.")

                    # Subscribe to Heart Rate notifications
                    await self.ble_client.start_notify(
                        HEART_RATE_UUID, self.hr_notification_handler
                    )
                    logger.info(f"Subscribed to HR notifications (UUID: {HEART_RATE_UUID}).")

                    self.connected_at = time.time()
                    self.last_notification_time = None
                    self.disconnected = False

                    return True

                except Exception as e:
                    logger.error(f"Connection attempt {attempt} failed: {e}")
                    if attempt < max_connect_attempts:
                        logger.info("Retrying connection in 2 seconds...")
                        await asyncio.sleep(2)
                    else:
                        raise

            return False

        except Exception as e:
            logger.error(f"Error connecting to device: {e}")
            if self.ble_client and self.ble_client.is_connected:
                try:
                    await self.ble_client.disconnect()
                except:
                    pass
            return False

    async def hr_notification_handler(self, sender, data):
        """Called on each incoming HR notification from the band."""
        raw_bytes = bytes(data)
        try:
            decoded = parse_heart_rate_measurement(raw_bytes)
        except ValueError as error:
            logger.warning(f"Ignored invalid heart-rate notification: {error}")
            return
        heart_rate = decoded["heart_rate_bpm"]
        rr_intervals = decoded.get("rr_ms", [])
        timestamp = time.time()
        self.last_notification_time = timestamp

        raw_sample = {
            "timestamp": timestamp,
            "timestamp_iso": datetime.fromtimestamp(timestamp).astimezone().isoformat(),
            "raw_packet_hex": raw_bytes.hex(),
            **decoded,
        }
        self.raw_hr_data.append(raw_sample)
        self.pending_raw_readings.append(raw_sample)
        try:
            with open(self.raw_capture_path, "a", encoding="utf-8") as handle:
                handle.write(json.dumps(raw_sample, separators=(",", ":")) + "\n")
        except OSError as error:
            logger.warning(f"Could not append raw watch capture: {error}")

        # Mark the overall session on its first sample.
        if self.session_start_time is None:
            self.session_start_time = timestamp
            self.current_window_start = timestamp
            logger.info(f"Session start at {datetime.fromtimestamp(timestamp)}")

        # A requested baseline begins with its first fresh HR notification.
        if not self.baseline_complete and self.baseline_start_time is None:
            self.baseline_start_time = timestamp
            self.current_window_start = timestamp
            logger.info("Baseline timer started with the first fresh watch sample.")

        # Buffer samples
        # Do not allow explicit poor-contact packets to establish a baseline or
        # contaminate windowed HRV metrics. Devices without a contact flag are
        # still accepted and are assessed by the downstream RR quality checks.
        if has_usable_sensor_contact(decoded):
            self.heart_rate_values.append((timestamp, heart_rate))
            for rr in rr_intervals:
                # convert ms to seconds
                self.rr_intervals_values.append((timestamp, rr / 1000.0))
        retention_seconds = max(600.0, AROUSAL_CURRENT_SECONDS + AROUSAL_REFERENCE_SECONDS + 30.0)
        while self.heart_rate_values and timestamp - self.heart_rate_values[0][0] > retention_seconds:
            self.heart_rate_values.popleft()
        while self.rr_intervals_values and timestamp - self.rr_intervals_values[0][0] > retention_seconds:
            self.rr_intervals_values.popleft()
        self.raw_hr_data = [
            sample for sample in self.raw_hr_data
            if timestamp - float(sample.get("timestamp", 0)) <= retention_seconds
        ]

        self.write_live_heart_rate(heart_rate, timestamp)

        # Baseline collection (calibration)
        if (
            not self.baseline_complete
            and timestamp - self.baseline_start_time >= BASELINE_DURATION
        ):
            enough_hr = len(self.heart_rate_values) >= MIN_BASELINE_HR_SAMPLES
            enough_rr = len(self.rr_intervals_values) >= MIN_BASELINE_RR_INTERVALS
            if enough_hr and enough_rr:
                self.compute_baseline_metrics()
                self.baseline_complete = True
                self.current_window_start = timestamp
                logger.info("Baseline calibration complete.")
                self.save_baseline_to_json()
                self.start_monitoring()
            elif (
                self.last_insufficient_baseline_log is None
                or timestamp - self.last_insufficient_baseline_log >= 10
            ):
                logger.warning(
                    "Baseline is waiting for enough live data "
                    f"(HR samples {len(self.heart_rate_values)}/{MIN_BASELINE_HR_SAMPLES}, "
                    f"RR intervals {len(self.rr_intervals_values)}/{MIN_BASELINE_RR_INTERVALS})."
                )
                self.last_insufficient_baseline_log = timestamp

        # Monitoring mode - collect data continuously
        elif (
            self.baseline_complete
            and self.monitoring_mode
            and timestamp - self.current_window_start >= WINDOW_DURATION
        ):
            self.process_window(self.current_window_start, timestamp)
            self.current_window_start = timestamp

    def calculate_mean_hr(self, window):
        now = time.time()
        vals = [hr for t, hr in self.heart_rate_values if now - t <= window]
        return float(np.mean(vals)) if vals else None

    def compute_sdnn_window(self, window):
        now = time.time()
        vals = [rr for t, rr in self.rr_intervals_values if now - t <= window]
        return float(np.std(vals) * 1000) if len(vals) > 1 else None

    def compute_rmssd_window(self, window):
        now = time.time()
        vals = [rr for t, rr in self.rr_intervals_values if now - t <= window]
        if len(vals) < 2:
            return None
        return float(np.sqrt(np.mean(np.diff(vals) ** 2)) * 1000)

    def compute_pnn_window(self, window, thresh=50):
        now = time.time()
        vals = [rr for t, rr in self.rr_intervals_values if now - t <= window]
        if len(vals) < 2:
            return None
        diffs = np.abs(np.diff(vals)) * 1000
        return float(100 * np.sum(diffs > thresh) / len(diffs))

    def write_live_heart_rate(self, heart_rate, timestamp):
        """Write a live HR sample so the sitting gate can pass during baseline."""
        if self.last_live_write_time is not None and timestamp - self.last_live_write_time < 2:
            return

        self.last_live_write_time = timestamp
        calibrating = not self.baseline_complete
        progress = 0
        if calibrating and self.baseline_start_time:
            # Reserve 100% for a baseline that passed the minimum-data checks.
            progress = min(99, int((timestamp - self.baseline_start_time) / BASELINE_DURATION * 100))
        arousal = self.current_arousal_assessment(timestamp, calibrating=calibrating)
        self.save_to_json({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "watch_data": {
                "is_baseline": False,
                "current_metrics": {
                    "hr": heart_rate,
                    "sdnn": self.compute_sdnn_window(WINDOW_DURATION),
                    "rmssd": self.compute_rmssd_window(WINDOW_DURATION),
                    "pnn50": self.compute_pnn_window(WINDOW_DURATION, 50),
                },
                "stress_score": arousal["score"],
                "stress_level": arousal["label"],
                "distraction_detected": False,
                "arousal": arousal,
                "quality": arousal["quality"],
                "interpretation": "Watch live — calibrating baseline." if calibrating else f"{arousal['label']}. This is an arousal cue, not a stress diagnosis.",
                "feedback": "Keep the band on." if calibrating else "Use participant behavior and researcher judgment before intervening.",
                "calibration": {
                    "active": calibrating,
                    "progress": progress,
                    "started_at": datetime.fromtimestamp(self.baseline_start_time).isoformat() if self.baseline_start_time else None,
                    "duration_seconds": BASELINE_DURATION,
                    "heart_rate_samples": len(self.heart_rate_values),
                    "rr_intervals": len(self.rr_intervals_values),
                    "minimum_heart_rate_samples": MIN_BASELINE_HR_SAMPLES,
                    "minimum_rr_intervals": MIN_BASELINE_RR_INTERVALS,
                    "request_id": self.active_calibration_request_id,
                },
            },
        })

    def current_arousal_assessment(self, timestamp, calibrating=False):
        if calibrating:
            return {
                "status": "calibrating",
                "label": "Calibrating",
                "possible": False,
                "score": 0.0,
                "heart_rate_delta_bpm": None,
                "current_median_bpm": None,
                "reference_median_bpm": None,
                "reference_source": None,
                "threshold_bpm": AROUSAL_HR_RISE_BPM,
                "current_window_seconds": AROUSAL_CURRENT_SECONDS,
                "reference_window_seconds": AROUSAL_REFERENCE_SECONDS,
                "quality": {
                    "heart_rate_reliable": False,
                    "hrv_reliable": False,
                    "current_packet_count": 0,
                    "current_heart_rate_samples": 0,
                    "valid_rr_count": 0,
                },
            }
        return live_arousal_assessment(
            self.raw_hr_data,
            now=timestamp,
            baseline_heart_rate=self.baseline_metrics.get("hr"),
            current_seconds=AROUSAL_CURRENT_SECONDS,
            reference_seconds=AROUSAL_REFERENCE_SECONDS,
            threshold_bpm=AROUSAL_HR_RISE_BPM,
        )

    def compute_baseline_metrics(self):
        """Compute and LSL-stream the baseline HRV metrics."""
        logger.info("Computing baseline metrics...")
        baseline_hr = self.calculate_mean_hr(BASELINE_DURATION)
        baseline_sdnn = self.compute_sdnn_window(BASELINE_DURATION)
        baseline_rmssd = self.compute_rmssd_window(BASELINE_DURATION)
        baseline_pnn50 = self.compute_pnn_window(BASELINE_DURATION, 50)

        self.baseline_metrics = {
            "hr": baseline_hr if baseline_hr is not None else 0,
            "sdnn": baseline_sdnn if baseline_sdnn is not None else 0,
            "rmssd": baseline_rmssd if baseline_rmssd is not None else 0,
            "pnn50": baseline_pnn50 if baseline_pnn50 is not None else 0,
        }
        b = self.baseline_metrics
        logger.info(
            f"Baseline metrics: HR={b['hr']:.1f}, "
            f"SDNN={b['sdnn']:.1f}, RMSSD={b['rmssd']:.1f}, "
            f"pNN50={b['pnn50']:.1f}%"
        )

        if self.lsl_outlet:
            self.lsl_outlet.push_sample([b["hr"], b["sdnn"], b["rmssd"], b["pnn50"]])

        # Save baseline to persistent file
        self.save_baseline_to_file()

    def save_baseline_to_file(self):
        """Save baseline metrics to a persistent file"""
        baseline_data = {
            "timestamp": datetime.now().isoformat(),
            "baseline_metrics": self.baseline_metrics,
            "baseline_duration": BASELINE_DURATION,
            "window_duration": WINDOW_DURATION
        }
        try:
            with open(BASELINE_FILE, 'w') as f:
                json.dump(baseline_data, f, indent=2)
            logger.info(f"Baseline calibration saved to {BASELINE_FILE}")
            return True
        except Exception as e:
            logger.error(f"Error saving baseline to file: {e}")
            return False

    def load_baseline_from_file(self):
        """Load baseline metrics from persistent file if it exists"""
        if os.path.exists(BASELINE_FILE):
            try:
                with open(BASELINE_FILE, 'r') as f:
                    baseline_data = json.load(f)

                self.baseline_metrics = baseline_data.get("baseline_metrics", {})

                # Validate that all required metrics are present
                required_keys = ["hr", "sdnn", "rmssd", "pnn50"]
                if all(key in self.baseline_metrics for key in required_keys):
                    self.baseline_complete = True
                    logger.info("Loaded existing baseline calibration from file")
                    logger.info(f"Baseline loaded from: {baseline_data.get('timestamp', 'unknown time')}")
                    b = self.baseline_metrics
                    logger.info(
                        f"Loaded baseline metrics: HR={b['hr']:.1f}, "
                        f"SDNN={b['sdnn']:.1f}, RMSSD={b['rmssd']:.1f}, "
                        f"pNN50={b['pnn50']:.1f}%"
                    )
                    return True
                else:
                    logger.warning("Incomplete baseline data found, will need to recalibrate")

            except Exception as e:
                logger.error(f"Error loading baseline from file: {e}")

        logger.info("No valid baseline calibration found, will need to calibrate")
        return False

    def save_baseline_to_json(self):
        """Save the baseline metrics to the JSON file"""
        timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        baseline_entry = {
            "timestamp": timestamp_str,
            "watch_data": {
                "is_baseline": True,
                "baseline_metrics": self.baseline_metrics,
                "interpretation": "Baseline measurements established as an arousal reference; they do not diagnose stress.",
                "feedback": "Baseline calibration complete. Continue using researcher judgment.",
                "calibration": {
                    "request_id": self.active_calibration_request_id,
                    "started_at": datetime.fromtimestamp(self.baseline_start_time).isoformat() if self.baseline_start_time else None,
                },
            }
        }
        self.save_to_json(baseline_entry)
        logger.info("Saved baseline metrics to watch data file")

    def start_monitoring(self):
        """Start the monitoring phase to collect data continuously"""
        if not self.baseline_complete:
            logger.warning("Cannot start monitoring without completing baseline calibration first")
            return False

        self.monitoring_mode = True
        self.monitoring_start_time = time.time()
        self.current_window_start = time.time()
        logger.info("Started monitoring phase - collecting data continuously")
        return True

    def process_window(self, start_time, end_time):
        """Compute windowed metrics and emit an advisory arousal flag."""
        window_duration = end_time - start_time

        # Current metrics
        current_hr = self.calculate_mean_hr(window_duration) or 0
        current_sdnn = self.compute_sdnn_window(window_duration) or 0
        current_rmssd = self.compute_rmssd_window(window_duration) or 0
        current_pnn50 = self.compute_pnn_window(window_duration, 50) or 0

        # Percent changes vs baseline
        changes = {}
        for k, cur in (("hr", current_hr), ("sdnn", current_sdnn), ("rmssd", current_rmssd), ("pnn50", current_pnn50),):
            base = self.baseline_metrics.get(k, 1)
            changes[k] = 100 * (cur - base) / base if base else 0

        arousal = self.current_arousal_assessment(end_time)
        stress_score = arousal["score"]
        level = arousal["label"]
        distraction = False

        logger.info(
            f"Window @{end_time-self.session_start_time:.1f}s -> arousal={level} "
            f"(HR delta={arousal.get('heart_rate_delta_bpm')})"
        )

        # Stream current HRV
        current_lsl = [
            current_hr if current_hr is not None else 0,
            current_sdnn if current_sdnn is not None else 0,
            current_rmssd if current_rmssd is not None else 0,
            current_pnn50 if current_pnn50 is not None else 0,
        ]
        if self.lsl_outlet:
            self.lsl_outlet.push_sample(current_lsl)

        # Save metrics to both the original location and the new JSON file
        rec = {
            "timestamp": end_time,
            "elapsed": end_time - self.session_start_time,
            "duration": window_duration,
            "current": {
                "hr": current_hr,
                "sdnn": current_sdnn,
                "rmssd": current_rmssd,
                "pnn50": current_pnn50,
            },
            "changes": changes,
            "stress_score": stress_score,
            "arousal": arousal,
        }
        fn = os.path.join(METRICS_DIR, f"metrics_{datetime.now():%Y%m%d_%H%M%S}.json")
        with open(fn, "w") as f:
            json.dump(rec, f, indent=2)

        # Save to the watch_data.json file
        timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        watch_data_entry = {
            "timestamp": timestamp_str,
            "watch_data": {
                "is_baseline": False,
                "current_metrics": {
                    "hr": current_hr,
                    "sdnn": current_sdnn,
                    "rmssd": current_rmssd,
                    "pnn50": current_pnn50,
                },
                "changes_from_baseline": changes,
                "stress_score": stress_score,
                "stress_level": level,
                "distraction_detected": distraction,
                "arousal": arousal,
                "quality": arousal["quality"],
                "interpretation": f"{level}. This is an arousal cue, not a stress diagnosis.",
                "feedback": "Review the participant and context before deciding whether to intervene."
            }
        }
        self.save_to_json(watch_data_entry)

    async def start(self):
        return await self.initialize_device()

    async def stop(self):
        logger.info("Stopping...")
        if self.pending_raw_readings:
            last = self.raw_hr_data[-1] if self.raw_hr_data else {}
            timestamp = float(last.get("timestamp", time.time()))
            arousal = self.current_arousal_assessment(
                timestamp, calibrating=not self.baseline_complete
            )
            self.save_to_json({
                "timestamp": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S"),
                "watch_data": {
                    "is_baseline": False,
                    "current_metrics": {"hr": last.get("heart_rate_bpm")},
                    "stress_score": arousal["score"],
                    "stress_level": arousal["label"],
                    "distraction_detected": False,
                    "arousal": arousal,
                    "quality": arousal["quality"],
                    "interpretation": "Final buffered watch samples saved before disconnect.",
                    "feedback": "Use researcher judgment before intervening.",
                },
            })
        client = self.ble_client
        self.ble_client = None
        if client and client.is_connected:
            try:
                await client.stop_notify(HEART_RATE_UUID)
            except Exception as error:
                logger.debug(f"Unable to stop HR notifications cleanly: {error}")
            try:
                await client.disconnect()
            except Exception as error:
                logger.debug(f"Unable to disconnect cleanly: {error}")
            logger.info("Disconnected.")
        self.connected_at = None
        self.last_notification_time = None
        self.disconnected = False


# --- ENTRY POINT ----------------------------------------------
async def main():
    proc = HRVProcessor()
    calibrate_on_start = os.environ.get("WATCH_CALIBRATE_ON_START", "1").strip().lower() not in {
        "0", "false", "no", "off"
    }
    calibration_pending = calibrate_on_start or not proc.baseline_complete

    while True:
        if not await proc.start():
            logger.warning(
                f"Watch connection failed; retrying automatically in {RECONNECT_DELAY:.0f}s."
            )
            await asyncio.sleep(RECONNECT_DELAY)
            continue

        logger.info("Watch connected successfully.")
        if calibration_pending:
            proc.begin_calibration()
            calibration_pending = False
        elif proc.baseline_complete:
            proc.start_monitoring()

        while True:
            proc.check_control_file()

            if proc.disconnected:
                logger.warning("Bluetooth disconnected; reconnecting automatically.")
                break

            if proc.samples_are_stale():
                logger.warning(
                    f"No heart-rate sample for {SAMPLE_STALE_TIMEOUT:.0f}s; "
                    "reconnecting the watch automatically."
                )
                break

            await asyncio.sleep(1)

        # Restart an interrupted calibration after reconnection so a partial,
        # discontinuous sample window can never be accepted as the baseline.
        calibration_pending = not proc.baseline_complete
        await proc.stop()
        await asyncio.sleep(RECONNECT_DELAY)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Watch collector stopped.")
