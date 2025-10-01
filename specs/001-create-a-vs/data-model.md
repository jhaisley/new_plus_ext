# Data Model: New from Template VS Code Extension

## Core Entities

### Template
Represents a file or folder template available for creation.

**Attributes**:
- `name: string` - Display name (processed for hiding extensions/prefixes)
- `originalName: string` - Original filename from disk
- `path: string` - Absolute path to template file/folder
- `type: 'file' | 'folder'` - Template type
- `relativePath: string` - Path relative to templates directory
- `isDirectory: boolean` - Whether template is a directory
- `stats: fs.Stats` - File system statistics

**Validation Rules**:
- Path must exist and be readable
- Name must not be empty after processing
- Type must match actual file system entity

**State Transitions**:
1. Discovered → Validated → Available for selection
2. Selected → Variable processing → Created in target directory

### Configuration
User settings for extension behavior.

**Attributes**:
- `templatesPath: string` - Absolute path to templates directory
- `hideFileExtensions: boolean` - Whether to hide extensions in Quick Pick
- `hideSortingPrefix: boolean` - Whether to hide leading digits/dots in names
- `replaceVariablesInFilename: boolean` - Whether to process variables in filenames

**Validation Rules**:
- templatesPath must be valid directory path
- Boolean flags have no additional validation
- Default values applied when settings missing

**Default Values**:
- templatesPath: `%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates`
- hideFileExtensions: `true`
- hideSortingPrefix: `false`
- replaceVariablesInFilename: `false`

### Variable
Represents a replaceable token in template filenames.

**Attributes**:
- `pattern: string` - The variable pattern (e.g., "$YYYY", "%USERNAME%")
- `value: string` - The replacement value
- `type: 'date' | 'environment' | 'special'` - Variable category

**Processing Rules**:
- Date variables: Case-sensitive, current timestamp
- Environment variables: Case-insensitive, system environment
- Special variables: Context-dependent (e.g., parent folder name)

### TemplateSelection
Represents user's choice and creation context.

**Attributes**:
- `template: Template` - Selected template
- `targetDirectory: string` - Where to create the template
- `processedName: string` - Final name after variable substitution
- `uri: vscode.Uri` - VS Code URI for target location

**Relationships**:
- One Template per selection
- One target directory per selection
- Variable processing may modify final names

## Entity Relationships

```
Configuration 1:1 TemplateService
    ├── templatesPath → Template Discovery
    ├── display options → Template.name processing
    └── behavior options → Variable processing

Template 1:* Variable (when replaceVariablesInFilename enabled)
    ├── originalName contains variables
    └── Variables processed to create processedName

TemplateSelection 1:1 Template
    ├── User choice from Quick Pick
    ├── Target context from File Explorer
    └── Results in file/folder creation
```

## Data Flow

1. **Template Discovery**: Configuration.templatesPath → scan directory → create Template entities
2. **Template Display**: Template.originalName → apply display rules → Template.name for Quick Pick
3. **Template Selection**: User choice → create TemplateSelection with context
4. **Variable Processing**: Template.originalName + current context → Variable substitution → final filename
5. **Template Creation**: Copy Template to TemplateSelection.targetDirectory with processed name