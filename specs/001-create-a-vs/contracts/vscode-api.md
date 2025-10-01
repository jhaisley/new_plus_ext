# VS Code API Contracts

## Extension Activation Contract
```typescript
export function activate(context: vscode.ExtensionContext): void
export function deactivate(): void
```

**Requirements**:
- `activate()` MUST register all commands and menu contributions
- `activate()` MUST complete within 100ms to meet startup performance requirement
- `deactivate()` MUST clean up any resources and event listeners
- Extension MUST activate on command usage (lazy activation)

## Template Service Contract
```typescript
interface ITemplateService {
  discoverTemplates(): Promise<Template[]>
  getTemplate(path: string): Promise<Template | null>
  createFromTemplate(template: Template, targetPath: string): Promise<void>
}
```

**Requirements**:
- `discoverTemplates()` MUST scan configured directory recursively
- MUST return sorted list (folders first, then files)
- MUST handle missing templates directory gracefully
- Template creation MUST preserve file permissions where possible

## Variable Service Contract  
```typescript
interface IVariableService {
  processFilename(filename: string, context: VariableContext): string
  isVariableProcessingEnabled(): boolean
}

interface VariableContext {
  parentFolderName: string
  currentDate: Date
  environment: Record<string, string>
}
```

**Requirements**:
- MUST process date variables with exact PowerToys formatting
- MUST handle environment variables case-insensitively  
- MUST replace invalid filename characters with spaces
- MUST return original filename if processing disabled

## Configuration Service Contract
```typescript
interface IConfigurationService {
  getTemplatesPath(): string
  shouldHideFileExtensions(): boolean
  shouldHideSortingPrefix(): boolean
  shouldReplaceVariables(): boolean
  onConfigurationChanged(callback: () => void): vscode.Disposable
}
```

**Requirements**:
- MUST expand environment variables in templates path
- MUST provide reactive configuration updates
- MUST handle missing configuration with sensible defaults
- MUST validate configuration values where possible

## Quick Pick Contract
```typescript
interface TemplateQuickPickItem extends vscode.QuickPickItem {
  template: Template
  label: string
  description?: string
  detail?: string
}
```

**Requirements**:
- MUST show processed template names as labels
- MUST include template type (file/folder) in description
- MUST support keyboard navigation and search
- MUST appear within 500ms performance requirement