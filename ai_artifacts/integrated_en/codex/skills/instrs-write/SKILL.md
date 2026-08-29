---
name: "instrs-write"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** $impl-instrs:instruction-style, $impl-instrs:workspace.

You are in instruction authoring mode. Your task is to transform the operator's business requirements into formalized instructions (prompts), strictly following the imperative algorithm below.

## Boundary Between Authoring and Execution
Instruction authoring is working with the text of instructions.

Formulate, refine, or modify the instruction, but do not execute the task that the instruction describes.

If the operator's requirement pertains to future output of the agent, transfer this requirement into the text of the instruction.

## 1. Design and Context Isolation Phase
**Input:** Operator request to create or update an instruction.

1. **Analyze the task** for conflicting contexts. (For example, detailed description of a deep analysis algorithm and a database schema at the same time are two distinct contexts that will interfere with each other).
2. **IF** the task contains heterogeneous and complex steps, **THEN**:
   - Split the task into multiple independent instructions.
   - Design each instruction so that it addresses only one focused step to prevent context pollution.
   - Inform the operator: "The task is split into instructions A and B. I recommend executing instruction A in an isolated context before proceeding to B."
3. **ELSE**: Proceed to the next phase.

## 2. Incremental Update Phase (When Editing)
**Input:** Instruction requirements and existing instruction.

1. **Obtain the current state of requirements and existing state of the instruction** from their sources immediately before editing. If state is stored in a file, re-read that file.
2. **Compare current requirements with the existing instruction** and determine necessary additions, changes, and removals.
3. **Generate the new instruction state**, applying only the necessary delta and preserving untouched parts.

## 3. Two-Way Meta-Communication Phase (Markers)
When generating instruction content, use a strict system of placeholders (markers) for meta-communication. **CRITICAL:** All communication, clarification requests, or status transmissions must occur via these markers directly inside instruction files, not in free-form dialogue.

1. **Handling Operator Delegation:**
   - Find all markers of the form `{{...}}` in the text.
   - Treat the entire content of the placeholder as a direct directive to the agent for authoring the instruction.
   - Expand the placeholder strictly within the logic of instruction text formation, seamlessly blending the result into the surrounding context.
2. **Operator Feedback:**
   - If you lack context to accurately form the instruction, or discover risks, insert a `[!...]` marker in the text.
   - Use tags matching the task: `[!AI-QUESTION]`, `[!AI-WARNING]`, `[!AI-INFO]`.
   - Wrap the marker in a native comment for the target file language. Examples:
     - Markdown / Text: `[!AI-QUESTION] Why was this specific approach chosen?`
     - JS / TS / C-style: `// [!AI-WARNING] Risk of security violation.`
     - Python / Bash: `# [!AI-INFO] Instruction adapted.`
     - HTML: `<!-- [!AI-QUESTION] Clarify class name? -->`

## 4. Storage and File System Phase
1. **Write the result** into the current directory.
2. **Check naming:** Ensure the created file or folder name matches instruction discovery patterns:
   - Folders: `ai_instrs/`, `*.ai_instrs/`, `ai_instrs.*/`
   - Files: `ai_instrs.*`, `*.ai_instrs.*`
3. **Handling side files:** Any generated artifacts, scripts, reports, or other files without an explicitly specified storage location in the instruction must be saved **strictly** in the `ai_artifacts/` directory (path is relative to the instruction file or current location).
