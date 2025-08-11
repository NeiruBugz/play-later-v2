---
description: "Phase 1: AI Requirement Discovery - Expand feature concept into detailed requirements"
allowed-tools: ["Read", "Write", "Task"]
---

# Phase 1: Requirement Discovery for $ARGUMENTS

I'll use our specialized AI agent to analyze your feature concept and generate comprehensive requirements.

## Loading Workflow State

Let me first check the current state and user input for this feature:

@documentation/prds/.$ARGUMENTS-state.json

## Executing Requirement Discovery AI Agent

I'll now launch the Requirement Discovery Agent using the Task tool with your feature concept:

Based on the workflow state, I'll use the Task tool to execute our specialized AI agent for requirement discovery. The agent will:

1. **Analyze your feature concept** from the stored user input
2. **Generate clarifying questions** about scope, users, and technical requirements
3. **Suggest user stories** following best practices
4. **Identify integration points** with existing PlayLater features
5. **Highlight edge cases** to consider

### AI Agent Prompt

I'll use our requirement-discovery-agent prompt template with your specific feature details:

@documentation/ai-agents/requirement-discovery-agent.md

### Executing Task

The Task tool will run with:

- **Agent Type**: general-purpose
- **Context**: PlayLater platform with Next.js, Prisma, Steam integration
- **Input**: Your feature concept and business requirements
- **Output**: Comprehensive requirements analysis

## After AI Analysis

Once the AI agent completes its analysis, I will:

1. **Present the AI findings** including questions, user stories, and integration considerations
2. **Request your validation** - Please review and provide feedback on:

   - Are the clarifying questions relevant?
   - Do the suggested user stories match your vision?
   - Are there missing use cases or edge cases?
   - How do you want to prioritize the requirements?

3. **Update workflow state** with AI outputs and your human validation
4. **Prepare for Phase 2** - Guide you to `/prd/problem $ARGUMENTS` for problem analysis

## Human Validation Checkpoint

This is a critical validation point. Please carefully review the AI analysis and provide:

- ✅ **Approval** of requirements scope and priorities
- 🔄 **Refinements** if the AI missed important aspects
- ❌ **Corrections** if the AI misunderstood your concept

Your feedback ensures we move forward with accurate, validated requirements before diving into problem analysis.

---

**Ready to proceed?** The AI agent will now analyze your feature concept and generate comprehensive requirements for human validation.
