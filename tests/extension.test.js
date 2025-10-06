"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Activation Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('jhaisley.newplus'));
    });
    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('jhaisley.newplus');
        assert.ok(extension);
        await extension.activate();
        assert.strictEqual(extension.isActive, true);
    });
    test('Should register newFromTemplate.createFromTemplate command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('newFromTemplate.createFromTemplate'));
    });
    test('Should register newFromTemplate.openTemplatesFolder command', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('newFromTemplate.openTemplatesFolder'));
    });
    test('Extension should have correct display name', () => {
        const extension = vscode.extensions.getExtension('jhaisley.newplus');
        assert.strictEqual(extension?.packageJSON.displayName, 'NewPlus');
    });
});
//# sourceMappingURL=extension.test.js.map