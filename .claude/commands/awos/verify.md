---
description: Verifies spec completion — checks acceptance criteria, marks Status as Completed.
---

Use `AskUserQuestion` tool for multiple-choice questions instead of plain text or numbered lists.

Refer to the instructions located in this file: .awos/commands/verify.md

## Adversarial review gate (project addition)

Before marking a spec's Status as Completed, run an independent fresh-context review of the spec's changes:

1. Invoke the `/code-review` skill on the current diff (or, if reviewing committed work, the spec's branch/PR range).
2. Treat findings that affect **correctness or a stated acceptance criterion** as blockers — do not mark Completed until they are resolved or explicitly waived by the user.
3. Ignore style-only or speculative findings unless the user asks otherwise (a gap-seeking reviewer over-reports; chasing every finding leads to over-engineering).

The reviewer runs in a separate context and sees only the diff, so it grades the result on its own terms rather than the reasoning that produced it.
