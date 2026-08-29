---
name: "simultaneous-update-instrs-result"
description: "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это."
---

**Related rules:** $impl-instrs:instruction-style, $impl-instrs:workspace.

Execute $impl-instrs:instrs-write to formulate or update the applicable instruction.

Then execute $impl-instrs:instr-execution to execute the updated instruction.
