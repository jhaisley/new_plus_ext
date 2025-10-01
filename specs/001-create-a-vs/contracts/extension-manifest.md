# Extension Manifest Contract (package.json)

## Commands Contract
```json
{
  "contributes": {
    "commands": [
      {
        "command": "newFromTemplate.createFromTemplate",
        "title": "New+",
        "category": "New from Template"
      },
      {
        "command": "newFromTemplate.openTemplatesFolder", 
        "title": "New from Template: Open Templates Folder",
        "category": "New from Template"
      }
    ]
  }
}
```

**Contract Requirements**:
- `newFromTemplate.createFromTemplate` MUST trigger template selection UI
- Command MUST be available when File Explorer context is active
- `openTemplatesFolder` MUST open configured templates directory in system explorer

## Menus Contract
```json
{
  "contributes": {
    "menus": {
      "explorer/context": [
        {
          "command": "newFromTemplate.createFromTemplate",
          "when": "explorerResourceIsFolder || !explorerResourceIsRoot",
          "group": "navigation@1"
        }
      ],
      "file/newFile": [
        {
          "command": "newFromTemplate.createFromTemplate", 
          "group": "file@1"
        }
      ]
    }
  }
}
```

**Contract Requirements**:
- Explorer context menu MUST show "New+" when right-clicking folders or empty space
- File menu MUST include template option in New File group
- Menu items MUST respect VS Code when clause contexts

## Configuration Contract
```json
{
  "contributes": {
    "configuration": {
      "title": "New from Template",
      "properties": {
        "newFromTemplate.templatesPath": {
          "type": "string", 
          "default": "%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates",
          "description": "Path to templates directory"
        },
        "newFromTemplate.display.hideFileExtensions": {
          "type": "boolean",
          "default": true,
          "description": "Hide file extensions in template picker"
        },
        "newFromTemplate.display.hideSortingPrefix": {
          "type": "boolean", 
          "default": false,
          "description": "Hide leading digits and dots from template names"
        },
        "newFromTemplate.behavior.replaceVariablesInFilename": {
          "type": "boolean",
          "default": false, 
          "description": "Enable variable substitution in filenames"
        }
      }
    }
  }
}
```

**Contract Requirements**:
- All configuration properties MUST be accessible via VS Code settings UI
- Default values MUST match PowerToys NewPlus defaults where applicable
- Configuration changes MUST take effect immediately without restart