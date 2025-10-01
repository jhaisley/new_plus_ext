# Research: New from Template VS Code Extension

## VS Code Extension API Research

### Decision: Use contributes.menus for context menu integration
**Rationale**: VS Code Extension API provides built-in support for adding items to various context menus through the `contributes.menus` field in package.json. This is the standard, supported way to add context menu items.

**Key API Points**:
- `explorer/context` menu group for File Explorer context menus
- `file/newFile` menu group for File menu integration
- Command contributions via `contributes.commands`
- Menu item conditional visibility via `when` clauses

**Alternatives considered**: 
- Custom UI panels - rejected due to poor UX integration
- Command palette only - rejected due to requirement for context menu access

### Decision: Use VS Code Quick Pick API for template selection
**Rationale**: `vscode.window.showQuickPick()` provides native VS Code UI that users are familiar with, supports custom items with descriptions, and allows for sorting/filtering.

**Key Features**:
- Custom QuickPickItem interface for templates
- Built-in search/filter functionality
- Keyboard navigation support
- Consistent with VS Code UX patterns

**Alternatives considered**:
- Custom webview - rejected due to complexity and UX inconsistency
- Input box with autocomplete - rejected due to limited template display options

### Decision: Node.js fs module for file operations
**Rationale**: VS Code extensions run in Node.js environment with full access to file system APIs. The fs module provides all necessary operations for template copying and directory traversal.

**Key Operations**:
- `fs.readdir()` for template discovery
- `fs.stat()` for file/directory differentiation
- `fs.copyFile()` and `fs.cp()` for template copying
- `fs.mkdir()` for directory creation

**Alternatives considered**:
- VS Code Workspace API only - rejected due to limited file operations
- Third-party file libraries - rejected to minimize dependencies

### Decision: Built-in path module for cross-platform path handling
**Rationale**: Node.js path module handles platform-specific path operations (Windows vs Unix), which is essential for the cross-platform requirement.

**Key Features**:
- `path.join()` for safe path construction
- `path.resolve()` for absolute path resolution
- `path.extname()` for file extension handling
- Platform-agnostic separator handling

### Decision: Regular expressions for variable substitution
**Rationale**: Variable substitution requires pattern matching for date/time variables ($YYYY, $MM, etc.) and environment variables (%VAR%). Regular expressions provide efficient pattern matching and replacement.

**Pattern Examples**:
- Date variables: `/\$YYYY|\$YY|\$MM|\$DD/g`
- Environment variables: `/%([^%]+)%/g`
- Invalid filename chars: `/[<>:"|?*]/g`

**Alternatives considered**:
- String replacement only - rejected due to complexity of multiple patterns
- Template engine libraries - rejected to avoid dependencies and maintain PowerToys parity

### Decision: VS Code Configuration API for settings
**Rationale**: `vscode.workspace.getConfiguration()` provides standard way to access user settings with proper typing and validation.

**Configuration Schema**:
```json
{
  "newFromTemplate.templatesPath": {
    "type": "string",
    "default": "%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates"
  },
  "newFromTemplate.display.hideFileExtensions": {
    "type": "boolean", 
    "default": true
  }
}
```

### Decision: Yo Code generator for project scaffolding
**Rationale**: User specified using "yo code" for TypeScript extension project generation. This is the official VS Code extension generator that creates proper project structure, build configuration, and testing setup.

**Generated Structure**:
- TypeScript configuration with strict mode
- ESLint and test runner setup
- VS Code debug configuration
- Extension manifest template

## PowerToys NewPlus Research

### Template Directory Structure Analysis
**Finding**: PowerToys NewPlus uses flat directory structure with subdirectories for organization. Template discovery is recursive through all subdirectories.

**Implementation**: Extension must scan configured directory recursively and present templates in hierarchical Quick Pick menu.

### Variable Processing Compatibility
**Finding**: PowerToys supports specific date/time format strings and environment variable substitution. Case sensitivity matters for date variables but not environment variables.

**Implementation**: Must implement identical variable processing to maintain parity.

### Performance Characteristics
**Finding**: PowerToys NewPlus appears instantly in Windows Explorer context menu and processes templates quickly for normal file sizes.

**Implementation**: Extension must cache template discovery and implement efficient file copying to meet performance requirements.