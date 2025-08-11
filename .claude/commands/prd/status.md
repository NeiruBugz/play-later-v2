---
description: "Check PRD workflow progress and show current status with next steps"
allowed-tools: ["Read"]
---

# PRD Workflow Status: $ARGUMENTS

Let me check the current progress of your AI-assisted PRD workflow.

## Loading Workflow State

@documentation/prds/.$ARGUMENTS-state.json

## Progress Overview

Based on the workflow state file, I'll show you:

### Current Phase Progress

```
🔍 Phase 1: Requirement Discovery
├─ Status: [PENDING/IN_PROGRESS/COMPLETED]
├─ Started: [timestamp or "Not started"]
└─ Next: Review AI-generated requirements and user stories

🎯 Phase 2: Problem Analysis
├─ Status: [PENDING/IN_PROGRESS/COMPLETED]
├─ Started: [timestamp or "Not started"]
└─ Next: Validate problem statement and user personas

🏗️ Phase 3: Solution Design
├─ Status: [PENDING/IN_PROGRESS/COMPLETED]
├─ Started: [timestamp or "Not started"]
└─ Next: Review technical architecture and approve design

📝 Phase 4: PRD Generation
├─ Status: [PENDING/IN_PROGRESS/COMPLETED]
├─ Started: [timestamp or "Not started"]
└─ Next: Final PRD review and stakeholder approval
```

## Feature Details

- **Feature Name**: $ARGUMENTS
- **Started**: [workflow start timestamp]
- **Current Phase**: [1-4]/4
- **Estimated Completion**: [based on typical timeline]

## Available Actions

Based on your current phase, here are your next steps:

### If Phase 1 (Requirements) is current:

```bash
/prd/requirements $ARGUMENTS
```

- Execute AI requirement discovery agent
- Review generated user stories and questions
- Validate scope and priorities

### If Phase 2 (Problem Analysis) is current:

```bash
/prd/problem $ARGUMENTS
```

- Run AI problem analysis agent
- Validate problem statement and user personas
- Confirm competitive research

### If Phase 3 (Solution Design) is current:

```bash
/prd/solution $ARGUMENTS
```

- Execute AI solution design agent
- Review technical architecture
- Approve database and API changes

### If Phase 4 (PRD Generation) is current:

```bash
/prd/generate $ARGUMENTS
```

- Generate final comprehensive PRD
- Review complete document
- Submit for stakeholder approval

### If Workflow is Complete:

✅ **PRD Generated**: `documentation/prds/$ARGUMENTS-prd.md`

- Review final document
- Gather stakeholder approvals
- Begin development planning

## Workflow Health Check

### Completed Validations

- [ ] Requirements validated by human
- [ ] Problem statement confirmed
- [ ] Technical design approved
- [ ] Final PRD reviewed

### Potential Issues

If the workflow state file is missing or corrupted:

```bash
/prd/new $ARGUMENTS
```

This will reinitialize the workflow (previous work may be lost).

## Time Estimates

Typical timeline for AI-assisted PRD creation:

- **Phase 1**: 1-2 hours (AI analysis + human validation)
- **Phase 2**: 1-2 hours (Problem validation + user research)
- **Phase 3**: 2-3 hours (Technical review + architecture approval)
- **Phase 4**: 1 hour (Final review + formatting)

**Total**: 5-8 hours spread across multiple sessions

## Files Generated

Current workflow files for $ARGUMENTS:

- **State File**: `documentation/prds/.$ARGUMENTS-state.json`
- **Final PRD**: `documentation/prds/$ARGUMENTS-prd.md` (when complete)

## Next Steps Recommendation

Based on current status:

1. **Continue workflow**: Run the next phase command shown above
2. **Review progress**: Check AI outputs and human validations
3. **Get help**: Use `/prd` for command overview and help

---

The status above shows your current progress through the 4-phase AI-assisted PRD workflow. Each phase builds on the previous one with human validation ensuring accuracy and alignment.
