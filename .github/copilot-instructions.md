# NewPlus VS Code Extension - AI Development Guide

Last updated: 2025-10-06

## Architecture Overview

**NewPlus** is a VS Code extension that ports PowerToys' "New+" functionality - creating files/folders from templates with context-aware suggestions. It follows a **layered service architecture** with dependency injection.

### Core Services (Singleton Pattern)
```
extension.ts → Commands → Services → Models
                ↓
         Utils (Integration)
```

- **ConfigService**: Manages extension settings, defaults to `%LOCALAPPDATA%\Microsoft\PowerToys\NewPlus\Templates`
- **TemplateService**: Discovers templates from filesystem, maintains cache with 5-minute validity
- **VariableService**: Processes `$VARIABLE$` substitutions with recursion limit of 10 levels
- **NewFromTemplateCommand**: Orchestrates user flow with context-aware template filtering

### Key Integration Points
- **WorkspaceIntegration**: Project type detection (detects Node.js via `package.json`, Python via `requirements.txt`, etc.)
- **ContextMenuIntegration**: Filters templates based on right-click location (file vs folder context)
- **ErrorHandler**: Centralized error handling with user-friendly messages and actionable suggestions

## Critical Workflows

### Template Discovery Flow
1. `TemplateService.discoverTemplates()` reads configured directory
2. Each file/folder in root becomes a template (no metadata required)
3. File templates = single file; Folder templates = entire directory structure
4. **No `template.json` parsing** - templates are raw files/folders
5. Cache invalidates after 5 minutes or on filesystem changes (when `watchForChanges: true`)

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
// Use ErrorHandler for user-facing errors
try {
  await operation();
} catch (error) {
  await ErrorHandler.handleError(error, 'context description');
  return { success: false, error: String(error) };
}

// Or wrap operations:
const result = await ErrorHandler.withErrorHandling(
  async () => operation(),
  'creating template'
);
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
All services implement `dispose()` for cleanup:
```typescript
public async dispose(): Promise<void> {
  if (this.fileWatcher) {
    this.fileWatcher.dispose();
  }
  this.templatesCache.clear();
}
```

## Common Pitfalls

1. **Template paths**: Always use `vscode.Uri.file()` for filesystem operations, handle both Windows (`\`) and Unix (`/`) paths
2. **Cache invalidation**: TemplateService cache is 5-minute TTL - don't assume fresh discovery
3. **Variable recursion**: VariableService has max depth 10 - test circular references
4. **Context menu URIs**: Can be undefined (Command Palette) or point to files (use `WorkspaceIntegration.getTargetDirectory()`)
5. **Progress indication**: Use `vscode.window.withProgress()` only for multi-file operations (threshold: >1 file)

## Build & Debug

- **Watch mode**: `npm run watch` (or run task `npm: watch` from VS Code)
- **Run extension**: F5 in VS Code (launches Extension Development Host)
- **Compile**: `npm run compile` 
- **Lint**: `npm run lint` (ESLint with TypeScript plugin)
- **Package**: `vsce package` (requires vsce installed globally)

## Key Files Reference

- `src/extension.ts`: Extension lifecycle, service initialization
- `src/commands/newFromTemplate.ts`: Main command logic (350+ lines)
- `src/services/templateService.ts`: Template discovery, caching, filesystem operations
- `src/services/variableService.ts`: Variable substitution engine
- `src/utils/errorHandler.ts`: Comprehensive error types with user suggestions
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

## ⚠️ CRITICAL WARNINGS - Code Quality Issues

**BEFORE making changes, read `CODE_REVIEW.md` for known issues.**

### Known Dead Code (DO NOT EXTEND)
- `src/utils/logger.ts` - **NEVER USED** (100% dead code)
- Configuration migration system - export/import functions never called
- Template variables prompting - interface exists but not implemented
- Category/tag filtering - templates don't have categories populated

### Settings Mismatch
Only these 4 settings exist in `package.json`:
```json
templatesPath, display.hideFileExtensions, display.hideSortingPrefix, behavior.replaceVariablesInFilename
```

`Configuration` model defines 10+ more settings that **don't exist** - ignore them.

### Inconsistent Patterns
- Logging: Uses raw `console.*` everywhere despite having Logger class
- Error handling: Mix of ErrorHandler, try/catch, and silent errors
- Utils: Classes with static methods (should be functions)
- Async: Some race conditions in context analysis (see CODE_REVIEW.md #9)

### Performance Issues
- Template discovery loads ALL file content eagerly (should be lazy)
- Sequential file loading (should use Promise.all)
- Multi-layer caching for <20 templates (premature optimization)

### Refactoring Priorities
1. **Don't extend dead code** - Delete, don't build on top of unused features
2. **Match package.json** - Settings in models should match actual VS Code settings
3. **Simplify before adding** - 57% of codebase is unused (see metrics in CODE_REVIEW.md)

---

**Next Steps for AI Agents**: When adding features, maintain the service layer separation. All VS Code API calls go through Commands or Utils, never directly in Services. Cache invalidation is critical - update `TemplateService.onTemplatesDirectoryChanged()` for filesystem changes.