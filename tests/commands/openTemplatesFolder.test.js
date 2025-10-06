"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
// Import will fail until implementation exists - this is expected for TDD
const openTemplatesFolder_1 = require("../../src/commands/openTemplatesFolder");
suite('Open Templates Folder Command Tests', () => {
    let command;
    setup(() => {
        command = new openTemplatesFolder_1.OpenTemplatesFolderCommand();
    });
    test('Should be registered as VS Code command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('newFromTemplate.openTemplatesFolder'));
    });
    test('Should open templates folder in system explorer', async () => {
        let systemCommandExecuted = false;
        let executedCommand = '';
        // Mock system command execution
        command.executeSystemCommand = async (cmd) => {
            systemCommandExecuted = true;
            executedCommand = cmd;
        };
        await command.execute();
        assert.ok(systemCommandExecuted);
        assert.ok(executedCommand.length > 0);
    });
    test('Should use configured templates path', async () => {
        const customPath = 'C:\\Custom\\Templates';
        let capturedPath = '';
        command.getTemplatesPath = () => customPath;
        command.executeSystemCommand = async (cmd) => {
            capturedPath = cmd;
        };
        await command.execute();
        assert.ok(capturedPath.includes(customPath));
    });
    test('Should handle non-existent templates folder gracefully', async () => {
        let errorShown = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = async (message) => {
            errorShown = true;
            assert.ok(message.includes('folder') || message.includes('exist'));
            return undefined;
        };
        command.getTemplatesPath = () => '/non/existent/path';
        command.checkFolderExists = async (path) => false;
        try {
            await command.execute();
            assert.ok(errorShown);
        }
        finally {
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
    test('Should create templates folder if it does not exist', async () => {
        let folderCreated = false;
        let infoShown = false;
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = async (message) => {
            infoShown = true;
            return undefined;
        };
        command.checkFolderExists = async (path) => false;
        command.createFolder = async (path) => {
            folderCreated = true;
        };
        try {
            await command.execute();
            assert.ok(folderCreated);
            assert.ok(infoShown);
        }
        finally {
            vscode.window.showInformationMessage = originalShowInformationMessage;
        }
    });
    test('Should expand environment variables in path', async () => {
        const pathWithEnvVar = '%LOCALAPPDATA%\\Templates';
        let expandedPath = '';
        command.getTemplatesPath = () => pathWithEnvVar;
        command.executeSystemCommand = async (cmd) => {
            expandedPath = cmd;
        };
        await command.execute();
        // Should not contain environment variable syntax
        assert.ok(!expandedPath.includes('%'));
    });
    test('Should use platform-appropriate command', async () => {
        let commandUsed = '';
        command.executeSystemCommand = async (cmd) => {
            commandUsed = cmd;
        };
        await command.execute();
        if (process.platform === 'win32') {
            assert.ok(commandUsed.includes('explorer') || commandUsed.includes('start'));
        }
        else if (process.platform === 'darwin') {
            assert.ok(commandUsed.includes('open'));
        }
        else {
            assert.ok(commandUsed.includes('xdg-open') || commandUsed.includes('nautilus'));
        }
    });
    test('Should handle system command execution errors', async () => {
        let errorHandled = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = async (message) => {
            errorHandled = true;
            return undefined;
        };
        command.executeSystemCommand = async (cmd) => {
            throw new Error('Command failed');
        };
        try {
            await command.execute();
            assert.ok(errorHandled);
        }
        finally {
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
    test('Should provide feedback when folder opens successfully', async () => {
        let infoShown = false;
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = async (message) => {
            infoShown = true;
            assert.ok(message.includes('opened') || message.includes('template'));
            return undefined;
        };
        command.executeSystemCommand = async (cmd) => {
            // Success
        };
        try {
            await command.execute();
            assert.ok(infoShown);
        }
        finally {
            vscode.window.showInformationMessage = originalShowInformationMessage;
        }
    });
});
//# sourceMappingURL=openTemplatesFolder.test.js.map