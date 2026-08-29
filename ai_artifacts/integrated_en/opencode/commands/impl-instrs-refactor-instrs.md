---
name: "impl-instrs-refactor-instrs"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** /impl-instrs-instruction-style, /impl-instrs-workspace.

This skill provides a strict imperative algorithm for reorganizing and improving existing instruction files. Its primary goal is to preserve the semantics of original instructions while improving file structure and providing strict context isolation for higher-quality task execution by agents.

## 📋 Strict Execution Algorithm

Upon invocation of this skill by the operator, strictly follow the step-by-step algorithm.

### Step 1: Input Analysis
1. Call `view_file` to read the target instruction files specified by the operator. If files are not specified, use `list_dir` or `grep_search` to find files matching `ai_instrs` patterns.
2. Extract and record the original semantics, requirements, and logic from the instructions. Not a single business requirement may be lost during refactoring.

### Step 2: Evaluating Context Isolation
1. Analyze each instruction for conflicting or overly detailed steps (e.g., combining deep information search and writing complex code in a single file).
2. **Separation Rule:** If detailed description of one step hinders focus on another, decide to split them into independent instructions.
3. Design a scenario where the operator can give the agent the first instruction, and only after its complete execution in an isolated context — the second.

### Step 3: Designing File Structure
1. Plan the new file and folder hierarchy.
2. **Path Constraints:** When mentioning file and folder paths, use **only relative paths** (from the current location or target files). The use of absolute paths is strictly prohibited.
3. Ensure new names match instruction discovery patterns (e.g., folder `ai_instrs/` or file suffix `.ai_instrs.md`).
4. **Artifacts:** If during refactoring you need to create a plan, report, or script, save it in the `./ai_artifacts/` directory (relative to the instruction file or current location).

### Step 4: Applying Changes
1. Use `write_to_file` to create new instruction files and `replace_file_content` (or `multi_replace_file_content`) to update existing ones.
2. When creating links between instructions, use markdown format strictly observing angle brackets for paths: `[Step Name](<relative_path_to_file>)`.
3. Ensure files are physically separated according to the plan from Step 2, preventing context pollution.

### Step 5: Verification
1. Compare the result with the original semantics recorded in Step 1.
2. Ensure instruction meaning is 100% preserved, and changes affected only structure and focus distribution.
3. Output a change report for the operator and provide instructions (or links to them) for further use.
