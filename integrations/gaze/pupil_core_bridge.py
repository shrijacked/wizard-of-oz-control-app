#!/usr/bin/env python3
"""Forward Pupil Capture gaze/pupil frames into the local study server."""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from typing import Any


def post_json(url: str, payload: dict[str, Any]) -> None:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        response.read()


def clamp_unit(value: Any) -> float | None:
    if not isinstance(value, (int, float)):
        return None
    number = float(value)
    if number < 0:
        return 0.0
    if number > 1:
        return 1.0
    return number


def normalize_pupil_diameter(value: Any) -> float | None:
    if not isinstance(value, (int, float)):
        return None
    number = float(value)
    if number <= 0:
        return None
    if number <= 1:
        return number
    return max(0.0, min(1.0, number / 8.0))


def map_pupil_messages(gaze: dict[str, Any] | None, pupil: dict[str, Any] | None) -> dict[str, Any]:
    gaze = gaze or {}
    pupil = pupil or {}
    confidence = clamp_unit(gaze.get("confidence", pupil.get("confidence")))
    diameter = normalize_pupil_diameter(
        pupil.get("diameter_3d")
        or pupil.get("diameter")
        or gaze.get("diameter_3d")
        or gaze.get("diameter")
    )
    return {
        "attentionScore": confidence,
        "fixationLoss": None if confidence is None else 1.0 - confidence,
        "pupilDilation": diameter,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bridge Pupil Capture ZMQ gaze into the study app.")
    parser.add_argument("--server", default="http://127.0.0.1:3000")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=50020)
    parser.add_argument("--bridge-id", default="pupil-core")
    parser.add_argument("--device-label", default="Pupil Core")
    parser.add_argument("--heartbeat-interval", type=float, default=5)
    parser.add_argument("--min-frame-interval", type=float, default=0.1)
    return parser.parse_args()


def connect_pupil(host: str, port: int):
    try:
        import msgpack
        import zmq
    except ImportError as error:
        raise SystemExit(
            "Pupil Core bridge needs pyzmq and msgpack. Install with: python3 -m pip install pyzmq msgpack"
        ) from error

    context = zmq.Context()
    request = context.socket(zmq.REQ)
    request.RCVTIMEO = 2000
    request.SNDTIMEO = 2000
    request.connect(f"tcp://{host}:{port}")
    try:
        request.send_string("SUB_PORT")
        sub_port = request.recv_string()
    except zmq.error.Again as error:
        raise SystemExit(
            f"Pupil Capture is not answering on {host}:{port}. Start Pupil Capture and enable the Network API."
        ) from error

    subscriber = context.socket(zmq.SUB)
    subscriber.connect(f"tcp://{host}:{sub_port}")
    subscriber.subscribe("gaze")
    subscriber.subscribe("pupil")
    subscriber.subscribe("pupil.")
    subscriber.RCVTIMEO = 1000
    return msgpack, subscriber, request


def main() -> int:
    args = parse_args()
    server = args.server.rstrip("/")
    print(f"Connecting to Pupil Capture at {args.host}:{args.port}", flush=True)
    msgpack, subscriber, request = connect_pupil(args.host, args.port)

    heartbeat_payload = {
        "bridgeId": args.bridge_id,
        "deviceLabel": args.device_label,
        "transport": "pupil-zmq",
        "sdkName": "Pupil Capture",
    }
    last_heartbeat = 0.0
    last_frame = 0.0
    latest_pupil: dict[str, Any] | None = None

    print("Pupil Core bridge is running. Waiting for gaze frames.", flush=True)

    while True:
        now = time.time()
        if now - last_heartbeat >= args.heartbeat_interval:
            try:
                post_json(f"{server}/api/bridge/gaze/heartbeat", heartbeat_payload)
                last_heartbeat = now
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
                print(f"Heartbeat failed: {error}", file=sys.stderr, flush=True)

        try:
            topic = subscriber.recv_string()
            payload = msgpack.loads(subscriber.recv(), raw=False)
        except Exception:
            continue

        if not isinstance(payload, dict):
            continue

        if topic.startswith("pupil"):
            latest_pupil = payload
            continue

        if not topic.startswith("gaze"):
            continue

        if now - last_frame < args.min_frame_interval:
            continue

        frame = map_pupil_messages(payload, latest_pupil)
        try:
            post_json(
                f"{server}/api/bridge/gaze/frame",
                {
                    **heartbeat_payload,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "frame": frame,
                },
            )
            last_frame = now
        except (urllib.error.URLError, TimeoutError) as error:
            print(f"Gaze frame post failed: {error}", file=sys.stderr, flush=True)

    request.close()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(0)
