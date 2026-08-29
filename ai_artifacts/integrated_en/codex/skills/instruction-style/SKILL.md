---
name: "instruction-style"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** $impl-instrs:instr-context.

When creating or editing any instruction files, you MUST execute the following algorithm line by line:

### STEP 1: Ensure "Target Completeness"
1. Analyze input requirements.
2. Eliminate any fabricated details added for the sake of apparent "objective completeness" or an idealized spec template.
3. Keep ONLY those facts, meanings, and constraints that directly convey the vision of the task.

### STEP 2: Compress to "Conciseness"
1. Rewrite all retained points as directly and concisely as possible.
2. Remove filler words, introductory phrasing, and lengthy deliberations.
3. Ensure that each semantic unit has exactly one unambiguous formulation. Not a single word should waste space.

### STEP 3: Calibrate Abstraction Level
For each rule being formed, verify its level of abstraction:
1. **Check for over-specification:** Ensure the general rule is NOT described using terms of a specific example. If it is — generalize the wording.
2. **Check for over-abstraction:** Ensure the rule is NOT detached from the real context of the instruction. If it became vague — make it concrete.
*A rule must be generalized to exactly the level of the instruction itself.*

### STEP 4: Configure Framing (Positive / Negative Prompts)
1. Assess the risk of a critical agent error during instruction execution.
2. If the risk is high, add a strict negative prompt (prohibition) as an operational boundary.
3. PROHIBITED from duplicating the same meaning in both positive and negative framing (this wastes tokens).
4. If strict control is not required, use neutral notices instead of directive prompts.

### STEP 5: Use Imperative Style
1. Formulate all directives in the imperative mood (e.g., "Execute...", "Write...", "Verify...").
2. Avoid neutral or descriptive constructions like "You need to execute..." or "It is recommended to check...".
