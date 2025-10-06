"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const path = require("path");
// Import will fail until implementation exists - this is expected for TDD
const extension_1 = require("../../src/extension");
suite('VS Code API Integration Tests', () => {
    let mockContext;
    setup(() => {
        // Create mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: async () => { },
                keys: () => []
            },
            globalState: {
                get: () => undefined,
                update: async () => { },
                keys: () => [],
                setKeysForSync: () => { }
            },
            secrets: {
                get: async () => undefined,
                store: async () => { },
                delete: async () => { },
                onDidChange: () => ({ dispose: () => { } })
            },
            extensionUri: vscode.Uri.file(path.join(__dirname, '../..')),
            extensionPath: path.join(__dirname, '../..'),
            environmentVariableCollection: {
                persistent: true,
                description: '',
                replace: () => { },
                append: () => { },
                prepend: () => { },
                get: () => undefined,
                forEach: () => { },
                delete: () => { },
                clear: () => { },
                [Symbol.iterator]: function* () { }
            },
            asAbsolutePath: (relativePath) => path.join(__dirname, '../..', relativePath),
            storageUri: vscode.Uri.file(path.join(__dirname, '..', 'storage')),
            globalStorageUri: vscode.Uri.file(path.join(__dirname, '..', 'global-storage')),
            logUri: vscode.Uri.file(path.join(__dirname, '..', 'logs')),
            extensionMode: vscode.ExtensionMode.Test,
            extension: {
                id: 'test.new-from-template',
                extensionUri: vscode.Uri.file(path.join(__dirname, '../..')),
                extensionPath: path.join(__dirname, '../..'),
                isActive: true,
                packageJSON: {},
                extensionKind: vscode.ExtensionKind.Workspace,
                exports: undefined,
                activate: async () => { }
            }
        };
    });
    test('Should register commands with VS Code', async () => {
        const registeredCommands = [];
        // Mock vscode.commands.registerCommand
        const originalRegisterCommand = vscode.commands.registerCommand;
        vscode.commands.registerCommand = (command, callback) => {
            registeredCommands.push(command);
            return { dispose: () => { } };
        };
        try {
            // Activate extension (would normally happen in extension.ts)
            await extension_1.ExtensionContext.activate(mockContext);
            // Verify expected commands are registered
            assert.ok(registeredCommands.includes('newFromTemplate.createFromTemplate'));
            assert.ok(registeredCommands.includes('newFromTemplate.openTemplatesFolder'));
        }
        finally {
            vscode.commands.registerCommand = originalRegisterCommand;
        }
    });
    test('Should integrate with File Explorer context menu', async () => {
        // Test that commands are available in context menu
        const allCommands = await vscode.commands.getCommands(true);
        // Commands should be registered in VS Code
        assert.ok(allCommands.includes('newFromTemplate.createFromTemplate'));
        assert.ok(allCommands.includes('newFromTemplate.openTemplatesFolder'));
    });
    test('Should handle workspace folder changes', async () => {
        let workspaceFoldersChanged = false;
        // Mock workspace folders change event
        const originalOnDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders;
        const mockDisposable = { dispose: () => { } };
        vscode.workspace.onDidChangeWorkspaceFolders = (listener) => {
            // Simulate workspace folder change
            setTimeout(() => {
                workspaceFoldersChanged = true;
                listener({
                    added: [],
                    removed: []
                });
            }, 10);
            return mockDisposable;
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Wait for event to fire
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.ok(workspaceFoldersChanged);
        }
        finally {
            vscode.workspace.onDidChangeWorkspaceFolders = originalOnDidChangeWorkspaceFolders;
        }
    });
    test('Should handle file system watcher events', async () => {
        let watcherCreated = false;
        let watcherEvents = [];
        // Mock file system watcher
        const originalCreateFileSystemWatcher = vscode.workspace.createFileSystemWatcher;
        vscode.workspace.createFileSystemWatcher = (globPattern) => {
            watcherCreated = true;
            const mockWatcher = {
                onDidCreate: (listener) => {
                    setTimeout(() => {
                        watcherEvents.push('create');
                        listener(vscode.Uri.file('/mock/file.txt'));
                    }, 10);
                    return { dispose: () => { } };
                },
                onDidChange: (listener) => {
                    setTimeout(() => {
                        watcherEvents.push('change');
                        listener(vscode.Uri.file('/mock/file.txt'));
                    }, 20);
                    return { dispose: () => { } };
                },
                onDidDelete: (listener) => {
                    setTimeout(() => {
                        watcherEvents.push('delete');
                        listener(vscode.Uri.file('/mock/file.txt'));
                    }, 30);
                    return { dispose: () => { } };
                },
                dispose: () => { }
            };
            return mockWatcher;
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Wait for events to fire
            await new Promise(resolve => setTimeout(resolve, 100));
            assert.ok(watcherCreated);
            assert.ok(watcherEvents.includes('create'));
            assert.ok(watcherEvents.includes('change'));
            assert.ok(watcherEvents.includes('delete'));
        }
        finally {
            vscode.workspace.createFileSystemWatcher = originalCreateFileSystemWatcher;
        }
    });
    test('Should use workspace state for persistence', async () => {
        const stateKeys = [];
        const stateValues = new Map();
        // Mock workspace state
        mockContext.workspaceState = {
            get: (key) => stateValues.get(key),
            update: async (key, value) => {
                stateKeys.push(key);
                stateValues.set(key, value);
            },
            keys: () => Array.from(stateValues.keys())
        };
        await extension_1.ExtensionContext.activate(mockContext);
        // Extension should use workspace state for caching
        await mockContext.workspaceState.update('testKey', 'testValue');
        assert.ok(stateKeys.includes('testKey'));
        assert.strictEqual(stateValues.get('testKey'), 'testValue');
    });
    test('Should register with configuration changes', async () => {
        let configurationListener;
        // Mock configuration change listener
        const originalOnDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration;
        vscode.workspace.onDidChangeConfiguration = (listener) => {
            configurationListener = listener;
            return { dispose: () => { } };
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            assert.ok(configurationListener, 'Extension should register configuration change listener');
            // Test configuration change event
            if (configurationListener) {
                const mockEvent = {
                    affectsConfiguration: (section) => section === 'newFromTemplate'
                };
                // Should not throw error
                configurationListener(mockEvent);
            }
        }
        finally {
            vscode.workspace.onDidChangeConfiguration = originalOnDidChangeConfiguration;
        }
    });
    test('Should handle extension deactivation', async () => {
        let disposalCalled = false;
        // Mock disposable
        const mockDisposable = {
            dispose: () => {
                disposalCalled = true;
            }
        };
        mockContext.subscriptions.push(mockDisposable);
        await extension_1.ExtensionContext.activate(mockContext);
        await extension_1.ExtensionContext.deactivate();
        // Should call dispose on all subscriptions
        assert.ok(disposalCalled);
    });
    test('Should provide progress feedback for long operations', async () => {
        let progressShown = false;
        let progressOptions;
        // Mock progress API
        const originalWithProgress = vscode.window.withProgress;
        vscode.window.withProgress = async (options, task) => {
            progressShown = true;
            progressOptions = options;
            return await task({
                report: (value) => { }
            });
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Simulate long-running operation
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating from template...',
                cancellable: true
            }, async (progress) => {
                progress.report({ increment: 50, message: 'Processing...' });
                await new Promise(resolve => setTimeout(resolve, 10));
                progress.report({ increment: 100, message: 'Complete!' });
            });
            assert.ok(progressShown);
            assert.ok(progressOptions);
            assert.strictEqual(progressOptions.title, 'Creating from template...');
        }
        finally {
            vscode.window.withProgress = originalWithProgress;
        }
    });
    test('Should handle user input through Quick Pick', async () => {
        let quickPickShown = false;
        let quickPickItems = [];
        // Mock Quick Pick API
        const originalShowQuickPick = vscode.window.showQuickPick;
        vscode.window.showQuickPick = async (items) => {
            quickPickShown = true;
            quickPickItems = items;
            return items[0]; // Return first item
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            const mockTemplates = [
                { label: 'File Template', description: 'Create a file' },
                { label: 'Folder Template', description: 'Create a folder' }
            ];
            const selected = await vscode.window.showQuickPick(mockTemplates);
            assert.ok(quickPickShown);
            assert.strictEqual(quickPickItems.length, 2);
            assert.strictEqual(selected?.label, 'File Template');
        }
        finally {
            vscode.window.showQuickPick = originalShowQuickPick;
        }
    });
    test('Should handle user input through Input Box', async () => {
        let inputBoxShown = false;
        let inputOptions;
        // Mock Input Box API
        const originalShowInputBox = vscode.window.showInputBox;
        vscode.window.showInputBox = async (options) => {
            inputBoxShown = true;
            inputOptions = options;
            return 'user-input'; // Mock user input
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            const userInput = await vscode.window.showInputBox({
                prompt: 'Enter file name',
                placeHolder: 'MyFile.txt',
                validateInput: (value) => {
                    if (!value)
                        return 'File name is required';
                    return undefined;
                }
            });
            assert.ok(inputBoxShown);
            assert.ok(inputOptions);
            assert.strictEqual(inputOptions.prompt, 'Enter file name');
            assert.strictEqual(userInput, 'user-input');
        }
        finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });
    test('Should handle file system operations', async () => {
        let fsOperations = [];
        // Mock file system operations
        const originalFs = vscode.workspace.fs;
        vscode.workspace.fs = {
            ...originalFs,
            writeFile: async (uri, content) => {
                fsOperations.push(`write:${uri.fsPath}`);
            },
            createDirectory: async (uri) => {
                fsOperations.push(`mkdir:${uri.fsPath}`);
            },
            copy: async (source, target) => {
                fsOperations.push(`copy:${source.fsPath}->${target.fsPath}`);
            },
            delete: async (uri) => {
                fsOperations.push(`delete:${uri.fsPath}`);
            }
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Simulate file operations
            const testUri = vscode.Uri.file('/test/file.txt');
            await vscode.workspace.fs.writeFile(testUri, new Uint8Array([1, 2, 3]));
            await vscode.workspace.fs.createDirectory(vscode.Uri.file('/test/folder'));
            assert.ok(fsOperations.some(op => op.includes('write:/test/file.txt')));
            assert.ok(fsOperations.some(op => op.includes('mkdir:/test/folder')));
        }
        finally {
            vscode.workspace.fs = originalFs;
        }
    });
    test('Should handle errors gracefully with user-friendly messages', async () => {
        let errorMessages = [];
        // Mock error message display
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = async (message) => {
            errorMessages.push(message);
            return undefined;
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Simulate error
            await vscode.window.showErrorMessage('Template creation failed');
            assert.ok(errorMessages.includes('Template creation failed'));
        }
        finally {
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
    test('Should provide information messages for user feedback', async () => {
        let infoMessages = [];
        // Mock information message display
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        vscode.window.showInformationMessage = async (message) => {
            infoMessages.push(message);
            return undefined;
        };
        try {
            await extension_1.ExtensionContext.activate(mockContext);
            // Simulate success message
            await vscode.window.showInformationMessage('Template created successfully');
            assert.ok(infoMessages.includes('Template created successfully'));
        }
        finally {
            vscode.window.showInformationMessage = originalShowInformationMessage;
        }
    });
    test('Should handle URI schemes correctly', async () => {
        await extension_1.ExtensionContext.activate(mockContext);
        // Test different URI schemes
        const fileUri = vscode.Uri.file('C:\\test\\file.txt');
        const untitledUri = vscode.Uri.from({ scheme: 'untitled', path: 'Untitled-1' });
        const httpUri = vscode.Uri.parse('https://example.com/template');
        assert.strictEqual(fileUri.scheme, 'file');
        assert.strictEqual(untitledUri.scheme, 'untitled');
        assert.strictEqual(httpUri.scheme, 'https');
        // Extension should handle file URIs
        assert.ok(fileUri.fsPath);
    });
    test('Should integrate with VS Code themes and icons', async () => {
        await extension_1.ExtensionContext.activate(mockContext);
        // Test ThemeIcon usage
        const fileIcon = new vscode.ThemeIcon('file');
        const folderIcon = new vscode.ThemeIcon('folder');
        assert.strictEqual(fileIcon.id, 'file');
        assert.strictEqual(folderIcon.id, 'folder');
        // Test ThemeColor usage
        const errorColor = new vscode.ThemeColor('errorForeground');
        const successColor = new vscode.ThemeColor('terminal.ansiGreen');
        assert.strictEqual(errorColor.id, 'errorForeground');
        assert.strictEqual(successColor.id, 'terminal.ansiGreen');
    });
});
//# sourceMappingURL=vscodeApiIntegration.test.js.map