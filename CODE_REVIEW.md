# NewPlus Extension - Architecture & Patterns

**Version**: 0.1.7  
**Last Updated**: October 6, 2025

---

## Design Philosophy

NewPlus follows a **lean, functional architecture** focused on core template functionality. The design prioritizes:

1. **Simplicity** - Match PowerToys NewPlus simplicity (file copier, not enterprise framework)
2. **Performance** - Lazy loading, parallel operations, minimal overhead
3. **Maintainability** - Pure functions, clear separation of concerns
4. **Type Safety** - TypeScript strict mode, interfaces matching reality

---

## Architecture Patterns

### Service Layer
```typescript
extension.ts → Commands → Services → Models
                 ↓
              Utils (Pure Functions)
```

**Services** (Singleton Pattern):
- `ConfigService` - VS Code settings integration
- `TemplateService` - Template discovery and content loading
- `VariableService` - $VARIABLE$ substitution engine

**Commands**:
- `NewFromTemplateCommand` - Main template creation workflow
- `OpenTemplatesFolderCommand` - Simple folder opener

**Utils** (Functional):
- Exported pure functions (not classes)
- Validation: `isValidFileName()`, `isValidTemplateName()`
- File ops: `fileExists()`, `copyFile()`, `readFile()`
- Path utils: `normalize()`, `expandEnvironmentVariables()`

### Error Handling
Simple console-based pattern:
```typescript
try {
  await operation();
} catch (error) {
  console.error('NewPlus:', error);
  vscode.window.showErrorMessage(`Error: ${error}`);
  return { success: false, error: String(error) };
}
```

### Async Patterns
- Always `await` (no `.then()` chains)
- Use `Promise.all()` for parallel operations
- Proper error boundaries

---

## Performance Considerations

### Template Discovery
**Lazy Loading**:
- Discovery scans filenames only (no content reading)
- Content loaded on-demand via `loadTemplateContent()`
- Instant for typical 6-20 templates

**Parallel Operations**:
```typescript
// Good: Parallel
const templates = await Promise.all(
  entries.map(async ([name, type]) => this.createTemplate(name, type))
);

// Avoid: Sequential
for (const entry of entries) {
  await this.createTemplate(entry);  // Blocks
}
```

### No Caching
For 6-20 templates, direct filesystem reads are faster than cache management overhead.

---

## Code Patterns

### Pure Functions Over Classes
```typescript
// Prefer:
export function isValidFileName(name: string): boolean { ... }

// Avoid:
export class ValidationUtils {
  static isValidFileName(name: string): boolean { ... }
}
```

**Benefits**: Better tree-shaking, easier testing, functional composition

### Minimal Models
Interfaces should match actual usage:

```typescript
// Configuration - matches package.json exactly
export interface Configuration {
  templatesPath: string;
  hideFileExtensions: boolean;
  hideSortingPrefix: boolean;
  replaceVariablesInFilename: boolean;
}

// Template - simple file/folder representation
export interface Template {
  name: string;
  description: string;
  type: 'file' | 'folder';
  path: string;
  files: TemplateFile[];
}
```

**Avoid**: Adding fields "for future use" that aren't implemented

---

## Integration Points

### VS Code APIs
- `vscode.workspace.fs.*` - All file operations
- `vscode.window.showQuickPick()` - Template selection
- `vscode.window.showInputBox()` - Name prompting
- `vscode.commands.registerCommand()` - Command registration

### Context Menu Integration
Commands appear based on:
- Explorer context (file vs folder)
- Workspace availability
- Context variables in `package.json`

### PowerToys Compatibility
- Same default path: `%LOCALAPPDATA%\Microsoft\PowerToys\NewPlus\Templates`
- Same structure: Raw files/folders
- Same variables: `$DATE$`, `$USER$`, etc.

---

## Testing Strategy

### Structure
```
tests/
  commands/       - Command tests
  services/       - Service unit tests
  models/         - Model/interface tests
  utils/          - Pure function tests
  integration/    - Cross-component tests
```

### Patterns
```typescript
// Test pure functions directly
test('Should validate template name correctly', () => {
  assert.ok(utils.isValidTemplateName('MyTemplate'));
  assert.ok(!utils.isValidTemplateName('invalid/name'));
});

// Test services with mocks when needed
test('Should discover templates from directory', async () => {
  const templates = await templateService.discoverTemplates();
  assert.ok(templates.length > 0);
});
```

