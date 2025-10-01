# Quickstart: New from Template VS Code Extension

## Prerequisites
- VS Code 1.74 or higher
- Node.js 16+ for development
- PowerToys installed (optional, for default template directory)

## Development Setup

### 1. Initialize Extension Project
```bash
# Install Yeoman and VS Code extension generator
npm install -g yo generator-code

# Generate new TypeScript extension
yo code
# Choose: New Extension (TypeScript)
# Name: new-from-template
# Identifier: new-from-template  
# Description: Create files and folders from templates
# Initialize git: Yes
# Bundle source code: No
# Package manager: npm
```

### 2. Install Dependencies
```bash
cd new-from-template
npm install
npm install --save-dev @types/node
```

### 3. Configure Extension Manifest
Update `package.json` with required contributions:
- Commands for template creation and folder opening
- Context menu items for explorer/context and file/newFile
- Configuration schema for user settings

## User Workflow Testing

### Scenario 1: Create File from Template (Basic)
1. **Setup**: Create templates directory with sample file template
2. **Action**: Right-click folder in VS Code File Explorer → select "New+"
3. **Expected**: Quick Pick menu appears with available templates
4. **Action**: Select file template from menu
5. **Expected**: New file created in target folder with template content

### Scenario 2: Create Folder from Template  
1. **Setup**: Create templates directory with sample folder structure
2. **Action**: Right-click folder in VS Code File Explorer → select "New+"
3. **Expected**: Quick Pick shows folder templates (marked as folders)
4. **Action**: Select folder template
5. **Expected**: Entire folder structure copied to target location

### Scenario 3: Variable Substitution
1. **Setup**: Template with filename containing "$YYYY-$MM-$DD-report.txt"
2. **Setup**: Enable variable replacement in settings
3. **Action**: Create template via context menu
4. **Expected**: File created with current date (e.g., "2025-10-01-report.txt")

### Scenario 4: Configuration Management
1. **Action**: Open Command Palette → "New from Template: Open Templates Folder"
2. **Expected**: Templates folder opens in system file explorer
3. **Action**: Modify extension settings in VS Code settings
4. **Expected**: Changes take effect immediately without restart

### Scenario 5: Error Handling
1. **Setup**: Remove or rename templates directory
2. **Action**: Attempt to use "New+" context menu
3. **Expected**: Graceful error message, offer to create/configure directory

## Performance Validation

### Startup Impact Test
1. **Measure**: VS Code startup time before extension installation
2. **Install**: Extension and restart VS Code  
3. **Measure**: Startup time after installation
4. **Verify**: Impact is less than 100ms

### Template Selection Performance
1. **Setup**: Templates directory with 50+ templates
2. **Action**: Right-click folder → "New+"
3. **Measure**: Time from click to Quick Pick appearance
4. **Verify**: Less than 500ms response time

### Template Creation Performance  
1. **Setup**: Large template file (5-10MB)
2. **Action**: Select and create template
3. **Measure**: Time from selection to completion
4. **Verify**: Less than 2 seconds for 10MB file

## Integration Testing

### VS Code API Integration
- Extension activation triggers properly
- Commands register and execute correctly  
- Context menu items appear in correct locations
- Configuration settings accessible and reactive

### Cross-Platform Compatibility
- Template path resolution works on Windows, macOS, Linux
- File operations respect platform-specific behaviors
- Environment variable expansion works correctly

### PowerToys Compatibility
- Default templates directory matches PowerToys location
- Variable substitution produces identical results
- Template organization and discovery behavior matches

## Manual Test Checklist

- [ ] Extension installs and activates without errors
- [ ] "New+" appears in File Explorer context menu
- [ ] Command Palette includes "Open Templates Folder" command
- [ ] Templates directory scanning works recursively
- [ ] File and folder templates create correctly
- [ ] Variable substitution processes all supported patterns
- [ ] Configuration changes apply without restart
- [ ] Error handling graceful for missing templates
- [ ] Performance meets specified requirements
- [ ] Cross-platform functionality verified