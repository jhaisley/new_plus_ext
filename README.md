# NewPlus for VS Code

[![Version](https://img.shields.io/github/package-json/v/jhaisley/new_plus_ext)](https://github.com/jhaisley/new_plus_ext/releases)
[![GitHub Release](https://img.shields.io/github/v/release/jhaisley/new_plus_ext)](https://github.com/jhaisley/new_plus_ext/releases)
[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/jhaisley.newplus)](https://marketplace.visualstudio.com/items?itemName=jhaisley.newplus)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Install in VS Code](https://img.shields.io/badge/-Install%20in%20VS%20Code-blue?logo=visualstudiocode)](vscode:extension/jhaisley.newplus)
[![Install in VS Code Insiders](https://img.shields.io/badge/-Install%20in%20VS%20Code%20Insiders-green?logo=visualstudiocode)](vscode-insiders:extension/jhaisley.newplus)

Create files and folders from templates with context-aware suggestions and workspace intelligence. A powerful VS Code extension that brings PowerToys NewPlus functionality to your editor.

## ✨ Features

### 🎯 Smart Template Selection
- **Context-Aware Filtering**: Automatically suggests templates based on your current location and project type
- **Workspace Intelligence**: Detects Node.js, Python, Java, and other project types
- **File vs Folder Context**: Shows appropriate templates when right-clicking files or folders

### 📝 Template System
- **File Templates**: Individual files with variable substitution
- **Folder Templates**: Complete directory structures with multiple files
- **Variable Support**: Built-in variables (`$DATE$`, `$USER$`, `$WORKSPACE_NAME$`, etc.)
- **PowerToys Compatible**: Uses PowerToys NewPlus template directory structure

### 🚀 Seamless Integration
- **Explorer Context Menu**: Right-click to create from templates
- **Command Palette**: Quick access via `Ctrl+Shift+P` → "New+"
- **Progress Feedback**: Visual progress for multi-file operations
- **Smart Naming**: Context-aware default names with validation

## 🎬 Quick Start

### Installation

**From VS Code Marketplace:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "NewPlus"
4. Click Install

**From VSIX:**
1. Download `newplus-1.0.1.vsix` from [releases](https://github.com/jhaisley/new_plus_ext/releases)
2. Open VS Code
3. Run `Extensions: Install from VSIX...`
4. Select the downloaded file

## 🎯 Usage

### Creating from Templates

**Via Context Menu** (Recommended)
1. Right-click on any folder in the Explorer
2. Select **"New+"**
3. Choose a template (filtered by context)
4. Enter a name and any custom variables
5. Done! 🎉

**Via Command Palette**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type **"New+"**
3. Select your template
4. Follow the prompts

### Template Structure

Templates are stored in:  
**Windows:** `%LOCALAPPDATA%\Microsoft\PowerToys\NewPlus\Templates`  
**Mac/Linux:** `~/.local/share/Microsoft/PowerToys/NewPlus/Templates`

**File Template Example:**
```
MyComponent.tsx
```

**Folder Template Example:**
```
ReactComponent/
├── index.tsx
├── styles.module.css
└── __tests__/
    └── component.test.tsx
```

## 🔧 Variables

Templates support powerful variable substitution:

### Built-in Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `$DATE$` | Current date | `2025-10-06` |
| `$TIME$` | Current time | `14:30:45` |
| `$YEAR$` | Current year | `2025` |
| `$MONTH$` | Current month | `10` |
| `$DAY$` | Current day | `06` |
| `$USER$` | Current user | `jhaisley` |
| `$RANDOM$` | Random number | `42857` |
| `$UUID$` | UUID v4 | `a1b2c3d4-...` |

### Context Variables (Auto-filled)
| Variable | Description |
|----------|-------------|
| `$WORKSPACE_NAME$` | Active workspace name |
| `$TARGET_DIR$` | Target directory name |
| `$TARGET_PATH$` | Full target path |

> **Note:** Custom variable prompts are not currently implemented. Only the built-in and context variables listed above are supported.

## ⚙️ Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `newFromTemplate.templatesPath` | string | `%LOCALAPPDATA%\Microsoft\PowerToys\NewPlus\Templates` | Templates directory path |
| `newFromTemplate.display.hideFileExtensions` | boolean | `true` | Hide extensions in picker |
| `newFromTemplate.display.hideSortingPrefix` | boolean | `false` | Hide leading numbers (e.g., `01.`) |
| `newFromTemplate.behavior.replaceVariablesInFilename` | boolean | `false` | Enable variables in filenames |

### Commands

| Command | Description |
|---------|-------------|
| `New+` | Create from template |
| `New+: Open Templates Folder` | Open templates directory |

## 🧠 Smart Features

### Context Detection
NewPlus detects your project type and suggests relevant templates:

- **Node.js** → JavaScript/TypeScript templates
- **Python** → Python module templates  
- **Java** → Class/interface templates
- **Generic** → All templates

### Workspace Integration
- ✅ Multi-root workspace support
- ✅ Active editor context awareness
- ✅ Intelligent target directory resolution
- ✅ Real-time name validation

## 🔧 Development

### Build from Source

```bash
git clone https://github.com/jhaisley/new_plus_ext.git
cd new_plus_ext
npm install
npm run compile
npm test
```

### Architecture

```
Commands → Services → Models → Utils
   ↓
Template Discovery (lazy loading, parallel)
Variable Substitution (10-level recursion)
Context Detection (workspace intelligence)
```

**Tech Stack:**
- TypeScript 5.1+ (strict mode)
- VS Code Extension API 1.104+
- Mocha test framework

## 📋 Requirements

- VS Code 1.104.0 or higher
- Node.js 16+ (for development)

## 🐛 Troubleshooting

**Templates not showing?**
- Check `newFromTemplate.templatesPath` setting
- Verify templates directory exists and is readable
- Reload window: `Developer: Reload Window`

**Variables not working?**
- Enable `newFromTemplate.behavior.replaceVariablesInFilename`
- Use correct syntax: `$VARIABLE_NAME$`
- Check recursion limit (max 10 levels)

**Context menu missing?**
- Reload VS Code
- Verify extension is enabled
- Right-click on folders or files in Explorer

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Template examples and starter packs
- Additional project type detection
- Custom variable prompts and enhanced variable features
- UI/UX improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

[MIT License](LICENSE) - see file for details.

## 🙏 Acknowledgments

- Inspired by [Microsoft PowerToys NewPlus](https://github.com/microsoft/PowerToys)
- Built with the VS Code Extension API
- Thanks to all contributors and users! 🎉

---

**Made with ❤️ by [Jordan Haisley](https://github.com/jhaisley)**

[![GitHub](https://img.shields.io/badge/GitHub-new_plus_ext-blue?logo=github)](https://github.com/jhaisley/new_plus_ext)
[![Issues](https://img.shields.io/github/issues/jhaisley/new_plus_ext)](https://github.com/jhaisley/new_plus_ext/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jhaisley/new_plus_ext/pulls)
