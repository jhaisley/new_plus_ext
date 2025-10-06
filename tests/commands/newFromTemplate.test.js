"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
// Import will fail until implementation exists - this is expected for TDD
const newFromTemplate_1 = require("../../src/commands/newFromTemplate");
suite('New+ Command Tests', () => {
    let command;
    setup(() => {
        command = new newFromTemplate_1.NewFromTemplateCommand();
    });
    test('Should be registered as VS Code command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('newFromTemplate.createFromTemplate'));
    });
    test('Should show Quick Pick when executed', async () => {
        // Mock VS Code Quick Pick
        let quickPickShown = false;
        const originalShowQuickPick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            quickPickShown = true;
            return undefined; // User cancelled
        };
        try {
            await command.execute();
            assert.ok(quickPickShown);
        }
        finally {
            vscode.window.showQuickPick = originalShowQuickPick;
        }
    });
    test('Should display templates with folders first', async () => {
        let capturedItems = [];
        const originalShowQuickPick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            capturedItems = items;
            return undefined;
        };
        try {
            await command.execute();
            // Check that folders come before files
            let foundFirstFile = false;
            for (const item of capturedItems) {
                if (item.template?.type === 'file' && !foundFirstFile) {
                    foundFirstFile = true;
                }
                else if (item.template?.type === 'folder' && foundFirstFile) {
                    assert.fail('Folders should appear before files');
                }
            }
        }
        finally {
            vscode.window.showQuickPick = originalShowQuickPick;
        }
    });
    test('Should handle template selection and creation', async () => {
        const mockTemplate = {
            name: 'Test Template',
            type: 'file',
            path: '/test/template.txt'
        };
        let templateCreated = false;
        const originalShowQuickPick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            return items[0]; // Select first item
        };
        // Mock template creation
        command.createFromTemplate = async (template, targetPath) => {
            templateCreated = true;
            assert.ok(template);
            assert.ok(targetPath);
        };
        try {
            await command.execute();
            // Template creation should be attempted
        }
        finally {
            vscode.window.showQuickPick = originalShowQuickPick;
        }
    });
    test('Should respect VS Code context (folder selection)', async () => {
        // Test with folder context
        const mockUri = vscode.Uri.file('/test/folder');
        let capturedTargetPath;
        command.createFromTemplate = async (template, targetPath) => {
            capturedTargetPath = targetPath;
        };
        await command.executeWithContext(mockUri);
        // Target path should be based on provided context
        assert.ok(capturedTargetPath?.includes('/test/folder'));
    });
    test('Should handle Quick Pick cancellation gracefully', async () => {
        const originalShowQuickPick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            return undefined; // User cancelled
        };
        try {
            // Should not throw when user cancels
            await assert.doesNotReject(async () => {
                await command.execute();
            });
        }
        finally {
            vscode.window.showQuickPick = originalShowQuickPick;
        }
    });
    test('Should show error when no templates available', async () => {
        let errorShown = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = async (message) => {
            errorShown = true;
            assert.ok(message.includes('template') || message.includes('empty'));
            return undefined;
        };
        // Mock empty template list
        command.getAvailableTemplates = async () => [];
        try {
            await command.execute();
            assert.ok(errorShown);
        }
        finally {
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
    test('Should handle file creation errors gracefully', async () => {
        const mockTemplate = {
            name: 'Test Template',
            type: 'file',
            path: '/test/template.txt'
        };
        let errorHandled = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = async (message) => {
            errorHandled = true;
            return undefined;
        };
        // Mock template creation failure
        command.createFromTemplate = async (template, targetPath) => {
            throw new Error('Permission denied');
        };
        try {
            await command.executeWithTemplate(mockTemplate, '/target/path');
            assert.ok(errorHandled);
        }
        finally {
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
});
//# sourceMappingURL=newFromTemplate.test.js.map