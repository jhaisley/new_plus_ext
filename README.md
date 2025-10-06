# NewPlus VS Code Extension

A powerful VS Code extension that ports the functionality of the New+ PowerToy for creating files and folders from templates. NewPlus integrates seamlessly with VS Code's interface, providing context-aware template selection and workspace integration.

## Features

### 🎯 Context-Aware Template Selection
- **Smart Suggestions**: Templates are automatically filtered and prioritized based on your current context
- **Workspace Intelligence**: Detects project types (Node.js, Python, etc.) and suggests relevant templates
- **File/Folder Context**: Right-click in file explorer to get contextually appropriate templates

### 🚀 VS Code Integration
- **File Explorer Context Menu**: Right-click on folders/files to create new content from templates
- **Command Palette**: Access via `New+` command from anywhere in VS Code
- **Progress Indication**: Visual progress feedback for complex template creation
- **Workspace Detection**: Automatically detects active workspace folders and project structure

### 📂 Template Management
- **File & Folder Templates**: Support for both individual files and complete folder structures
- **Variable Substitution**: Dynamic content with customizable variables
- **Recent Templates**: Quick access to your most recently used templates
- **Template Categories**: Organized template browsing with visual icons

### ⚡ Enhanced User Experience
- **Smart Name Suggestions**: Context-aware default names for new files/folders
- **Validation**: Real-time validation of file/folder names with helpful error messages
- **One-Click Actions**: Quick open, reveal in explorer, or browse after creation
- **Error Handling**: Comprehensive error messages with suggested solutions

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX:
   - Download the `.vsix` file
   - Open VS Code
   - Run `Extensions: Install from VSIX...` command
   - Select the downloaded file

## Usage

### Creating from Templates

#### Method 1: File Explorer Context Menu
1. Right-click on any folder in the file explorer
2. Select "New+" from the context menu
3. Choose from contextually suggested templates
4. Enter a name and any required variables
5. Template is created and ready to use!

#### Method 2: Command Palette
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "New+" and select the command
3. Choose your template from the list
4. Follow the prompts to create your file/folder

### Template Organization

Templates are stored in: `%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates`

**File Templates**: Individual files with optional variable substitution
```
MyTemplate.txt
```

**Folder Templates**: Complete directory structures
```
ProjectTemplate/
├── src/
│   └── index.ts
├── tests/
│   └── example.test.ts
└── package.json
```

### Variables

Templates support dynamic variables that are replaced during creation:

#### Built-in Variables
- `$DATE$` - Current date (YYYY-MM-DD)
- `$TIME$` - Current time (HH:MM:SS)
- `$YEAR$` - Current year
- `$MONTH$` - Current month
- `$DAY$` - Current day
- `$USERNAME$` - Current user name

#### Context Variables (Auto-populated)
- `$WORKSPACE_NAME$` - Name of the current workspace
- `$WORKSPACE_PATH$` - Path to the workspace root
- `$TARGET_DIR$` - Name of the target directory
- `$TARGET_PATH$` - Full path to the target directory

#### Custom Variables
Define custom variables in your templates:
```typescript
// Template: Component-$COMPONENT_NAME$.tsx
import React from 'react';

interface $COMPONENT_NAME$Props {
  // Add your props here
}

export const $COMPONENT_NAME$: React.FC<$COMPONENT_NAME$Props> = () => {
  return (
    <div>
      <h1>Hello from $COMPONENT_NAME$!</h1>
    </div>
  );
};
```

## Configuration

The extension contributes the following settings:

### `newFromTemplate.templatesPath`
- **Type**: `string`
- **Default**: `%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates`
- **Description**: Path to the templates directory

### `newFromTemplate.display.hideFileExtensions`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Hide file extensions in the template picker for cleaner display

### `newFromTemplate.display.hideSortingPrefix`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Hide leading digits and dots from template names (e.g., "01.MyTemplate" shows as "MyTemplate")

### `newFromTemplate.behavior.replaceVariablesInFilename`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable variable substitution in file and folder names

## Commands

The extension provides the following commands:

- `newFromTemplate.createFromTemplate` - **New+**: Create file/folder from template
- `newFromTemplate.openTemplatesFolder` - **New from Template: Open Templates Folder**: Open the templates directory

## Context Menu Integration

The extension adds context menu items to the VS Code file explorer:

- **File Explorer** → Right-click on folder → **New+**
- **File Menu** → **New File** → **New+**

Context menu integration provides:
- **Smart Filtering**: Only shows relevant templates for the selected location
- **Workspace Awareness**: Considers project type and current workspace
- **Quick Access**: One-click template creation from any folder

## Workspace Integration

NewPlus automatically detects and integrates with your workspace:

### Project Type Detection
- **Node.js**: Detects `package.json` and suggests JavaScript/TypeScript templates
- **Python**: Detects `requirements.txt`, `setup.py` and suggests Python templates
- **Java**: Detects Maven/Gradle files and suggests Java templates
- **Generic**: Fallback for unrecognized project types

### Workspace Features
- **Multi-root Support**: Works with multi-root workspaces
- **Active Editor Context**: Uses currently active file location as context
- **Target Directory Resolution**: Intelligently determines where to create new content

## Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd new_plus_ext

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package extension
vsce package
```

### Project Structure

```
src/
├── commands/           # VS Code command implementations
├── models/            # Data models and interfaces  
├── services/          # Core business logic services
├── utils/             # Integration utilities
│   ├── workspaceIntegration.ts    # Workspace detection
│   └── contextMenuIntegration.ts  # Context menu logic
└── extension.ts       # Main extension entry point

tests/                 # Comprehensive test suite
```

### Architecture

The extension follows a layered architecture:

1. **Extension Layer**: VS Code API integration and command registration
2. **Service Layer**: Core business logic (config, templates, variables)
3. **Utilities Layer**: VS Code-specific integration helpers
4. **Model Layer**: Data structures and interfaces

## Requirements

- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 16.0 or higher (for development)
- **Templates Directory**: Writable access to the configured templates path

## Known Issues

- Template discovery may be slow for very large template directories (>1000 templates)
- Variable substitution in binary files is not supported
- Nested variable references have a recursion limit of 10 levels

## Troubleshooting

### Templates Not Found
1. Check the `newFromTemplate.templatesPath` setting
2. Ensure the templates directory exists and is readable
3. Verify templates follow the expected structure

### Context Menu Missing
1. Reload VS Code window (`Developer: Reload Window`)
2. Check that the extension is enabled
3. Verify you're right-clicking on folders (not files) in the file explorer

### Variable Substitution Issues
1. Enable `newFromTemplate.behavior.replaceVariablesInFilename` for filename variables
2. Check variable syntax matches `$VARIABLE_NAME$` format
3. Ensure custom variables are defined in template prompts

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas for Contribution
- Additional template types and examples
- Enhanced workspace detection for more project types
- Improved variable substitution features
- Better error handling and user feedback

## License

[MIT License](LICENSE)

## Acknowledgments

- Based on the New+ PowerToy from Microsoft PowerToys
- Inspired by the VS Code extension development community
- Thanks to all contributors and users who provide feedback

---

**Enjoy creating with NewPlus!** 🚀
