# Claude Code Standards & Rules

**Last Updated**: 2026-01-25
**Project**: fdm-monster

---

## CODE FORMATTING & STYLE RULES

### 1. Edit Documentation (MANDATORY)
All code modifications must be marked with timestamps:

```typescript
// Single-line edit:
const foo = bar; // edited by claude on YYYY.MM.DD.HH.MM

// Multi-line edit:
function example() {
  // edited by claude on YYYY.MM.DD.HH.MM
  const a = 1;
  const b = 2;
  return a + b;
  // End of Claude's edit
}
```

### 2. File Organization
- **New functions/functionality**: Create separate files in the same directory
- **Utilities**: Use `*.utils.ts` suffix
- **Composables**: Use `*.composable.ts` suffix
- **Components**: PascalCase `.vue` files
- **Prefer editing existing files** for modifications to existing functionality
- Only create new files when adding new functionality or utilities

### 3. Code Style
- TypeScript with strict typing
- Composition API (setup script)
- Explicit imports (no wildcards)
- Destructure composables: `const { executeOperation } = useFileOperationFeedback()`

### 4. File Operations
- Use specialized tools (Read, Edit, Write) instead of bash commands
- Only read files before editing or writing to them

### 5. Documentation Files
- **NEVER proactively create documentation files** (*.md, README) unless explicitly requested

### 6. Communication
- Be concise (1-4 lines for simple tasks)
- No unnecessary preamble/postamble
- Reference code using `file_path:line_number` format
- Never use bash echo or comments to communicate

### 7. Task Management
- Use TodoWrite for complex tasks (3+ steps)
- Mark todos in_progress before starting
- Mark completed immediately after finishing
- Break complex tasks into smaller steps

### 8. Testing (MANDATORY)
- **Create or update automated tests** for all code changes
- Test files should be located in `test/` directory
- Use descriptive test names that explain what is being tested
- Test both success and error cases
- Run tests before committing to ensure all tests pass
- Test coverage requirements:
  - New features: Create new test file or add tests to existing suite
  - Bug fixes: Add test that reproduces the bug, then fix it
  - API changes: Update API tests to match new behavior
  - Refactoring: Ensure existing tests still pass
- Never commit code without verifying tests pass

---

## RESPONSE GUIDELINES

### Verbosity
- **Concise**: 1-4 lines for simple tasks
- **Direct**: No unnecessary preamble/postamble
- **Complete**: Provide all necessary information
- Match detail level to task complexity

### Tool Usage
- Use TodoWrite for complex tasks (3+ steps)
- Batch independent tool calls in single message
- Prefer specialized tools over bash (Read vs cat, Edit vs sed)
- Never use bash/comments to communicate with user

### Code References
Reference code with `file:line` format:
```
Clients are marked as failed in connectToServer() at src/services/process.ts:712
```

---

## SPECIAL INSTRUCTIONS

### Security
- Assist with defensive security only
- Refuse malicious code requests
- No credential harvesting tools

### Proactiveness
- Only be proactive when user requests action
- Answer questions before taking actions
- Don't surprise user with unrequested changes

### Professional Objectivity
- Prioritize technical accuracy over validation
- Correct errors objectively
- Investigate uncertainty before confirming beliefs

### Rule Conflicts & Clarification
- **Ask for clarification** if a request or action creates conflict with any of these rules
- Do not proceed with conflicting actions until user provides direction

### Rule Maintenance
- **Determine when these rules need updated** based on:
  - New patterns emerging in the codebase
  - Repeated conflicts or edge cases
  - Technology stack changes
  - User feedback or corrections
- When rules need updating:
  - Tell user about the proposed update
  - Explain why the update is needed
  - Request approval before updating the rules file

---

## LOADING THESE RULES

### Automatic Loading
These rules should be loaded at the start of each chat session. To enable automatic loading:

1. **Option 1: Add to Claude Code settings** (if supported)
   - Add this file path to your Claude Code startup files
   - Path: `/Users/jaysen/git/fdm-monster/.AI-support/CLAUDE_RULES.md`

2. **Option 2: Manual reference at chat start**
   - Start each session by asking Claude to read this file:
   - "Please read /Users/jaysen/git/fdm-monster/.AI-support/CLAUDE_RULES.md"

3. **Option 3: Create a startup prompt**
   - If Claude Code supports custom startup prompts for projects
   - Configure it to automatically read this file

**Note**: If you need help setting up automatic loading, ask me and I'll guide you through the available options for your setup.
