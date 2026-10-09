# Reproducible neuron reference · v1

This directory contains a **zero-dependency, CPU-only** Python reference to the two
educational neuron models used in the [SNN Community Lab](https://snncommunity.github.io/.github/#lab).

## Scope and evidence

This is a **deterministic mathematical cross-implementation check**, **not** a published
task-level SNN benchmark, independent paper reproduction, energy test or hardware result.

LIF (dimensionless): `V[t+1] = V[t] + (I[t] - V[t])/tau`.
Matched-gain IF: `V[t+1] = V[t] + I[t]/tau`.
When pre-reset `V[t+1] >= threshold`, emit a spike at `t+1` and store `V[t+1] = 0`.
Both start at `V[0] = 0`, use `dt = 1 ms` and run **200** updates.
There are 201 samples per trace. The sole between-model difference is the `-V[t]` term.

Step input is on for `12 <= t < 188`. The pulse setting uses `1.75 * current`
for the first 22 steps in a 40-step cycle starting at step 12, restricted to the same window.

## Run

```bash
python3 experiments/lif-reference/run.py --model LIF --tau 20 --threshold 0.85 --current 1.55 --mode step > lif.json
python3 experiments/lif-reference/run.py --model IF --tau 20 --threshold 0.85 --current 1.55 --mode step > if.json
node --test tests/neuron-core.test.mjs
```

No random seeds or external datasets are used because these are fully deterministic
forward simulations. JSON output contains post-reset voltage, threshold-crossing pre-reset
voltage, input per update interval and integer spike times. The output can be compared
directly against the JavaScript implementation in `docs/neuron-core.js`.

GitHub Actions runs the cross-language checks on the public repository. Test success
establishes *agreement between these implementations on tested configurations*,
not general validation against biological recordings or published algorithms.

Maintainers should update this reference and the lab atomically if discretization,
input protocol, threshold or reset semantics change.
