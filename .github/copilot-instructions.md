# NewPlus VS Code Extension - AI Development Guide

Last updated: 2025-10-06 (Post Phase 2 Refactoring)

## Architecture Overview

**NewPlus** is a VS Code extension that ports PowerToys' "New+" functionality - creating files/folders from templates with context-aware suggestions. It follows a **layered service architecture** with dependency injection.

### Core Services (Singleton Pattern)
```
extension.ts → Commands → Services → Models
                ↓
         Utils (Pure Functions)
```

- **ConfigService**: Manages extension settings, defaults to `%LOCALAPPDATA%\Microsoft\PowerToys\NewPlus\Templates`
- **TemplateService**: Discovers templates from filesystem with lazy content loading
- **VariableService**: Processes `$VARIABLE$` substitutions with recursion limit of 10 levels
- **NewFromTemplateCommand**: Orchestrates user flow with context-aware template filtering

### Key Integration Points
- **WorkspaceIntegration**: Project type detection (detects Node.js via `package.json`, Python via `requirements.txt`, etc.)
- **ContextMenuIntegration**: Filters templates based on right-click location (file vs folder context)
- **Utils (functions)**: Validation, file operations, path utilities - all exported as pure functions

## Critical Workflows

### Template Discovery Flow
1. `TemplateService.discoverTemplates()` reads configured directory
2. Each file/folder in root becomes a template (no metadata required)
3. File templates = single file; Folder templates = entire directory structure
4. **No `template.json` parsing** - templates are raw files/folders
5. **Lazy loading**: Content loaded on-demand via `loadTemplateContent()` when template is used
6. **Parallel discovery**: Uses `Promise.all()` for fast template enumeration

### Variable Processing Rules
- Pattern: `$VARIABLE_NAME$` (uppercase, underscores allowed)
- Built-in vars: `$DATE$`, `$TIME$`, `$YEAR$`, `$MONTH$`, `$DAY$`, `$USER$`, `$RANDOM$`, `$UUID$`
- Context vars: `$WORKSPACE_NAME$`, `$TARGET_DIR$`, `$TARGET_PATH$`
- Recursion depth: 10 levels max to prevent infinite loops
- Variables in filenames require `newFromTemplate.behavior.replaceVariablesInFilename: true`

### Command Registration Pattern
```typescript
// In extension.ts activate()
const disposables = [
  vscode.commands.registerCommand('newFromTemplate.createFromTemplate', 
    (uri?: vscode.Uri) => newFromTemplateCommand.execute(uri)
  )
];
context.subscriptions.push(...disposables);
```

## Testing Strategy

- **Unit tests**: Use Mocha framework with `@vscode/test-electron`
- **Test structure**: Mirror `src/` in `tests/` (e.g., `src/services/configService.ts` → `tests/services/configService.test.ts`)
- **Integration tests**: Located in `tests/integration/` for cross-component workflows
- Run with: `npm test` (compiles first via `pretest` script)

### Example Test Pattern
```typescript
test('Should validate template name correctly', () => {
  // Unit test using pure functions
});
```

## Code Conventions

### TypeScript Strict Mode
- All code uses TypeScript 5.0+ with `strict: true`
- No implicit returns, explicit error handling required
- Prefer `async/await` over promises for VS Code APIs

### Error Handling
```typescript
// Simple console-based error handling
try {
  await operation();
} catch (error) {
  console.error('NewPlus:', error);
  vscode.window.showErrorMessage(`Error: ${error}`);
  return { success: false, error: String(error) };
}
```

### Service Initialization
Services require explicit initialization in `extension.ts`:
```typescript
configService = new ConfigService();
await configService.initialize();

templateService = new TemplateService(configService);
await templateService.initialize();
```

### Disposal Pattern
Services implement `dispose()` for cleanup:
```typescript
public async dispose(): Promise<void> {
  // Clean up resources
  this.templates = [];
}
```

## Common Pitfalls

