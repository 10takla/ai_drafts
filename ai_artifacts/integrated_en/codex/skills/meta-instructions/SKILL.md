---
name: "meta-instructions"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** $impl-instrs:instruction-style, $impl-instrs:workspace.

**Core idea:** The capability to author instructions at any level, including instructions for instructions.

## Strict Imperative Workflow Algorithm

Upon receiving a task to create or modify a meta-instruction, strictly follow these steps in the specified order:

### Step 1. Analysis of Existing Base
1. Discover and read existing rules using `ai_instrs` file and folder patterns.
2. Determine which level of abstraction the task belongs to (e.g., baseline agent behavior, prompt authoring rules, directory structure).
3. Check the concept for lack of overlap with existing instructions. Strictly adhere to the principle of isolated areas of responsibility.

### Step 2. Translating Concepts into Algorithms
Direct transfer of abstract business requirements is prohibited. Translate every conceptual idea into an executable algorithm:
1. Replace abstract intentions (e.g., "agent should analyze the situation") with concrete tool invocation steps (e.g., "Step 1: Use tool X. Step 2: Execute search Y").
2. Formulate a unified, clear, and unambiguous set of rules for the target object.
3. Describe activation triggers if the instruction must trigger automatically (in accordance with `trigger: model_decision` standards).

### Step 3. Interconnections and Reuse
1. If the new meta-instruction utilizes logic described in another instruction, use explicit links formatted as `[Name](<Path>)`.
2. Never duplicate logic from related objects.

### Step 4. Formatting and Validation
1. Format the resulting document in Markdown with mandatory YAML frontmatter (if applicable).
2. Ensure the resulting text contains no ambiguous interpretations and represents a strict technical pipeline.

### Step 5. Application
1. Form a file name strictly matching discovery patterns (e.g., `name.ai_instrs.md`).
2. Save the file in the current directory using exclusively allowed relative paths.