---

## Common Pitfalls

1. **Path Handling**: Always use `vscode.Uri.file()`, handle both `/` and `\`
2. **Async Race Conditions**: Always `await` filesystem operations
3. **Context Detection**: URI can be undefined (Command Palette invocation)
4. **Variable Recursion**: VariableService has max depth 10
5. **Content Loading**: Call `loadTemplateContent()` before using template

---

## Extension Points

### Adding New Variables
```typescript
// In variableService.ts
private getBuiltInVariables(): Map<string, string> {
  return new Map([
    ['DATE', new Date().toLocaleDateString()],
    ['YOUR_VAR', yourValue],  // Add here
  ]);
}
```

### Adding Template Filters
```typescript
// In contextMenuIntegration.ts
export function getContextualTemplates(
  templates: Template[],
  context: TemplateContext
): { suggested: Template[]; other: Template[] }
```

### Adding Settings
1. Add to `package.json` contributes.configuration
2. Add to `Configuration` interface in models
3. Read in `ConfigService.loadConfiguration()`

---

## Development Guidelines

### Before Committing
```bash
npm run compile   # TypeScript compilation
npm run lint      # ESLint checks
npm test          # Run test suite
```

### Code Style
- TypeScript strict mode enabled
- Prefer `const` over `let`
- Use async/await (not callbacks)
- Pure functions when possible
- Explicit error handling

### Documentation
- JSDoc comments for public APIs
- Inline comments for complex logic
- Update README.md for user-facing changes

---

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [PowerToys NewPlus](https://learn.microsoft.com/en-us/windows/powertoys/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**This extension prioritizes simplicity and performance over abstraction.**

---

## 🔴 CRITICAL ISSUES

### 1. **Logger Service Completely Unused**
**Location**: `src/utils/logger.ts` (125 lines)

**Problem**: 
- Full logger implementation with singleton pattern, output channel, log levels
- **NEVER imported or used anywhere in the codebase**
- All actual logging uses raw `console.log/warn/error` (40+ instances)

**Impact**: 
- 125 lines of dead code
- Maintenance burden for unused code
- Misleading for developers (suggests there's a logging strategy when there isn't)

**Fix**:
```typescript
// Either DELETE logger.ts entirely, OR
// Replace all console.* calls with logger.*
```

**Files to check**:
```bash
grep -r "console\." src/ | wc -l  # 40+ instances
grep -r "import.*logger" src/     # 0 instances
```

---

### 2. **Configuration Model Over-Engineering**
**Location**: `src/models/configuration.ts` (180+ lines)

**Problem**:
- Defines complex migration system (`ConfigurationMigration`, `ConfigurationMigrationStep`)
- Export/import functionality for configuration
- JSON schema validation
- **NONE OF THIS IS USED** - package.json has 4 simple settings

**Actual VS Code Settings**:
```json
{
  "newFromTemplate.templatesPath": "string",
  "newFromTemplate.display.hideFileExtensions": "boolean",
  "newFromTemplate.display.hideSortingPrefix": "boolean",
  "newFromTemplate.behavior.replaceVariablesInFilename": "boolean"
}
```

**Model Defines** (but aren't in package.json):
- `showQuickPick`, `createSubfolders`, `enableCaching`, `cacheTimeout`, `watchForChanges`
- `excludePatterns`, `maxRecentTemplates`, `showProgress`, `defaultEncoding`, `openAfterCreation`

**Impact**:
- 60% of configuration code is dead/unreachable
- Settings that don't exist in package.json can't be set by users
- Confusing for maintainers

**Fix**:
```typescript
// Simplify to match actual settings:
export interface Configuration {
  templatesPath: string;
  hideFileExtensions: boolean;
  hideSortingPrefix: boolean;
  replaceVariablesInFilename: boolean;
}
```

---

### 3. **Template Model Bloat**
**Location**: `src/models/template.ts`

**Problem**:
- `Template.variables` array - never populated (templates are raw files, not metadata-based)
- `Template.category`, `tags`, `version`, `createdAt`, `modifiedAt` - never set or used
- `TemplateFile.encoding`, `isBinary` - never used
- `TemplateVariable` interface (60+ lines) - completely unused (no variable prompting)

**Reality**: Templates are discovered as raw files/folders, not parsed metadata

**Impact**:
- 50% of template.ts is unused
- Memory waste for every template loaded
- Misleading type definitions

**Fix**:
```typescript
export interface Template {
  name: string;
  description: string;
  type: 'file' | 'folder';
  path: string;
  files: { relativePath: string; content: string }[];
}
```

---

## 🟡 MAJOR ISSUES

### 4. **Duplicate Path Handling Code**
**Locations**: 
- `src/utils/index.ts` - `PathUtils.expandEnvironmentVariables()`
- `src/services/configService.ts` - `expandEnvironmentVariables()`
- Both do EXACTLY the same thing (40 lines duplicated)

**Fix**: Use the utils version, delete the service duplicate

---

### 5. **Context Menu Integration Overcomplication**
**Location**: `src/utils/contextMenuIntegration.ts`

**Problems**:
- `analyzeFileContext()` has extensive file extension mapping (60+ lines)
- Returns `suggestedCategories` based on extensions
- **BUT templates don't have categories** (never populated)
- `filterTemplatesByCategories()` - can never match anything

**Impact**:
- 100+ lines of code that can never execute successfully
- False impression of "smart" categorization

**Fix**: Simplify to file vs folder detection only

---

### 6. **TemplateService Cache Complexity**
**Location**: `src/services/templateService.ts`

**Issues**:
- Multiple cache layers: `templatesCache`, `templateContentCache`
- Lazy loading logic that's never triggered
- Cache cleanup with arbitrary thresholds
- 5-minute TTL but no actual time-based validation

**Reality**: Most users have <20 templates, caching overhead exceeds benefit

**Recommendation**: Remove caching entirely or use simple in-memory array

---

### 7. **Inconsistent Error Handling**
**Locations**: Throughout codebase

**Problems**:
1. Some functions use `ErrorHandler.handleError()`
2. Some use `ErrorHandler.withErrorHandling()`
3. Some use raw try/catch with inline messages
4. Some silently swallow errors with `console.warn`

**Example** (`newFromTemplate.ts` line 60):
```typescript
try {
  const templates = await this.templateService.getTemplates();
} catch (error) {
  console.error('NewPlus: Error in execute:', error);
  await ErrorHandler.handleError(error, 'creating from template');
  return { success: false, error: String(error) };
}
```
**Why both console.error AND ErrorHandler?**

---

### 8. **ConfigService Unnecessary Complexity**
**Location**: `src/services/configService.ts`

**Problems**:
- `importConfiguration()`, `exportConfiguration()` - never called
- `validateConfiguration()` - checks properties that don't exist in package.json
- `mergeVariables()` - global vs workspace, but `variables` setting doesn't exist
- `getDefaultConfiguration()` with platform parameter - only called with defaults

**Lines of Code**: 280  
**Actually Needed**: ~80

---

## 🔵 MINOR ISSUES

### 9. **Inconsistent Async Patterns**
```typescript
// newFromTemplate.ts line 134
const stat = vscode.workspace.fs.stat(uri);
stat.then(s => {  // Promise not awaited
  context.isFile = ...
});
// Later code continues without waiting!
```

**This is a race condition bug** - context may not be set when needed

---

### 10. **Template File Content Loaded Eagerly**
**Location**: `templateService.ts`

**Problem**: Every template loads ALL file contents during discovery
- For a folder template with 50 files, reads 50 files into memory
- Content only needed during actual creation, not discovery

**Impact**: Slow discovery, high memory usage

---

### 11. **OpenTemplatesFolderCommand Redundancy**
**Location**: `src/commands/openTemplatesFolder.ts`

**Problem**:
- Separate class for 30 lines of code
- Constructor accepts optional ConfigService but creates new one if null
- Could be a simple function in `extension.ts`

---

### 12. **Utils Organization**
**Location**: `src/utils/index.ts`

**Problem**:
- Defines `ValidationUtils`, `FileOperationUtils`, `PathUtils` as classes
- All methods are static (no instance state)
- Should be simple exported functions or one consolidated utility object

---

## ℹ️ INFORMATION / BEST PRACTICES

### 13. **TypeScript Strict Mode Not Fully Utilized**
`tsconfig.json` has `strict: true` but:
```json
// These are commented out:
// "noImplicitReturns": true
// "noFallthroughCasesInSwitch": true  
// "noUnusedParameters": true
```
Enable these for better type safety.

---

### 14. **Missing Input Validation**
**Location**: `newFromTemplate.ts`

Variable substitution happens but no validation that required variables are provided before template creation.

---

### 15. **Performance: Synchronous File Operations in Loops**
**Location**: `templateService.ts` line 65-75

```typescript
for (const templateDir of templateDirs) {
  const template = await this.loadTemplate(templateDir);  // Sequential
}
```

Should use `Promise.all()` for parallel loading.

---

## 📊 BLOAT METRICS

| Category | Lines of Code | Used | Unused | % Waste |
|----------|---------------|------|--------|---------|
| Logger | 125 | 0 | 125 | 100% |
| Configuration Model | 180 | 70 | 110 | 61% |
| Template Model | 140 | 65 | 75 | 54% |
| Context Integration | 200 | 100 | 100 | 50% |
| Config Service | 280 | 100 | 180 | 64% |
| Utils | 280 | 180 | 100 | 36% |
| **TOTAL** | **1,205** | **515** | **690** | **57%** |

**Over half the codebase is unused or dead code.**

---

## 🎯 RECOMMENDED REFACTORING PRIORITY

### Phase 1 (Quick Wins - 1-2 days)
1. ✅ DELETE `src/utils/logger.ts` entirely
2. ✅ Simplify `Configuration` interface to match actual settings
3. ✅ Remove migration/export/import code from ConfigService
4. ✅ Delete duplicate `expandEnvironmentVariables()` from ConfigService
5. ✅ Fix async race condition in context analysis

### Phase 2 (Architecture - 3-5 days)
6. ✅ Simplify Template model (remove unused fields)
7. ✅ Remove template caching or simplify drastically
8. ✅ Consolidate error handling to single pattern
9. ✅ Convert utils classes to simple functions
10. ✅ Remove category/tag logic from ContextMenuIntegration

### Phase 3 (Performance - 2-3 days)
11. ✅ Lazy-load template content (not during discovery)
12. ✅ Parallel template loading
13. ✅ Remove redundant file stat calls

### Expected Outcome
- **Remove ~700 lines of code** (57% reduction)
- **Faster template discovery** (no eager content loading)
- **Simpler mental model** for contributors
- **Easier testing** (less mocking needed)

---

## 🏗️ ARCHITECTURAL RECOMMENDATIONS

### Current (Over-Engineered)
```
Extension → Commands → Services (heavy) → Models (bloated)
                ↓
            Utils (redundant)
