---
description: "Phase 2: AI Problem Analysis - Validate problem statement and define target users"
allowed-tools: ["Read", "Write", "Task"]
---

# Phase 2: Problem Analysis for $ARGUMENTS

Building on the validated requirements from Phase 1, I'll now use our Problem Analysis AI agent to create a comprehensive problem statement and user research analysis.

## Current Workflow Status

Let me check the current state and previous phase results:

@documentation/prds/.$ARGUMENTS-state.json

## Problem Analysis AI Agent

The Problem Analysis Agent will:

1. **Articulate the core problem** this feature solves
2. **Define target user personas** affected by the problem
3. **Analyze the current user journey** and identify pain points
4. **Quantify the problem impact** with suggested metrics
5. **Research competitive landscape** and similar solutions
6. **Assess risks** of NOT implementing this feature

### Agent Context

Using the validated requirements from Phase 1, the AI agent will:

- Reference your feature concept and validated requirements
- Focus on PlayLater's gaming backlog management context
- Consider existing user base and platform capabilities
- Analyze integration with Steam API and IGDB data

### Executing Problem Analysis

I'll use the Task tool with our problem-analysis-agent prompt, incorporating:

- **Validated Requirements**: From Phase 1 human validation
- **PlayLater Context**: Gaming platform with backlog management focus
- **User Research Prompts**: Questions to validate with actual user data
- **Competitive Analysis**: Similar features in gaming platforms

## AI Agent Execution

The agent will generate a structured problem analysis including:

### Core Problem Statement

Clear articulation of the user problem and why it matters

### Target User Personas

- Primary users most affected by this problem
- Secondary users who would benefit
- User characteristics and motivations

### Current State Analysis

- How users currently handle this problem (or don't)
- Pain points in existing workflows
- Gaps in current PlayLater functionality

### Problem Impact Metrics

- Suggested ways to measure the problem
- Baseline metrics to track improvement
- Success indicators for the solution

### Competitive Research

- How other gaming platforms address this problem
- Opportunities for differentiation
- Lessons learned from existing solutions

## Human Validation Required

After the AI analysis, you'll need to validate:

1. **Problem Accuracy** - Does the AI correctly understand the core problem?
2. **User Personas** - Are the target users accurately defined?
3. **Current State** - Does the analysis match your observations?
4. **Metrics** - Are the suggested measurements realistic and valuable?
5. **User Research** - Can you provide actual user feedback or data?

## Next Steps

After validation, we'll:

1. **Update workflow state** with validated problem analysis
2. **Move to Phase 3** - `/prd/solution $ARGUMENTS` for technical design
3. **Incorporate your feedback** into the comprehensive solution design

---

**Executing Problem Analysis AI Agent** - This will generate a comprehensive problem statement and user research analysis for your validation.