1. **Template paths**: Always use `vscode.Uri.file()` for filesystem operations, handle both Windows (`\`) and Unix (`/`) paths
2. **Lazy loading**: Template content only loaded when needed - call `loadTemplateContent()` before use
3. **Variable recursion**: VariableService has max depth 10 - test circular references
4. **Context menu URIs**: Can be undefined (Command Palette) or point to files (use `WorkspaceIntegration.getTargetDirectory()`)
5. **Progress indication**: Use `vscode.window.withProgress()` only for multi-file operations (threshold: >1 file)
6. **Util functions**: Import specific functions from `utils/index.ts`, not classes (e.g., `import { isValidFileName } from '../utils'`)

## Build & Debug

- **Watch mode**: `npm run watch` (or run task `npm: watch` from VS Code)
- **Run extension**: F5 in VS Code (launches Extension Development Host)
- **Compile**: `npm run compile` 
- **Lint**: `npm run lint` (ESLint with TypeScript plugin)
- **Package**: `vsce package` (requires vsce installed globally)

## Key Files Reference

- `src/extension.ts`: Extension lifecycle, service initialization
- `src/commands/newFromTemplate.ts`: Main command logic (~650 lines)
- `src/services/templateService.ts`: Template discovery with lazy loading (~250 lines)
- `src/services/configService.ts`: Configuration management (~130 lines)
- `src/services/variableService.ts`: Variable substitution engine
- `src/utils/index.ts`: Validation, file ops, path utilities (pure functions ~330 lines)
- `src/utils/contextMenuIntegration.ts`: Context-aware template filtering (~130 lines)
- `src/utils/workspaceIntegration.ts`: Project type detection
- `package.json`: Command contributions, context menu integration points

## Configuration Properties

```json
{
  "newFromTemplate.templatesPath": "string - Path to templates directory",
  "newFromTemplate.display.hideFileExtensions": "boolean - Clean display names",
  "newFromTemplate.display.hideSortingPrefix": "boolean - Strip leading digits",
  "newFromTemplate.behavior.replaceVariablesInFilename": "boolean - Enable filename vars"
}
```

## Context Menu Integration

Commands appear when:
- `explorerResourceIsFolder || !explorerResourceIsRoot` - Right-click on folder/file in explorer
- `file/newFile` menu group - File → New File menu

Contextual filtering uses `ContextMenuIntegration.getContextualTemplates()` to suggest folder templates when right-clicking folders, file templates for file contexts.

---

## Refactoring History (Phase 1 & 2 Complete - Oct 2025)

### What Was Removed
- ❌ **Logger service** (`src/utils/logger.ts`) - 125 lines, never imported
- ❌ **ErrorHandler** (`src/utils/errorHandler.ts`) - 165 lines, replaced with simple console.*
- ❌ **Template caching** - Multi-layer cache removed, templates stored in-memory array
- ❌ **Configuration migrations** - Import/export/validate/merge methods deleted
- ❌ **Template metadata** - TemplateVariable, category, tags, timestamps removed
- ❌ **Context analysis** - 80-line analyzeFileContext() with extension mapping deleted
- ❌ **Duplicate code** - Removed duplicate path expansion logic
- ❌ **Static util classes** - Converted ValidationUtils, FileOperationUtils, PathUtils to functions

### Total Lines Removed
- **~900 lines of dead/duplicate code** (56% reduction in problem areas)
- Models: 180→30 (Configuration), 140→50 (Template)
- Services: 280→130 (ConfigService), 340→250 (TemplateService)
- Utils: Deleted 290 lines (logger, errorHandler), simplified 200→130 (contextMenu)
- Converted 280 lines of static classes to 330 lines of pure functions

### Current Architecture Benefits
✅ **Fast template discovery** - Parallel Promise.all(), lazy content loading  
✅ **Simple error handling** - Consistent console.* with 'NewPlus:' prefix  
✅ **Lean models** - Only 4 settings matching package.json  
✅ **Pure functions** - No static classes, easier to test and compose  
✅ **No caching overhead** - Direct filesystem reads (6-20 templates = instant)  
✅ **Async-safe** - Fixed race conditions in context detection  

### What Remains
The extension is now focused on core functionality:
- Template discovery from filesystem
- Variable substitution ($VARIABLE$ pattern)
- Context-aware template suggestions
- File/folder creation from templates
- PowerToys NewPlus compatibility

---

**Next Steps for AI Agents**: The codebase is now clean and focused. When adding features:
1. Keep models simple - match package.json settings exactly
2. Use pure functions from utils - avoid classes with static methods
3. Lazy-load resources - don't cache prematurely
4. Async patterns - always await, use Promise.all() for parallel ops
5. Error handling - console.error with 'NewPlus:' prefix, show user messages
6. Test coverage - mirror src/ structure in tests/