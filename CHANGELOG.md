# Changelog

All notable changes to the NewPlus VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-06

### Added
- **Template Creation**: Create files and folders from templates with a single command
- **Variable Substitution**: Built-in variables (`$DATE$`, `$TIME$`, `$USER$`, `$WORKSPACE_NAME$`, etc.)
- **Context-Aware Suggestions**: Right-click in explorer shows relevant templates for the location
- **PowerToys Compatibility**: Works with PowerToys NewPlus template directory
- **Lazy Loading**: Fast template discovery with on-demand content loading
- **Project Detection**: Automatically detects Node.js, Python, and other project types

### Features

#### Template System
- File and folder templates from configured directory
- No metadata required - templates are raw files/folders
- Display name customization (hide extensions, sorting prefixes)
- Variable substitution in file content and optionally filenames
- Parallel template discovery for fast enumeration

#### VS Code Integration
- Command Palette: "New from Template"
- Explorer Context Menu: Right-click to create from template
- File Menu: File → New File from Template
- Workspace-aware template suggestions
- Progress indication for multi-file operations

#### Variables
- **Date/Time**: `$DATE$`, `$TIME$`, `$YEAR$`, `$MONTH$`, `$DAY$`
- **User**: `$USER$`
- **Random**: `$RANDOM$`, `$UUID$`
- **Workspace**: `$WORKSPACE_NAME$`, `$TARGET_DIR$`, `$TARGET_PATH$`
- Recursion protection (max 10 levels)

### Configuration

Settings available in VS Code preferences:

```json
{
  "newFromTemplate.templatesPath": "%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates",
  "newFromTemplate.display.hideFileExtensions": true,
  "newFromTemplate.display.hideSortingPrefix": false,
  "newFromTemplate.behavior.replaceVariablesInFilename": false
}
```

### Technical

#### Architecture
- Service-based architecture (ConfigService, TemplateService, VariableService)
- Pure function utilities for validation, file operations, path handling
- TypeScript strict mode enabled
- Async/await throughout with proper error handling

#### Performance
- Lazy content loading (templates discovered without reading file content)
- Parallel Promise.all() for concurrent operations
- Optimized for typical usage (6-20 templates)

#### Testing
- Unit tests with Mocha framework
- All tests passing
- TypeScript compilation clean
- ESLint validated

---

## Future Enhancements

Potential features for future releases:

- **Template Wizard**: Multi-step template creation with prompts
- **Template Snippets**: Quick template insertion in active editor
- **Custom Variables**: User-defined variables in settings
- **Template Validation**: Schema validation for complex templates
- **Remote Templates**: Download templates from Git repositories