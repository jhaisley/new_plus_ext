"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const path = require("path");
// Import will fail until implementation exists - this is expected for TDD
const configService_1 = require("../../src/services/configService");
suite('Configuration Management Integration Tests', () => {
    let configService;
    let testWorkspaceFolder;
    setup(async () => {
        configService = new configService_1.ConfigService();
        // Mock workspace folder for testing
        testWorkspaceFolder = {
            uri: vscode.Uri.file(path.join(__dirname, '..', 'test-workspace')),
            name: 'test-workspace',
            index: 0
        };
    });
    test('Should load default configuration when no custom config exists', async () => {
        const config = await configService.loadConfiguration();
        assert.ok(config);
        assert.ok(config.templatesPath);
        assert.ok(config.variables);
        assert.strictEqual(typeof config.showQuickPick, 'boolean');
        assert.strictEqual(typeof config.createSubfolders, 'boolean');
    });
    test('Should use VS Code workspace settings', async () => {
        // Mock VS Code configuration
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = (section) => {
            const mockConfig = {
                get: (key) => {
                    if (key === 'templatesPath')
                        return 'C:\\Custom\\Templates';
                    if (key === 'showQuickPick')
                        return false;
                    if (key === 'createSubfolders')
                        return true;
                    if (key === 'variables')
                        return { customVar: 'customValue' };
                    return undefined;
                },
                has: (key) => true,
                inspect: (key) => ({ key }),
                update: async (key, value) => { }
            };
            return mockConfig;
        };
        try {
            const config = await configService.loadConfiguration();
            assert.strictEqual(config.templatesPath, 'C:\\Custom\\Templates');
            assert.strictEqual(config.showQuickPick, false);
            assert.strictEqual(config.createSubfolders, true);
            assert.strictEqual(config.variables.customVar, 'customValue');
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should expand environment variables in templates path', async () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                if (key === 'templatesPath')
                    return '%LOCALAPPDATA%\\VSCode\\Templates';
                return undefined;
            },
            has: () => true,
            inspect: () => ({}),
            update: async () => { }
        });
        try {
            const config = await configService.loadConfiguration();
            // Should not contain environment variable syntax on Windows
            if (process.platform === 'win32') {
                assert.ok(!config.templatesPath.includes('%LOCALAPPDATA%'));
            }
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should handle relative paths relative to workspace', async () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                if (key === 'templatesPath')
                    return './templates';
                return undefined;
            },
            has: () => true,
            inspect: () => ({}),
            update: async () => { }
        });
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [testWorkspaceFolder],
            configurable: true
        });
        try {
            const config = await configService.loadConfiguration();
            assert.ok(path.isAbsolute(config.templatesPath));
            assert.ok(config.templatesPath.includes('test-workspace'));
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: originalWorkspaceFolders,
                configurable: true
            });
        }
    });
    test('Should validate configuration values', async () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                if (key === 'templatesPath')
                    return ''; // Invalid empty path
                if (key === 'variables')
                    return 'invalid'; // Invalid variables type
                return undefined;
            },
            has: () => true,
            inspect: () => ({}),
            update: async () => { }
        });
        try {
            const config = await configService.loadConfiguration();
            // Should fall back to defaults for invalid values
            assert.ok(config.templatesPath); // Should not be empty
            assert.strictEqual(typeof config.variables, 'object');
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should persist configuration changes', async () => {
        const newPath = 'C:\\Updated\\Templates\\Path';
        let savedKey;
        let savedValue;
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                if (key === 'templatesPath' && savedKey === 'templatesPath') {
                    return savedValue;
                }
                return undefined;
            },
            has: () => true,
            inspect: () => ({}),
            update: async (key, value) => {
                savedKey = key;
                savedValue = value;
            }
        });
        try {
            await configService.setTemplatesPath(newPath);
            assert.strictEqual(savedKey, 'templatesPath');
            assert.strictEqual(savedValue, newPath);
            // Verify the change is reflected in loaded configuration
            const config = await configService.loadConfiguration();
            assert.strictEqual(config.templatesPath, newPath);
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should handle workspace-specific vs global settings', async () => {
        let globalUpdateCalled = false;
        let workspaceUpdateCalled = false;
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: () => undefined,
            has: () => true,
            inspect: () => ({}),
            update: async (key, value, target) => {
                if (target === vscode.ConfigurationTarget.Global) {
                    globalUpdateCalled = true;
                }
                else if (target === vscode.ConfigurationTarget.Workspace) {
                    workspaceUpdateCalled = true;
                }
            }
        });
        try {
            // Test global setting
            await configService.setTemplatesPath('C:\\Global\\Path', true);
            assert.ok(globalUpdateCalled);
            // Test workspace setting
            await configService.setTemplatesPath('C:\\Workspace\\Path', false);
            assert.ok(workspaceUpdateCalled);
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should merge global and workspace variables', async () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                if (key === 'variables') {
                    return {
                        globalVar: 'globalValue',
                        commonVar: 'workspaceValue' // Should override global
                    };
                }
                return undefined;
            },
            has: () => true,
            inspect: (key) => ({
                key,
                globalValue: key === 'variables' ? { globalVar: 'globalValue', commonVar: 'globalValue' } : undefined,
                workspaceValue: key === 'variables' ? { commonVar: 'workspaceValue' } : undefined
            }),
            update: async () => { }
        });
        try {
            const config = await configService.loadConfiguration();
            assert.strictEqual(config.variables.globalVar, 'globalValue');
            assert.strictEqual(config.variables.commonVar, 'workspaceValue'); // Workspace should win
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should handle configuration reload on settings change', async () => {
        let configurationChangeListener;
        let configReloaded = false;
        const originalOnDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration;
        vscode.workspace.onDidChangeConfiguration = (listener) => {
            configurationChangeListener = listener;
            return { dispose: () => { } };
        };
        const originalLoadConfiguration = configService.loadConfiguration;
        configService.loadConfiguration = async () => {
            configReloaded = true;
            return originalLoadConfiguration.call(configService);
        };
        try {
            // Initialize the service (should set up the listener)
            await configService.initialize();
            // Simulate configuration change
            if (configurationChangeListener) {
                const mockChangeEvent = {
                    affectsConfiguration: (section) => section === 'newFromTemplate'
                };
                configurationChangeListener(mockChangeEvent);
            }
            assert.ok(configReloaded);
        }
        finally {
            vscode.workspace.onDidChangeConfiguration = originalOnDidChangeConfiguration;
            configService.loadConfiguration = originalLoadConfiguration;
        }
    });
    test('Should provide configuration schema validation', async () => {
        const invalidConfigs = [
            { templatesPath: 123 }, // Wrong type
            { showQuickPick: 'yes' }, // Wrong type
            { createSubfolders: 'true' }, // Wrong type
            { variables: [] }, // Wrong type
            { unknownProperty: 'value' } // Unknown property
        ];
        for (const invalidConfig of invalidConfigs) {
            const isValid = configService.validateConfiguration(invalidConfig);
            assert.ok(!isValid, `Configuration should be invalid: ${JSON.stringify(invalidConfig)}`);
        }
        const validConfig = {
            templatesPath: 'C:\\Valid\\Path',
            showQuickPick: true,
            createSubfolders: false,
            variables: { key: 'value' }
        };
        const isValid = configService.validateConfiguration(validConfig);
        assert.ok(isValid, 'Valid configuration should pass validation');
    });
    test('Should handle configuration migration from older versions', async () => {
        const originalGetConfiguration = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => ({
            get: (key) => {
                // Simulate old configuration format
                if (key === 'templateDir')
                    return 'C:\\Old\\Templates'; // Old key name
                if (key === 'enableQuickPick')
                    return true; // Old key name
                return undefined;
            },
            has: (key) => key === 'templateDir' || key === 'enableQuickPick',
            inspect: () => ({}),
            update: async () => { }
        });
        try {
            const config = await configService.loadConfiguration();
            // Should migrate old settings to new format
            assert.strictEqual(config.templatesPath, 'C:\\Old\\Templates');
            assert.strictEqual(config.showQuickPick, true);
        }
        finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
    test('Should handle concurrent configuration access', async () => {
        const promises = [];
        // Start multiple concurrent configuration loads
        for (let i = 0; i < 10; i++) {
            promises.push(configService.loadConfiguration());
        }
        const results = await Promise.all(promises);
        // All should succeed and return consistent results
        for (const config of results) {
            assert.ok(config);
            assert.ok(config.templatesPath);
            assert.strictEqual(config.templatesPath, results[0].templatesPath);
        }
    });
    test('Should export and import configuration', async () => {
        const testConfig = {
            templatesPath: 'C:\\Test\\Export\\Path',
            showQuickPick: false,
            createSubfolders: true,
            variables: {
                author: 'Test Author',
                company: 'Test Company'
            }
        };
        // Export configuration
        const exported = await configService.exportConfiguration(testConfig);
        assert.ok(exported);
        assert.strictEqual(typeof exported, 'string');
        // Import configuration
        const imported = await configService.importConfiguration(exported);
        assert.deepStrictEqual(imported, testConfig);
    });
    test('Should provide configuration defaults for different platforms', async () => {
        const windowsDefaults = configService.getDefaultConfiguration('win32');
        const macDefaults = configService.getDefaultConfiguration('darwin');
        const linuxDefaults = configService.getDefaultConfiguration('linux');
        // Each platform should have appropriate default paths
        assert.ok(windowsDefaults.templatesPath.includes('AppData') || windowsDefaults.templatesPath.includes('Documents'));
        assert.ok(macDefaults.templatesPath.includes('Library') || macDefaults.templatesPath.includes('Documents'));
        assert.ok(linuxDefaults.templatesPath.includes('home') || linuxDefaults.templatesPath.includes('.config'));
        // Other settings should be consistent across platforms
        assert.strictEqual(windowsDefaults.showQuickPick, macDefaults.showQuickPick);
        assert.strictEqual(macDefaults.createSubfolders, linuxDefaults.createSubfolders);
    });
});
//# sourceMappingURL=configurationManagement.test.js.map