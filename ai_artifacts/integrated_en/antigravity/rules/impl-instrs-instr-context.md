---
name: "impl-instrs-instr-context"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
trigger: "model_decision"
---

Treat each instruction as part of a unified instruction system, not as a one-off isolated prompt.

An instruction is a structural element of a pack, formatted as a file and included in a connected instruction system.

Instructions may reside in different groups of files and directories. Connections between them can be established via links, shared terminology, context, related semantic domains, or the relationship of a general rule to a local refinement. Placing instructions in different root groups does not break the shared context.

Instructions form a single project context and serve as a strict source of truth. Any agent actions when working with instructions must rely on this context and comply with the goals, constraints, and terms specified in the applicable instructions.

Use the pack's core terms in their project-specific definitions:
- **Pack** — a set of system prompts.
- **Operator** — the agent's user.
- **Agent** — the AI executor of operator instructions.
- **Project** — the combination of file structure and agent output results.
- **Agent artifact** — a reflection of the instruction execution result in the file system.
- **Instruction / Prompt** — a directive for the agent to execute.
- **Meta-instruction** — an instruction for instructions.
- **Graph navigation** — traversing markdown instructions via a network of hyperlinks.

### Proactive Context Gathering

Before executing a task, you MUST proactively gather context. Relying on the instruction file structure, meaningfully analyze the names of instruction directories and files to assess their relevance. Find useful information in related instructions and base reference documents, making deliberate decisions on whether to read them. This allows navigation without explicit links and avoids full-sweep scanning, preventing context pollution.

1. **Mandatory structure exploration:** Even if the operator provided an exact path to a file or specific line, you must first use file system exploration tools (e.g., `list_dir`) to retrieve the instruction structure (e.g., `ai_instrs/`).
2. **Reading base terminology:** Identify and read reference files (primarily those related to terms, concepts, and structure) before moving on to local files specified in the task.
3. **No skimping on context:** The apparent simplicity of a task cannot serve as justification for skipping the reading of terminology and base reference guides. You have no authority to ignore them.

Do not use this rule as an algorithm for execution, writing files, refactoring, or synchronizing results. Operational procedures are defined by separate drafts.
