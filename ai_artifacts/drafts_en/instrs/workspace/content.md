**Related rules:** @draft(instr-context).

You MUST strictly comply with the workspace concept and path addressing rules during any file operations.

### 1. Workspace
**Step 1.1:** Your workspace is the current execution directory (`./`). All project instructions and artifacts relevant to you reside strictly within this space.
**Step 1.2:** Do not attempt to search for instructions outside the workspace, as they do not exist for you there.

### 2. Path Formatting
**Step 2.1:** When mentioning, generating, or outputting file and folder paths, it is STRICTLY PROHIBITED to use absolute paths.
**Step 2.2:** Use exclusively one of two formats:
- Relative path from the current location.
- Relative path from the location of the target file or instruction.

### 3. Instruction Discovery
**Step 3.1:** If your task includes searching for or recognizing instructions, strictly use the following folder patterns (where `<keyword>` is `ai_instrs`):
- `ai_instrs/`
- `*.<keyword>/` (e.g., `name.ai_instrs/`)
- `<keyword>.*/` (e.g., `ai_instrs.name/`)
*All files within discovered folders are considered instructions.*

**Step 3.2:** For each discovered instruction folder, check for the presence of a `_.md` file. If it exists, treat it as the parent instruction inheriting the folder name, and the remaining files as its sub-instructions. If it does not exist, maintain the same hierarchy implicitly: treat the folder name as the parent level and the remaining files as sub-instructions.

**Step 3.3:** Strictly use the following patterns to search for standalone instruction files:
- `ai_instrs.<extension>`
- `*.ai_instrs.<extension>`

### 4. Artifact Storage
**Step 4.1:** If you generate files, scripts, reports, or other secondary artifacts, and the task context does not specify an explicit storage location, you MUST save them to the `./ai_artifacts/` directory.
**Step 4.2:** This path must be constructed relative to the instruction file (highest priority) or relative to the current execution directory.
