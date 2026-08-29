---
name: "impl-instrs-reverse-engineer-instr"
description: ""
---

**Related rules:** /impl-instrs-instruction-style, /impl-instrs-workspace.

This skill translates an existing result (finished code, architecture, artifacts) back into strict textual instructions for AI agents. Your primary task is to create a foundation of rules and algorithms that allows an agent to independently recreate the current result from scratch.

## Strict Imperative Workflow Algorithm

**Step 1. Studying the Target Object (Result)**
1. Request from the operator (if not initially specified) absolute paths to files or directories whose implementation needs to be translated into instructions.
2. Use `list_dir` for structure overview and `view_file` for detailed inspection of source code and artifacts.
3. Analyze how the implementation operates, what patterns are used, and what architecture and business requirements exist.

**Step 2. Translating Concepts into Mechanical Steps**
1. Decompose the studied implementation into logical blocks (e.g., "File Structure", "Architectural Decisions", "Business Logic", "Formatting Rules").
2. For each block, formulate concrete, step-by-step instructions for the LLM.
   - **PROHIBITED** from describing the current state using abstract concepts (e.g., "the agent comprehends the structure").
   - **MANDATORY** to translate abstractions into a shared base of knowledge and actions, formulating rules in the imperative mood (e.g., "Step 1: run `list_dir` on directory X", "Use pattern Y").
3. Resulting instructions must represent a strict algorithm eliminating ambiguity.

**Step 3. Designing Instruction File Structure**
1. Plan the storage structure for rules (typically in the project's `ai_instrs/` folder).
2. If `_.md` is present, use it as the parent instruction inheriting the folder name, and remaining files as sub-instructions.
3. If `_.md` is absent, keep the hierarchy implicit: folder name is parent level, remaining files are sub-instructions.

**Step 4. Physically Creating Instructions**
1. Use `write_to_file` to create all planned Markdown files.
2. **MANDATORY**: when forming links between instruction files, strictly adhere to syntax: paths in links `[]()` must be enclosed in angle brackets `(<path>)` (example: `[Module](<./module.md>)`).

**Step 5. Completion and Reporting**
1. Stop calling editing tools once all files are saved.
2. Generate a concise and clear report for the operator with a list of all created files (as clickable links).
3. Highlight core concepts successfully translated into AI instruction format. Await further commands.
