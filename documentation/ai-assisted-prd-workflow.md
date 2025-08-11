# AI-Assisted PRD Creation Workflow

This document outlines the iterative, AI-assisted process for creating Product Requirements Documents (PRDs) with human-in-the-loop validation and refinement.

## Overview

The PRD creation process uses AI agents to assist in requirement gathering, analysis, and documentation while maintaining human oversight and decision-making at each critical step.

## Workflow Phases

### Phase 1: Initial Requirement Discovery

#### Step 1.1: Human Input Gathering

**Human Action**: Provide initial feature concept

- Feature name and high-level description
- Target user personas
- Business context and motivation
- Initial success metrics (if known)

#### Step 1.2: AI Agent - Requirement Expansion

**AI Agent Task**: "Requirement Discovery Agent"

**Agent Prompt**:

```
You are a Product Requirements Discovery Agent for a gaming backlog management platform called PlayLater.

Context:
- Platform helps users manage their gaming backlogs
- Users can track games, write reviews, set goals, import from Steam
- Built with Next.js, Prisma, PostgreSQL, shadcn/ui
- Existing features: game management, reviews, Steam integration, user profiles

Human Input: {feature_concept}

Tasks:
1. Analyze the feature concept and identify potential user needs
2. Generate clarifying questions about the requirements
3. Suggest related use cases and edge cases to consider
4. Identify potential integration points with existing features
5. Propose initial user stories in "As a [user], I want [goal] so that [benefit]" format

Format your response as:
## Questions for Clarification
[List 8-10 specific questions]

## Suggested User Stories
[List 5-8 user stories]

## Integration Considerations
[List potential touchpoints with existing features]

## Edge Cases to Consider
[List 4-6 edge cases]
```

**Human Review**: Review AI suggestions and provide answers/feedback

#### Step 1.3: Iterative Refinement

**Process**:

- Human answers AI questions and provides additional context
- AI generates refined requirements based on feedback
- Repeat until requirements scope is clear

### Phase 2: Problem Definition & User Research

#### Step 2.1: AI Agent - Problem Analysis

**AI Agent Task**: "Problem Analysis Agent"

**Agent Prompt**:

```
You are a Problem Analysis Agent specializing in gaming and productivity platforms.

Input: {refined_requirements_from_phase1}

Tasks:
1. Articulate the core problem this feature solves
2. Define the target user personas affected
3. Analyze the current user journey and pain points
4. Quantify the problem impact (suggest metrics to measure)
5. Research similar solutions in competitor products
6. Identify risks of NOT implementing this feature

Format your response as a structured problem statement with:
## Core Problem Statement
## Target User Personas
## Current State Analysis
## Problem Impact Metrics
## Competitive Landscape
## Risk Assessment
```

**Human Review**: Validate problem analysis, provide user research data, correct assumptions

#### Step 2.2: Human Validation & User Research

**Human Action**:

- Conduct user interviews/surveys if needed
- Validate problem statement with stakeholders
- Provide real user feedback and data
- Confirm or adjust user personas

### Phase 3: Solution Design & Requirements Specification

#### Step 3.1: AI Agent - Solution Architecture

**AI Agent Task**: "Solution Design Agent"

**Agent Prompt**:

```
You are a Solution Design Agent for the PlayLater gaming platform.

Current Architecture:
- Next.js 15 with App Router
- PostgreSQL with Prisma ORM
- Repository pattern: Server Actions → Repository → Database
- shadcn/ui components with Tailwind CSS
- Steam API integration
- NextAuth.js v5 for authentication

Problem Context: {validated_problem_statement}
Requirements: {user_stories_and_requirements}

Tasks:
1. Design a solution that fits the existing architecture
2. Define required data models and database changes
3. Identify necessary API endpoints and server actions
4. Map out the user interface flow and components needed
5. Specify integration points with existing features
6. Define success metrics and how to track them
7. Identify technical risks and mitigation strategies

Format as:
## Proposed Solution Overview
## Data Model Requirements
## API & Server Action Design
## UI/UX Flow
## Integration Specifications
## Success Metrics & Tracking
## Technical Risks & Mitigations
```

**Human Review**: Review technical approach, validate feasibility, adjust scope if needed

#### Step 3.2: AI Agent - Requirements Specification

**AI Agent Task**: "Requirements Specification Agent"

**Agent Prompt**:

```
You are a Requirements Specification Agent creating detailed functional and non-functional requirements.

Solution Design: {approved_solution_design}

Tasks:
1. Create detailed functional requirements with acceptance criteria
2. Define non-functional requirements (performance, security, accessibility)
3. Specify API contracts and data schemas
4. Define error handling and edge case behaviors
5. Create test scenarios for each requirement
6. Identify dependencies on other teams/systems
7. Estimate complexity and development effort

Format as:
## Functional Requirements
[Each with detailed acceptance criteria]

## Non-Functional Requirements
## API Specifications
## Error Handling Requirements
## Test Scenarios
## Dependencies & Assumptions
## Effort Estimation
```

**Human Review**: Validate requirements completeness, adjust priorities, confirm scope

