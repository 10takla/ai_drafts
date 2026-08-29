---
name: "impl-instrs:debug-feedback"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** [impl-instrs-instruction-style.md](*rule;file:///C:/Users/root/.gemini/config/plugins/impl_instrs/rules/impl-instrs-instruction-style.md*), [impl-instrs-workspace.md](*rule;file:///C:/Users/root/.gemini/config/plugins/impl_instrs/rules/impl-instrs-workspace.md*).

This skill provides step-by-step reasoning for agent decisions, delivers feedback, and diagnoses errors (debugging) in the **execution** and **authoring** processes of instruction files.

## Execution Algorithm

Upon explicit invocation by the operator, strictly execute the following steps in the specified order:

### Step 1: Initialization and Context Gathering
1. Analyze the operator request and determine the debugging subject: the *execution* process of existing instructions or the *authoring* (creation/update) process of instructions.
2. Use `list_dir` to scan the current instruction directory (including the `ai_instrs/` folder and its contents).
3. Read root rule and terminology files related to the subject of the request (using `view_file`) before accessing local files and drawing conclusions. This is a critical condition to prevent context loss.

### Step 2: Running Verification Checks

**If Subject is Instruction Execution:**
1. Read the target instruction file and the source code (or artifact) generated according to that instruction.
2. Analyze your own internal reasoning (thinking log) during task execution. Your goal is to understand how the current instruction wording led the agent to the undesired result.
3. Analyze the instruction files themselves to pinpoint where they were inaccurate, ambiguous, or erroneous (leading to flawed logic).
4. Record all detected deficiencies in the instructions: missing important constraints, abstract concepts instead of strict steps, contradictions, or lack of context.

**If Subject is Instruction Authoring:**
1. Read the generated instruction text.
2. Verify structure: check compliance with formatting rules, completeness, and conciseness.
3. Check for abstract philosophical concepts instead of strict imperative steps. Record them as critical errors.
4. Ensure there are no violations of core prompt-writing rules (redundant positive phrasing, improper abstraction level).

### Step 3: Generating Error Report and Proposals
1. Formulate a structured report for the operator.
2. **Instruction Vulnerability Rationale:** Based on analysis of your reasoning, explain why the instructions led the agent to an erroneous result (e.g., "the instruction contains conflicting requirements", "the constraint was described too abstractly, allowing it to be ignored").
3. Rely strictly on facts from the file system. Provide exact file references formatted as `[name](<relative/path/to/file.md>)`.
4. **Instruction Remediation Proposals:** Provide concrete wording to fix problematic instructions (translating abstract rules into clear steps, adding new negative prompts, etc.). PROHIBITED from applying changes autonomously — only propose them to the operator as text snippets (code templates or diff blocks).

## Strict Constraints
- PROHIBITED from autonomously making any changes to project files or applying code fixes during debugging. Only reading, analysis, and generation of a text report with rationale and plan are permitted.
- Prohibited from using generic statements or assuming system behavior without factual confirmation from logs or instruction files.
- Any claim of a violation must be accompanied by a link to a specific rule described in official instructions (e.g., style rules, execution context, or workspace constraints).