```

### Recommended (Lean)
```
Extension → Commands → Simple Services → Minimal Models
```

**Key Principle**: PowerToys NewPlus is a **simple template copier**. The VS Code extension should match that simplicity, not add enterprise-level abstraction.

---

## 📝 SPECIFIC CODE CHANGES

### Delete These Files
- [ ] `src/utils/logger.ts` (125 lines)

### Simplify These Files (50%+ reduction)
- [ ] `src/models/configuration.ts` (180 → 60 lines)
- [ ] `src/models/template.ts` (140 → 70 lines)
- [ ] `src/services/configService.ts` (280 → 120 lines)
- [ ] `src/utils/contextMenuIntegration.ts` (200 → 100 lines)

### Consolidate These
- [ ] `src/utils/index.ts` - Convert classes to functions
- [ ] `src/commands/openTemplatesFolder.ts` - Move to extension.ts

---

## ✅ WHAT'S GOOD

1. **Error handling infrastructure** - ErrorHandler is well-designed (even if inconsistently used)
2. **Variable substitution** - VariableService is focused and works well
3. **Workspace integration** - Project type detection is useful
4. **Test structure** - Mirrors source, good organization
5. **Documentation** - Well-commented code

---

## 🎓 LESSONS LEARNED

1. **YAGNI** (You Aren't Gonna Need It) - Don't build features before they're needed
2. **Match the domain** - PowerToys NewPlus is simple; the port should be too
3. **Test what you build** - If Logger is never imported, tests would have caught this
4. **Settings-first design** - Model should match package.json, not the other way around
5. **Profile before optimizing** - Caching adds complexity; is it needed for <50 templates?

---

## 🔍 NEXT STEPS

1. **Gather metrics**: How many templates do real users have? (Validates cache decision)
2. **Run performance tests**: Discovery time with/without caching
3. **User testing**: Do categories/tags matter? (Validates context filtering)
4. **Decide**: Full rewrite or incremental refactor?

---

**Conclusion**: The extension works but carries significant technical debt. A focused refactoring effort could reduce codebase by 50%+ while improving performance and maintainability.