### Phase 4: PRD Generation & Finalization

#### Step 4.1: AI Agent - PRD Assembly

**AI Agent Task**: "PRD Generation Agent"

**Agent Prompt**:

```
You are a PRD Generation Agent that creates comprehensive Product Requirements Documents.

Inputs:
- Validated problem statement: {problem_statement}
- Approved solution design: {solution_design}
- Detailed requirements: {requirements_specification}
- User research insights: {user_research}

Tasks:
1. Synthesize all inputs into a cohesive PRD document
2. Ensure all sections are complete and consistent
3. Add implementation timeline and milestones
4. Include risk assessment and mitigation plans
5. Define launch criteria and rollout strategy
6. Create executive summary for stakeholder review

Use the PRD template structure but populate with all gathered information.
Ensure technical accuracy and business viability.
```

#### Step 4.2: Human Review & Approval

**Human Action**:

- Review complete PRD for accuracy and completeness
- Validate business alignment and technical feasibility
- Get stakeholder sign-offs
- Finalize timeline and resource allocation

#### Step 4.3: PRD Publication

**Process**:

- Save final PRD to `documentation/prds/[feature-name]-prd.md`
- Share with development team
- Add to project roadmap
- Create tracking tickets

## AI Agent Implementation

### Recommended AI Agent Setup

#### Option 1: Using Claude Code Task Tool

```typescript
// Example usage in development process
const prdAgent = await Task({
  subagent_type: "general-purpose",
  description: "Generate feature requirements",
  prompt: `${requirementDiscoveryPrompt}
  
  Feature concept: ${userInput}
  Context: ${existingCodebaseContext}`,
});
```

#### Option 2: External AI Integration

- Use OpenAI GPT-4 or Claude API for agent implementation
- Create dedicated scripts for each agent type
- Implement conversation memory for iterative refinement

### Agent Prompt Templates

Store standardized agent prompts in:

```
documentation/ai-agents/
├── requirement-discovery-agent.md
├── problem-analysis-agent.md
├── solution-design-agent.md
├── requirements-specification-agent.md
└── prd-generation-agent.md
```

## Human-in-the-Loop Checkpoints

### Mandatory Human Reviews

1. **After Requirement Discovery** - Validate scope and priorities
2. **After Problem Analysis** - Confirm problem-solution fit
3. **After Solution Design** - Approve technical approach
4. **After Requirements Specification** - Finalize acceptance criteria
5. **After PRD Generation** - Final approval and sign-off

### Review Criteria

- **Business Alignment** - Does this solve a real user problem?
- **Technical Feasibility** - Can we build this with our current stack?
- **Resource Availability** - Do we have capacity for this scope?
- **Strategic Fit** - Does this align with product roadmap?
- **User Value** - Will users actually use and benefit from this?

## Quality Gates

### PRD Approval Checklist

- [ ] Problem statement validated with user research
- [ ] Solution design reviewed by technical lead
- [ ] Requirements have clear acceptance criteria
- [ ] Success metrics are measurable and tracked
- [ ] Timeline and resources are realistic
- [ ] Dependencies identified and coordinated
- [ ] Risks assessed with mitigation plans
- [ ] Stakeholder alignment achieved

## Tools and Templates

### Required Templates

- `documentation/templates/prd-template.md` - Base PRD structure
- `documentation/templates/user-story-template.md` - User story format
- `documentation/templates/acceptance-criteria-template.md` - AC format

### AI Agent Tools

- Conversation history tracking
- Codebase context integration
- User research data integration
- Automated formatting and validation

## Example Workflow Execution

### Sample Feature: "Gaming Goals & Progress Tracking"

#### Phase 1 Input:

```
Feature: Gaming Goals
Description: Allow users to set and track gaming goals like "complete 5 RPGs this year"
User Type: Dedicated gamers who want to be more intentional about their gaming
Business Goal: Increase user engagement and retention
```

#### AI Agent 1 Output (abbreviated):

```
## Questions for Clarification
1. Should goals be time-based (monthly/yearly) or quantity-based?
2. How should users track progress - manual check-offs or automated?
3. Should there be social features like sharing goals or competing with friends?
4. What types of goals should be supported (genre-based, completion-based, rating-based)?
...

## Suggested User Stories
1. As a goal-oriented gamer, I want to set a completion goal for this year so that I stay motivated to finish my backlog
2. As a competitive player, I want to share my goals with friends so that we can encourage each other
...
```

This iterative process continues through each phase until a comprehensive PRD is created with both AI efficiency and human judgment.

## Benefits of This Approach

- **Comprehensive Coverage** - AI helps identify requirements humans might miss
- **Consistency** - Standardized prompts ensure consistent quality
- **Efficiency** - Reduces time spent on initial drafts and research
- **Quality** - Human oversight ensures business and technical viability
- **Documentation** - Creates audit trail of decision-making process
- **Knowledge Transfer** - Captures reasoning behind requirements for future reference

The result is a thorough, well-reasoned PRD that balances AI assistance with human expertise and judgment.
