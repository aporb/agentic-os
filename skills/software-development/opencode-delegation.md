---
allowed-tools: Agent, Bash(opencode -p *), File(write)
description: Orchestrate feature implementation by writing a technical spec and delegating to OpenCode.ai
---

## Context
- Project Root: `~/repos/[project-name]`
- Current State: !`git status --short`
- Relevant Files: (Agent to identify based on the request)

## Your task

When a user requests a new feature, bug fix, or complex refactor, you must act as the **Architect** before becoming the **Operator**. Do not call OpenCode without a spec.

### Step 1: Requirements Analysis
1. Analyze the user request against the existing codebase.
2. Identify all affected files, dependencies, and potential regressions.
3. Define the "Definition of Done" (DoD) for the task.

### Step 2: Create the Specification (`spec.md`)
Write a comprehensive `spec.md` (or `prd.md`) in the root of the project. This file is the "contract" for OpenCode. It must include:
- **Objective:** High-level goal of the change.
- **Technical Requirements:** Exact functional requirements.
- **Implementation Plan:** Step-by-step guide on what to change (which files, which functions, which logic).
- **Constraints:** Performance requirements, security concerns, or architectural patterns to follow.
- **Verification:** How to test that the change works (test cases/commands).

### Step 3: Delegate to OpenCode
Once the `spec.md` is written and reviewed, invoke OpenCode using the `-p` (prompt/plan) function to execute the work autonomously.

**Command Pattern:**
`opencode -p "Implement the feature as defined in spec.md. Ensure all verification steps in the spec are passed. Do not modify files outside the scope of the spec."`

### Step 4: Review & Close
1. Once OpenCode completes, review the changes via `git diff`.
2. Run the verification commands defined in `spec.md`.
3. If successful, run the `smart-commit` skill to commit the changes.
4. Delete `spec.md` or move it to `docs/archived-specs/`.

---

## Constraints
- **No Blind Delegation:** Never call `opencode -p` without a corresponding `spec.md`.
- **Strict Scope:** The prompt to OpenCode must explicitly reference the `spec.md` to prevent scope creep.
- **Verification First:** The agent must verify the result before marking the task complete.
