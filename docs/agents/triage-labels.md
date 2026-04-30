# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used on `NeiruBugz/play-later-v2`.

| Canonical role     | Label in our tracker | Meaning                                  |
| ------------------ | -------------------- | ---------------------------------------- |
| `needs-triage`     | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`       | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`  | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`  | `ready-for-human`    | Requires human implementation            |
| `wontfix`          | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Status

`wontfix` already exists on the repo. The other four labels do not yet exist — the `triage` skill will create them on first use, or you can create them upfront:

```bash
gh label create needs-triage    --color FBCA04 --description "Maintainer needs to evaluate"
gh label create needs-info      --color D4C5F9 --description "Waiting on reporter"
gh label create ready-for-agent --color 0E8A16 --description "Fully specified, AFK-ready"
gh label create ready-for-human --color 1D76DB --description "Needs human implementation"
```
