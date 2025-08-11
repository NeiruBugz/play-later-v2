---
description: "AI-Assisted PRD Creation Workflow - Main command with help and overview"
allowed-tools: ["Read", "Write", "Bash"]
---

# AI-Assisted PRD Workflow

Welcome to the AI-assisted Product Requirements Document creation system for PlayLater!

## Available Commands

### Start New PRD

- `/prd/new <feature-name>` - Initialize a new PRD workflow

### Workflow Phases

- `/prd/requirements <feature-name>` - Phase 1: AI requirement discovery
- `/prd/problem <feature-name>` - Phase 2: AI problem analysis
- `/prd/solution <feature-name>` - Phase 3: AI solution design
- `/prd/generate <feature-name>` - Phase 4: Generate final PRD

### Management

- `/prd/status <feature-name>` - Check workflow progress
- `/prd` - Show this help (current command)

## Workflow Overview

The AI-assisted PRD process consists of 4 phases with human validation at each step:

```
1. Requirements Discovery  🔍
   ├─ AI expands feature concept into detailed requirements
   ├─ Generates clarifying questions and user stories
   └─ Human validates scope and priorities

2. Problem Analysis       🎯
   ├─ AI analyzes problem statement and user research
   ├─ Defines target personas and current state
   └─ Human confirms problem-solution fit

3. Solution Design        🏗️
   ├─ AI creates technical specification
   ├─ Designs architecture and integration approach
   └─ Human approves technical feasibility

4. PRD Generation         📝
   ├─ AI assembles comprehensive PRD document
   ├─ Synthesizes all previous phase outputs
   └─ Human reviews and finalizes for stakeholder approval
```

## Quick Start

```bash
# Start new feature PRD
/prd/new gaming-goals

# Work through phases (use after each human validation)
/prd/requirements gaming-goals
/prd/problem gaming-goals
/prd/solution gaming-goals
/prd/generate gaming-goals

# Check progress anytime
/prd/status gaming-goals
```

## How It Works

Each command uses Claude Code's Task tool to execute specialized AI agents:

- **Requirement Discovery Agent**: Expands concepts into detailed requirements
- **Problem Analysis Agent**: Validates problem statements and user research
- **Solution Design Agent**: Creates technical specifications aligned with PlayLater architecture
- **PRD Generation Agent**: Assembles final comprehensive PRD document

## File Outputs

- **Workflow State**: `documentation/prds/.{feature-name}-state.json`
- **Final PRD**: `documentation/prds/{feature-name}-prd.md`
- **Agent Prompts**: `documentation/ai-agents/*.md`
- **PRD Template**: `documentation/templates/ai-collaborative-prd-template.md`

## Integration with PlayLater

The AI agents are specifically trained on:

- Next.js 15 + App Router architecture
- Prisma ORM + PostgreSQL database patterns
- Repository pattern implementation
- shadcn/ui component library
- Steam API and IGDB integrations
- Existing feature ecosystem

This ensures generated PRDs are technically feasible and architecturally consistent.

---

**Next Steps**: Run `/prd/new <your-feature-name>` to begin your AI-assisted PRD creation journey!
