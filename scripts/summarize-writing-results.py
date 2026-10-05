#!/usr/bin/env python3
"""Reproduce descriptive writing summaries; never alter participant source files.

Run from the repository root. This reproduces existing cohort/outcome coding;
it does not adjudicate missing outcomes or conduct significance tests.
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from statistics import mean, stdev

CONDITIONS = ("control", "constant", "adaptive")
WORKLOAD = ("mentalDemand", "physicalDemand", "temporalDemand", "performance", "effort", "frustration")
ASSISTANCE = ("helpfulness", "timingEffectiveness", "clarityAndDistraction", "stressReduction")


def describe(values):
    return {"n": len(values), "mean": mean(values) if values else None,
            "participant_sd": stdev(values) if len(values) > 1 else None}


def summarize(source):
    contents = source.read_bytes()
    data = json.loads(contents)
    rows = data["rounds"]
    assert len({(r["participant"], r["sessionId"], r["round"]) for r in rows}) == len(rows)
    people = [p for p in data["participants"] if p["cohort"] == "complete"]
    ids = [p["id"] for p in people]
    complete = [r for r in rows if r["cohort"] == "complete"]
    for row in rows:
        if row["status"] != "completed":
            assert row["analysisSolved"] is None
            continue
        scores = [row["survey"][k] for k in WORKLOAD]
        assert all(type(x) in (int, float) and 1 <= x <= 7 for x in scores)
        calculated = (sum(scores) + 8 - 2 * scores[3]) / 6
        assert abs(calculated - row["tlxMean"]) < 1e-9

    def performance(selected):
        output = {}
        for condition in CONDITIONS:
            group = [r for r in selected if r["condition"] == condition and r["status"] == "completed"]
            coded = [r for r in group if r["analysisSolved"] in (0, 1)]
            solved = sum(r["analysisSolved"] for r in coded)
            output[condition] = {"completed": len(group), "coded": len(coded), "solved": solved,
                                 "solve_rate": solved / len(coded) if coded else None}
        return output

    conditions = {}
    for condition in CONDITIONS:
        group = [r for r in complete if r["condition"] == condition]
        for pid in ids:
            subject = [r for r in group if r["participant"] == pid]
            assert len(subject) == 3 and all(r["status"] == "completed" for r in subject)
        output = performance(group)[condition]
        for key in ("durationSeconds", "hints", "robots", "tlxMean"):
            output[key] = describe([mean(r[key] for r in group if r["participant"] == pid) for pid in ids])
        output["survey"] = {}
        for key in WORKLOAD + (() if condition == "control" else ASSISTANCE):
            output["survey"][key] = describe([mean(r["survey"][key] for r in group if r["participant"] == pid) for pid in ids])
        output["puzzle_counts"] = dict(sorted(Counter(r["puzzle"] for r in group).items()))
        output["hints_total"] = sum(r["hints"] for r in group)
        output["robot_cues_total"] = sum(r["robots"] for r in group)
        output["rounds_over_300_seconds"] = sum(r["durationSeconds"] > 300 for r in group)
        conditions[condition] = output

    finals = [p["final"] for p in people if p.get("final")]
    return {
        "snapshot_date": data["compiledAt"], "source_file": source.as_posix(),
        "source_sha256": hashlib.sha256(contents).hexdigest(),
        "scope": "Descriptive interim snapshot; existing source coding retained; no inferential tests.",
        "aggregation": "Three rounds averaged within participant and condition; means and sample SD across complete participants. Solve rates use coded completed rounds.",
        "complete_participants": ids, "complete_rounds": len(complete), "scheduled_rounds": len(rows),
        "completed_rounds": sum(r["status"] == "completed" for r in rows),
        "provisional_participants": [p["id"] for p in data["participants"] if p["provisional"]],
        "condition_order_counts": dict(Counter(p["order"] for p in people)),
        "primary": conditions,
        "recorded_only": performance([r for r in complete if r["outcomeBasis"] == "recorded"]),
        "available_rounds": performance(rows),
        "overall": {k: describe([f[k] for f in finals]) for k in ("overallHelpfulness", "overallEfficacy", "trust", "automationBias")},
        "nonempty_comments": sum(bool(f.get("comment", "").strip()) for f in finals),
        "source_exclusions": data["exclusions"], "source_audit": data["audit"],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = summarize(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.output}: {len(result['complete_participants'])} complete participants; {result['completed_rounds']} completed rounds overall.")
