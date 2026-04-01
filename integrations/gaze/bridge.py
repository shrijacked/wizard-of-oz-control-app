#!/usr/bin/env python3
import argparse
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


def post_json(url: str, payload: Dict[str, Any]) -> None:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        response.read()


def first_number(*values: Any) -> Optional[float]:
    for value in values:
        if isinstance(value, (int, float)):
            return float(value)
    return None


def normalize_frame(frame: Dict[str, Any]) -> Dict[str, Any]:
    metrics = frame.get("metrics") if isinstance(frame.get("metrics"), dict) else frame

    attention_score = first_number(
        metrics.get("attentionScore"),
        metrics.get("attention"),
        metrics.get("focus"),
        metrics.get("focusScore"),
        metrics.get("engagement"),
    )

    fixation_loss = first_number(
        metrics.get("fixationLoss"),
        metrics.get("fixation_loss"),
        metrics.get("gazeLoss"),
        metrics.get("fixationInstability"),
    )

    if fixation_loss is None and isinstance(metrics.get("fixationStability"), (int, float)):
        fixation_loss = 1.0 - float(metrics["fixationStability"])

    pupil_dilation = first_number(
        metrics.get("pupilDilation"),
        metrics.get("pupil"),
        metrics.get("pupil_size"),
        metrics.get("dilation"),
    )

    return {
        "timestamp": frame.get("timestamp"),
        "frame": {
            "attentionScore": attention_score,
            "fixationLoss": fixation_loss,
            "pupilDilation": pupil_dilation,
        },
    }


class GazeBridgeClient:
    def __init__(self, server: str, bridge_id: str, device_label: str, transport: str, sdk_name: Optional[str]):
        self.server = server.rstrip("/")
        self.bridge_id = bridge_id
        self.device_label = device_label
        self.transport = transport
        self.sdk_name = sdk_name
        self._running = False

    def heartbeat_payload(self) -> Dict[str, Any]:
        return {
            "bridgeId": self.bridge_id,
            "deviceLabel": self.device_label,
            "transport": self.transport,
            "sdkName": self.sdk_name,
        }

    def send_heartbeat(self) -> None:
        post_json(f"{self.server}/api/bridge/gaze/heartbeat", self.heartbeat_payload())

    def send_frame(self, frame: Dict[str, Any]) -> None:
        payload = normalize_frame(frame)
        payload.update(self.heartbeat_payload())
        post_json(f"{self.server}/api/bridge/gaze/frame", payload)

    def heartbeat_loop(self, interval_seconds: float) -> None:
        while self._running:
            try:
                self.send_heartbeat()
            except urllib.error.URLError as error:
                print(f"Heartbeat failed: {error}", file=sys.stderr)
            time.sleep(interval_seconds)

    def run_stdin_jsonl(self, heartbeat_interval: float) -> None:
        self._running = True
        thread = threading.Thread(
            target=self.heartbeat_loop,
            args=(heartbeat_interval,),
            daemon=True,
        )
        thread.start()

        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue

            frame = json.loads(line)
            self.send_frame(frame)

        self._running = False

    def run_file_tail(self, path: str, heartbeat_interval: float, poll_seconds: float) -> None:
        self._running = True
        thread = threading.Thread(
            target=self.heartbeat_loop,
            args=(heartbeat_interval,),
            daemon=True,
        )
        thread.start()

        offset = 0
        while self._running:
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    handle.seek(offset)
                    for line in handle:
                        line = line.strip()
                        if not line:
                            continue
                        frame = json.loads(line)
                        self.send_frame(frame)
                    offset = handle.tell()
            except FileNotFoundError:
                pass

            time.sleep(poll_seconds)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Forward gaze-device frames to the Wizard of Oz control app.")
    parser.add_argument("--server", required=True, help="Base URL of the local control server, for example http://127.0.0.1:3000")
    parser.add_argument("--bridge-id", required=True, help="Stable identifier for this bridge instance")
    parser.add_argument("--device-label", required=True, help="Human-readable gaze device label")
    parser.add_argument("--transport", default="sdk-http", help="Transport description shown in the admin UI")
    parser.add_argument("--sdk-name", default=None, help="Optional SDK name for diagnostics")
    parser.add_argument("--mode", choices=["stdin-jsonl", "file-tail"], default="stdin-jsonl")
    parser.add_argument("--file", default=None, help="Path to a JSONL file when using file-tail mode")
    parser.add_argument("--heartbeat-interval", type=float, default=5.0, help="Seconds between bridge heartbeats")
    parser.add_argument("--poll-seconds", type=float, default=0.5, help="Polling interval for file-tail mode")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    client = GazeBridgeClient(
        server=args.server,
        bridge_id=args.bridge_id,
        device_label=args.device_label,
        transport=args.transport,
        sdk_name=args.sdk_name,
    )

    try:
        client.send_heartbeat()
        if args.mode == "stdin-jsonl":
            client.run_stdin_jsonl(args.heartbeat_interval)
        else:
            if not args.file:
                raise ValueError("--file is required for file-tail mode")
            client.run_file_tail(args.file, args.heartbeat_interval, args.poll_seconds)
    except KeyboardInterrupt:
        return 0
    except Exception as error:
        print(f"Gaze bridge failed: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
