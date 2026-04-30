# Issue tracker: GitHub (primary) + Linear (secondary)

Issues and PRDs for this repo live as GitHub issues on `NeiruBugz/play-later-v2`. Use the `gh` CLI for all operations.

Linear is used as a complementary system for AWOS spec sync via `/awos:linear` (creates Linear Milestones on the Lauter project from `context/spec/NNN-name/`). Skills that say "publish to the issue tracker" should default to **GitHub** unless the user explicitly says "Linear" or invokes an `awos:*` skill.

## Conventions (GitHub)

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Repo is inferred from `git remote -v` automatically by `gh`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Linear (secondary)

Only used when:
- The user explicitly mentions Linear, or
- An AWOS skill (`/awos:linear`, `/awos:spec`, `/awos:tasks`) is invoked and pushes to Linear.

Use the `mcp__linear-server__*` tools (e.g. `list_issues`, `save_issue`, `list_projects`) rather than a CLI. Lauter is the project where AWOS specs land as Milestones.
