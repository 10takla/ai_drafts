**Related rules:** @draft(instruction-style), @draft(workspace).

Upon explicit invocation of this skill, execute the instruction specified by the operator only after proactive context gathering.

### Step 1: Examine the Root Structure
Regardless of how specific the operator's request is, first obtain the structure of the root instruction directory.

Even if the operator specified an exact path, line, or section, this does not waive the requirement for primary exploration of the instruction structure.

### Step 2: Read Base Terminology
Identify root reference files related to terms, concepts, and instruction structure.

Read these files before proceeding to the local files of the task.

Do not ignore this step under the pretext of apparent task simplicity.

### Step 3: Find Related Context
Meaningfully analyze directory and file names and links within the read instructions.

Find related instructions that may influence the understanding of the target instruction.

Use targeted reading. Avoid full scans unless required to understand the target instruction.

### Step 4: Obtain the Current State of Requirements
Immediately before execution, obtain the current state of the target instruction from its actual source. If the instruction is stored in a file, re-read the file or fragment specified by the operator from the file system.

Treat the retrieved requirement state as the source of truth. Do not execute the instruction from a copy cached in context.

### Step 5: Obtain the Existing State of the Result
If a result from prior execution exists, obtain its current state from the actual source.

Do not use a result copy cached in context instead of checking its current state.

### Step 6: Form the New State of the Result
Compare the current requirement state with the existing result state. Apply necessary additions, changes, and removals, preserving untouched parts.

If the operator requested an independent new result, create it without modifying the previous result.

All actions must rely on the gathered context, terminology, and applicable constraints.

### Critical Rule
Do not skimp on context. The agent has no authority to skip reading global terminology and root files before executing an instruction.
