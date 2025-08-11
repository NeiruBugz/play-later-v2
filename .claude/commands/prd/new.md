---
description: "Start new AI-assisted PRD workflow - Initialize feature concept and begin requirement discovery"
allowed-tools: ["Write", "Read", "Task", "Bash"]
---

# Start New PRD Workflow: $ARGUMENTS

I'll initialize a new AI-assisted PRD workflow for the feature: **$ARGUMENTS**

## Step 1: Initialize Workflow State

First, let me create the workflow state file to track our progress:

!mkdir -p documentation/prds

```json
{
  "featureName": "$ARGUMENTS",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "currentPhase": 1,
  "phases": {
    "requirements": {
      "status": "pending",
      "startedAt": null,
      "completedAt": null
    },
    "problem": { "status": "pending", "startedAt": null, "completedAt": null },
    "solution": { "status": "pending", "startedAt": null, "completedAt": null },
    "generation": {
      "status": "pending",
      "startedAt": null,
      "completedAt": null
    }
  },
  "userInput": "",
  "aiOutputs": {},
  "humanValidations": {}
}
```

## Step 2: Collect Initial Feature Concept

Please provide your initial feature concept following this format:

**Feature Name**: $ARGUMENTS
**Description**: [High-level feature description]
**Target Users**: [Who will use this feature and why]
**Business Context**: [Why this feature matters to PlayLater]
**Initial Success Metrics**: [How you'll measure success - optional]

---

### Example Format:

```
Feature Name: Gaming Achievement Tracker
Description: Allow users to track and showcase gaming achievements across multiple platforms, with social features and progress visualization
Target Users: Achievement hunters and completionist gamers who want to showcase their gaming accomplishments
Business Context: Increase user engagement through social features and provide additional value beyond basic backlog management
Initial Success Metrics: 40% of users create at least one achievement showcase, 25% increase in daily active users
```

---

**Please paste your feature concept above, then I'll proceed with Phase 1: Requirement Discovery using our AI agent.**

Once you provide the concept, I'll:

1. Save your input to the workflow state
2. Launch the Requirement Discovery AI agent using the Task tool
3. Generate detailed requirements analysis with clarifying questions
4. Present the results for your validation
5. Guide you to the next phase: `/prd/requirements $ARGUMENTS`

This ensures we capture your vision accurately before the AI begins its analysis.
