"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
// Import will fail until implementation exists - this is expected for TDD
const templateService_1 = require("../../src/services/templateService");
const configService_1 = require("../../src/services/configService");
const variableService_1 = require("../../src/services/variableService");
const newFromTemplate_1 = require("../../src/commands/newFromTemplate");
const utils_1 = require("../../src/utils");
suite('Error Handling and Edge Cases Tests', () => {
    let templateService;
    let configService;
    let variableService;
    let newFromTemplateCommand;
    setup(() => {
        configService = new configService_1.ConfigService();
        variableService = new variableService_1.VariableService();
        templateService = new templateService_1.TemplateService(configService);
        newFromTemplateCommand = new newFromTemplate_1.NewFromTemplateCommand(templateService, variableService);
    });
    suite('Template Service Error Handling', () => {
        test('Should handle non-existent templates directory', async () => {
            // Set non-existent path
            await configService.setTemplatesPath('/non/existent/path');
            const templates = await templateService.discoverTemplates();
            assert.strictEqual(templates.length, 0, 'Should return empty array for non-existent directory');
        });
        test('Should handle corrupted template.json files', async () => {
            // Mock file system to return invalid JSON
            const originalReadFile = utils_1.FileOperationUtils.readFile;
            utils_1.FileOperationUtils.readFile = async (filePath) => {
                if (filePath.endsWith('template.json')) {
                    return '{ invalid json content }';
                }
                return originalReadFile(filePath);
            };
            try {
                const templates = await templateService.discoverTemplates();
                // Should skip corrupted templates without throwing
                assert.ok(Array.isArray(templates), 'Should return array even with corrupted templates');
            }
            finally {
                utils_1.FileOperationUtils.readFile = originalReadFile;
            }
        });
        test('Should handle missing required template.json properties', async () => {
            const invalidTemplate = {
                // Missing 'name' and 'type' properties
                description: 'Invalid template'
            };
            const isValid = templateService.validateTemplate(invalidTemplate);
            assert.ok(!isValid, 'Should reject template missing required properties');
        });
        test('Should handle templates with invalid type values', async () => {
            const invalidTemplates = [
                { name: 'Test', type: 'invalid-type', description: 'Test' },
                { name: 'Test', type: '', description: 'Test' },
                { name: 'Test', type: null, description: 'Test' },
                { name: 'Test', type: 123, description: 'Test' }
            ];
            for (const template of invalidTemplates) {
                const isValid = templateService.validateTemplate(template);
                assert.ok(!isValid, `Should reject template with invalid type: ${template.type}`);
            }
        });
        test('Should handle extremely long template names', async () => {
            const longName = 'a'.repeat(1000);
            const template = {
                name: longName,
                type: 'file',
                description: 'Test'
            };
            const isValid = templateService.validateTemplate(template);
            assert.ok(!isValid, 'Should reject template with extremely long name');
        });
        test('Should handle templates with special characters in names', async () => {
            const specialCharNames = [
                'template<>name',
                'template|name',
                'template*name',
                'template?name',
                'template"name',
                'template:name'
            ];
            for (const name of specialCharNames) {
                const template = { name, type: 'file', description: 'Test' };
                const isValid = templateService.validateTemplate(template);
                assert.ok(!isValid, `Should reject template with special characters: ${name}`);
            }
        });
        test('Should handle circular reference in template discovery', async () => {
            // Mock directory structure with circular symlinks
            const originalDirectoryExists = utils_1.FileOperationUtils.directoryExists;
            const originalListDirectory = utils_1.FileOperationUtils.listDirectory;
            let visitedPaths = new Set();
            utils_1.FileOperationUtils.directoryExists = async (path) => true;
            utils_1.FileOperationUtils.listDirectory = async (path) => {
                if (visitedPaths.has(path)) {
                    throw new Error('Circular reference detected');
                }
                visitedPaths.add(path);
                return []; // Empty to avoid infinite recursion
            };
            try {
                const templates = await templateService.discoverTemplates();
                assert.ok(Array.isArray(templates), 'Should handle circular references gracefully');
            }
            finally {
                utils_1.FileOperationUtils.directoryExists = originalDirectoryExists;
                utils_1.FileOperationUtils.listDirectory = originalListDirectory;
            }
        });
    });
    suite('Configuration Service Error Handling', () => {
        test('Should handle VS Code configuration API failures', async () => {
            // Mock VS Code configuration to throw errors
            const originalGetConfiguration = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = () => {
                throw new Error('Configuration API failed');
            };
            try {
                const config = await configService.loadConfiguration();
                assert.ok(config, 'Should return default configuration when API fails');
                assert.ok(config.templatesPath, 'Should have default templates path');
            }
            finally {
                vscode.workspace.getConfiguration = originalGetConfiguration;
            }
        });
        test('Should handle invalid environment variable syntax', async () => {
            const invalidPaths = [
                '%UNCLOSED_VAR\\Templates',
                '${INVALID_SYNTAX',
                '%NONEXISTENT_VAR%\\Templates',
                '${MISSING_CLOSING_BRACE\\Templates'
            ];
            for (const path of invalidPaths) {
                const expandedPath = configService.expandEnvironmentVariables(path);
                assert.ok(expandedPath, 'Should handle invalid environment variable syntax');
                // Should either expand correctly or return original path
            }
        });
        test('Should handle configuration updates when VS Code is read-only', async () => {
            const originalGetConfiguration = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = () => ({
                get: () => undefined,
                has: () => true,
                inspect: () => ({}),
                update: async () => {
                    throw new Error('Configuration is read-only');
                }
            });
            try {
                // Should not throw error even if update fails
                await configService.setTemplatesPath('C:\\New\\Path');
                assert.ok(true, 'Should handle read-only configuration gracefully');
            }
            catch (error) {
                assert.fail('Should not throw error for read-only configuration');
            }
            finally {
                vscode.workspace.getConfiguration = originalGetConfiguration;
            }
        });
        test('Should handle workspace without folders', async () => {
            const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: undefined,
                configurable: true
            });
            try {
                const config = await configService.loadConfiguration();
                assert.ok(config.templatesPath, 'Should provide default path when no workspace folders');
            }
            finally {
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalWorkspaceFolders,
                    configurable: true
                });
            }
        });
    });
    suite('Variable Service Error Handling', () => {
        test('Should handle undefined variable values', async () => {
            const template = `Hello {{name}}, welcome to {{undefined_var}}!`;
            const variables = new Map([['name', 'John']]);
            const result = variableService.processTemplate(template, variables);
            assert.ok(result.includes('John'), 'Should process defined variables');
            assert.ok(result.includes('{{undefined_var}}'), 'Should leave undefined variables as-is');
        });
        test('Should handle circular variable references', async () => {
            const template = `{{var1}} references {{var2}}`;
            const variables = new Map([
                ['var1', '{{var2}}'],
                ['var2', '{{var1}}']
            ]);
            const result = variableService.processTemplate(template, variables);
            // Should detect circular reference and handle gracefully
            assert.ok(result, 'Should handle circular references without infinite loop');
        });
        test('Should handle extremely large variable values', async () => {
            const largeValue = 'x'.repeat(100000);
            const template = `Content: {{large_var}}`;
            const variables = new Map([['large_var', largeValue]]);
            const result = variableService.processTemplate(template, variables);
            assert.ok(result.includes(largeValue), 'Should handle large variable values');
        });
        test('Should handle variables with special regex characters', async () => {
            const template = `Pattern: {{regex_chars}}`;
            const variables = new Map([
                ['regex_chars', '.*+?^${}()|[]\\']
            ]);
            const result = variableService.processTemplate(template, variables);
            assert.ok(result.includes('.*+?^${}()|[]\\'), 'Should handle regex special characters');
        });
        test('Should handle malformed variable syntax', async () => {
            const malformedTemplates = [
                'Hello {name}', // Single braces
                'Hello {{{name}}}', // Triple braces
                'Hello {{name}}', // Missing closing
                'Hello {{}}', // Empty variable
                'Hello {{ name }}', // Spaces
                'Hello {{name.sub}}' // Dot notation
            ];
            for (const template of malformedTemplates) {
                const result = variableService.processTemplate(template, new Map());
                assert.ok(result, `Should handle malformed template: ${template}`);
            }
        });
        test('Should handle nested variable processing', async () => {
            const template = `{{outer_{{inner}}}}`;
            const variables = new Map([
                ['inner', 'var'],
                ['outer_var', 'final_value']
            ]);
            const result = variableService.processTemplate(template, variables);
            // Should handle nested variable resolution appropriately
            assert.ok(result, 'Should handle nested variables gracefully');
        });
    });
    suite('File Operation Error Handling', () => {
        test('Should handle permission denied errors', async () => {
            const restrictedPath = '/root/restricted/file.txt';
            // Mock permission denied error
            const originalWriteFile = utils_1.FileOperationUtils.writeFile;
            utils_1.FileOperationUtils.writeFile = async (filePath, content) => {
                if (filePath === restrictedPath) {
                    const error = new Error('EACCES: permission denied');
                    error.code = 'EACCES';
                    throw error;
                }
                return originalWriteFile(filePath, content);
            };
            try {
                const result = await newFromTemplateCommand.createFile(restrictedPath, 'content');
                assert.ok(!result.success, 'Should fail gracefully for permission denied');
                assert.ok(result.error?.includes('permission'), 'Should indicate permission error');
            }
            finally {
                utils_1.FileOperationUtils.writeFile = originalWriteFile;
            }
        });
        test('Should handle disk full errors', async () => {
            const targetPath = '/tmp/test-file.txt';
            // Mock disk full error
            const originalWriteFile = utils_1.FileOperationUtils.writeFile;
            utils_1.FileOperationUtils.writeFile = async (filePath, content) => {
                if (filePath === targetPath) {
                    const error = new Error('ENOSPC: no space left on device');
                    error.code = 'ENOSPC';
                    throw error;
                }
                return originalWriteFile(filePath, content);
            };
            try {
                const result = await newFromTemplateCommand.createFile(targetPath, 'content');
                assert.ok(!result.success, 'Should fail gracefully for disk full');
                assert.ok(result.error?.includes('space'), 'Should indicate disk space error');
            }
            finally {
                utils_1.FileOperationUtils.writeFile = originalWriteFile;
            }
        });
        test('Should handle network drive unavailable', async () => {
            const networkPath = '\\\\network\\share\\file.txt';
            // Mock network unavailable error
            const originalWriteFile = utils_1.FileOperationUtils.writeFile;
            utils_1.FileOperationUtils.writeFile = async (filePath, content) => {
                if (filePath === networkPath) {
                    const error = new Error('ENETUNREACH: network is unreachable');
                    error.code = 'ENETUNREACH';
                    throw error;
                }
                return originalWriteFile(filePath, content);
            };
            try {
                const result = await newFromTemplateCommand.createFile(networkPath, 'content');
                assert.ok(!result.success, 'Should fail gracefully for network errors');
                assert.ok(result.error?.includes('network'), 'Should indicate network error');
            }
            finally {
                utils_1.FileOperationUtils.writeFile = originalWriteFile;
            }
        });
        test('Should handle extremely long file paths', async () => {
            // Create path longer than typical OS limits
            const longPath = 'C:\\' + 'very-long-directory-name\\'.repeat(20) + 'file.txt';
            const isValid = utils_1.ValidationUtils.isValidPath(longPath);
            assert.ok(!isValid, 'Should reject extremely long paths');
        });
        test('Should handle file names with invalid characters', async () => {
            const invalidNames = [
                'file<name>.txt',
                'file>name.txt',
                'file:name.txt',
                'file"name.txt',
                'file|name.txt',
                'file?name.txt',
                'file*name.txt'
            ];
            for (const name of invalidNames) {
                const isValid = utils_1.ValidationUtils.isValidFileName(name);
                assert.ok(!isValid, `Should reject invalid file name: ${name}`);
            }
        });
        test('Should handle reserved file names on Windows', async () => {
            const reservedNames = [
                'CON.txt', 'PRN.txt', 'AUX.txt', 'NUL.txt',
                'COM1.txt', 'COM2.txt', 'COM9.txt',
                'LPT1.txt', 'LPT2.txt', 'LPT9.txt'
            ];
            for (const name of reservedNames) {
                const isValid = utils_1.ValidationUtils.isValidFileName(name);
                if (process.platform === 'win32') {
                    assert.ok(!isValid, `Should reject reserved Windows name: ${name}`);
                }
            }
        });
    });
    suite('Command Execution Error Handling', () => {
        test('Should handle template selection cancellation', async () => {
            // Mock user cancelling template selection
            const originalShowQuickPick = vscode.window.showQuickPick;
            vscode.window.showQuickPick = async () => undefined; // User cancelled
            try {
                const result = await newFromTemplateCommand.execute();
                assert.ok(!result || !result.success, 'Should handle user cancellation gracefully');
            }
            finally {
                vscode.window.showQuickPick = originalShowQuickPick;
            }
        });
        test('Should handle variable input cancellation', async () => {
            const template = {
                name: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: [{ name: 'testVar', prompt: 'Enter value', defaultValue: '' }]
            };
            // Mock user cancelling variable input
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async () => undefined; // User cancelled
            try {
                const result = await newFromTemplateCommand.createFromTemplate(template, '/target', 'test.txt', new Map());
                assert.ok(!result.success, 'Should handle variable input cancellation');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should handle concurrent command execution', async () => {
            const template = {
                name: 'Test',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'test.txt', content: 'content' }],
                variables: []
            };
            // Execute multiple commands concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(newFromTemplateCommand.createFromTemplate(template, '/target', `test${i}.txt`, new Map()));
            }
            const results = await Promise.allSettled(promises);
            // All should complete without throwing unhandled errors
            assert.strictEqual(results.length, 5);
            for (const result of results) {
                assert.strictEqual(result.status, 'fulfilled');
            }
        });
        test('Should handle memory pressure during large template creation', async () => {
            // Create large template with many files
            const largeTemplate = {
                name: 'LargeTemplate',
                type: 'folder',
                path: '/test',
                files: Array.from({ length: 1000 }, (_, i) => ({
                    relativePath: `file${i}.txt`,
                    content: 'x'.repeat(10000) // 10KB per file
                })),
                variables: []
            };
            try {
                const result = await newFromTemplateCommand.createFromTemplate(largeTemplate, '/target', 'large-project', new Map());
                // Should either succeed or fail gracefully (not crash)
                assert.ok(typeof result.success === 'boolean', 'Should return valid result');
            }
            catch (error) {
                // Should not throw unhandled errors
                assert.fail('Should handle memory pressure gracefully');
            }
        });
        test('Should handle invalid target directory', async () => {
            const template = {
                name: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: []
            };
            const invalidTargets = [
                '',
                'relative/path',
                '/non/existent/deeply/nested/path',
                'C:\\invalid\\path\\with\\<invalid>\\chars'
            ];
            for (const target of invalidTargets) {
                const result = await newFromTemplateCommand.createFromTemplate(template, target, 'test.txt', new Map());
                assert.ok(!result.success, `Should reject invalid target: ${target}`);
                assert.ok(result.error, 'Should provide error message');
            }
        });
        test('Should handle system interruption during creation', async () => {
            const template = {
                name: 'Test',
                type: 'folder',
                path: '/test',
                files: [
                    { relativePath: 'file1.txt', content: 'content1' },
                    { relativePath: 'file2.txt', content: 'content2' }
                ],
                variables: []
            };
            // Mock interruption during file creation
            let filesCreated = 0;
            const originalWriteFile = utils_1.FileOperationUtils.writeFile;
            utils_1.FileOperationUtils.writeFile = async (filePath, content) => {
                filesCreated++;
                if (filesCreated === 2) {
                    throw new Error('System interruption');
                }
                return originalWriteFile(filePath, content);
            };
            try {
                const result = await newFromTemplateCommand.createFromTemplate(template, '/target', 'test-folder', new Map());
                assert.ok(!result.success, 'Should handle interruption gracefully');
                assert.ok(result.error?.includes('interruption'), 'Should indicate interruption');
            }
            finally {
                utils_1.FileOperationUtils.writeFile = originalWriteFile;
            }
        });
    });
    suite('Edge Cases and Boundary Conditions', () => {
        test('Should handle empty template files', async () => {
            const emptyTemplate = {
                name: 'Empty',
                type: 'file',
                path: '/test',
                files: [],
                variables: []
            };
            const result = await newFromTemplateCommand.createFromTemplate(emptyTemplate, '/target', 'empty.txt', new Map());
            assert.ok(!result.success, 'Should handle empty template appropriately');
        });
        test('Should handle template with only whitespace content', async () => {
            const whitespaceTemplate = {
                name: 'Whitespace',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'test.txt', content: '   \n\t\r\n   ' }],
                variables: []
            };
            const result = await newFromTemplateCommand.createFromTemplate(whitespaceTemplate, '/target', 'whitespace.txt', new Map());
            assert.ok(result.success, 'Should handle whitespace-only content');
        });
        test('Should handle Unicode and special character content', async () => {
            const unicodeTemplate = {
                name: 'Unicode',
                type: 'file',
                path: '/test',
                files: [{
                        relativePath: 'unicode.txt',
                        content: '🚀 Unicode: café, naïve, résumé, 中文, العربية, ελληνικά'
                    }],
                variables: []
            };
            const result = await newFromTemplateCommand.createFromTemplate(unicodeTemplate, '/target', 'unicode.txt', new Map());
            assert.ok(result.success, 'Should handle Unicode content correctly');
        });
        test('Should handle maximum path length variations across platforms', async () => {
            const testPaths = [
                'C:\\' + 'a'.repeat(255), // Windows MAX_PATH
                '/home/user/' + 'a'.repeat(255), // Linux PATH_MAX approximation
                '/Users/user/' + 'a'.repeat(255) // macOS PATH_MAX approximation
            ];
            for (const path of testPaths) {
                const isValid = utils_1.ValidationUtils.isValidPath(path);
                // Validation should be platform-aware
                assert.ok(typeof isValid === 'boolean', `Should validate path: ${path.substring(0, 50)}...`);
            }
        });
        test('Should handle zero-byte files', async () => {
            const zeroBytesTemplate = {
                name: 'ZeroBytes',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'empty.txt', content: '' }],
                variables: []
            };
            const result = await newFromTemplateCommand.createFromTemplate(zeroBytesTemplate, '/target', 'empty.txt', new Map());
            assert.ok(result.success, 'Should handle zero-byte files');
        });
        test('Should handle template with maximum nesting depth', async () => {
            const deepPath = Array.from({ length: 20 }, (_, i) => `level${i}`).join('/');
            const deepTemplate = {
                name: 'Deep',
                type: 'folder',
                path: '/test',
                files: [{ relativePath: `${deepPath}/deep-file.txt`, content: 'deep content' }],
                variables: []
            };
            const result = await newFromTemplateCommand.createFromTemplate(deepTemplate, '/target', 'deep-project', new Map());
            // Should either succeed or fail gracefully based on platform limits
            assert.ok(typeof result.success === 'boolean', 'Should handle deep nesting appropriately');
        });
    });
});
//# sourceMappingURL=errorHandling.test.js.map