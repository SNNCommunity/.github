#!/usr/bin/env python3
"""Dimensionless 200-step LIF / matched-gain IF reference, Python 3 stdlib only."""
from __future__ import annotations

import argparse
import json


def simulate(model="LIF", tau=20.0, threshold=0.85, current=1.55, mode="step"):
    if model not in ("LIF", "IF") or mode not in ("step", "pulses"):
        raise ValueError("Unsupported model or input pattern")
    if not (5 <= tau <= 45 and 0.35 <= threshold <= 1.30 and 0.50 <= current <= 2.30):
        raise ValueError("Parameters out of portal bounds")
    v = 0.0
    traces, unreset, events, inputs = [0.0], [0.0], [], []
    for t in range(200):
        inp = 0.0
        if 12 <= t < 188:
            inp = current * 1.75 if mode == "pulses" and (t - 12) % 40 < 22 else (
                0.0 if mode == "pulses" else current
            )
        before = v + (inp - (v if model == "LIF" else 0.0)) / tau
        fired = before >= threshold
        if fired:
            events.append(t + 1)
        v = 0.0 if fired else before
        traces.append(v)
        unreset.append(before)
        inputs.append(inp)
    return {"model": model, "traces": traces, "unreset": unreset,
            "spikeTimes": events, "input": inputs, "dtMs": 1, "durationMs": 200,
            "firingRateHz": len(events) / 0.2}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", choices=("LIF", "IF"), default="LIF")
    parser.add_argument("--tau", type=float, default=20.0)
    parser.add_argument("--threshold", type=float, default=0.85)
    parser.add_argument("--current", type=float, default=1.55)
    parser.add_argument("--mode", choices=("step", "pulses"), default="step")
    args = parser.parse_args()
    print(json.dumps(simulate(args.model, args.tau, args.threshold,
                              args.current, args.mode), separators=(",", ":")))


if __name__ == "__main__":
    main()
