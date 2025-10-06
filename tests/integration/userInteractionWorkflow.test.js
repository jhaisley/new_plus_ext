"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
// Import will fail until implementation exists - this is expected for TDD
const templateService_1 = require("../../src/services/templateService");
const configService_1 = require("../../src/services/configService");
const variableService_1 = require("../../src/services/variableService");
const newFromTemplate_1 = require("../../src/commands/newFromTemplate");
const openTemplatesFolder_1 = require("../../src/commands/openTemplatesFolder");
suite('User Interaction Workflow Tests', () => {
    let templateService;
    let configService;
    let variableService;
    let newFromTemplateCommand;
    let openTemplatesFolderCommand;
    setup(() => {
        configService = new configService_1.ConfigService();
        variableService = new variableService_1.VariableService();
        templateService = new templateService_1.TemplateService(configService);
        newFromTemplateCommand = new newFromTemplate_1.NewFromTemplateCommand(templateService, variableService);
        openTemplatesFolderCommand = new openTemplatesFolder_1.OpenTemplatesFolderCommand();
    });
    suite('Template Selection Workflow', () => {
        test('Should present template selection quick pick', async () => {
            const mockTemplates = [
                { name: 'File Template', description: 'Create a file', type: 'file', path: '/test1', files: [], variables: [] },
                { name: 'Folder Template', description: 'Create a folder', type: 'folder', path: '/test2', files: [], variables: [] }
            ];
            templateService.getTemplates = async () => mockTemplates;
            let quickPickShown = false;
            let quickPickItems = [];
            const originalShowQuickPick = vscode.window.showQuickPick;
            vscode.window.showQuickPick = async (items) => {
                quickPickShown = true;
                quickPickItems = items;
                return items[0]; // Select first item
            };
            try {
                const result = await newFromTemplateCommand.showTemplateSelection();
                assert.ok(quickPickShown, 'Should show quick pick for template selection');
                assert.strictEqual(quickPickItems.length, 2, 'Should show all available templates');
                assert.strictEqual(quickPickItems[0].label, 'File Template');
                assert.strictEqual(quickPickItems[1].label, 'Folder Template');
                assert.ok(result, 'Should return selected template');
            }
            finally {
                vscode.window.showQuickPick = originalShowQuickPick;
            }
        });
        test('Should handle empty template list gracefully', async () => {
            templateService.getTemplates = async () => [];
            let errorMessageShown = false;
            const originalShowErrorMessage = vscode.window.showErrorMessage;
            vscode.window.showErrorMessage = async (message) => {
                errorMessageShown = true;
                assert.ok(message.includes('template') || message.includes('found'));
                return undefined;
            };
            try {
                const result = await newFromTemplateCommand.showTemplateSelection();
                assert.ok(errorMessageShown, 'Should show error message for empty template list');
                assert.ok(!result, 'Should return undefined when no templates available');
            }
            finally {
                vscode.window.showErrorMessage = originalShowErrorMessage;
            }
        });
        test('Should group templates by type in quick pick', async () => {
            const mockTemplates = [
                { name: 'React Component', description: 'React file', type: 'file', path: '/test1', files: [], variables: [] },
                { name: 'Vue Component', description: 'Vue file', type: 'file', path: '/test2', files: [], variables: [] },
                { name: 'Node Project', description: 'Node folder', type: 'folder', path: '/test3', files: [], variables: [] },
                { name: 'React App', description: 'React folder', type: 'folder', path: '/test4', files: [], variables: [] }
            ];
            templateService.getTemplates = async () => mockTemplates;
            let quickPickItems = [];
            const originalShowQuickPick = vscode.window.showQuickPick;
            vscode.window.showQuickPick = async (items) => {
                quickPickItems = items;
                return items[0];
            };
            try {
                await newFromTemplateCommand.showTemplateSelection();
                // Should have separators for grouping
                const separators = quickPickItems.filter(item => item.kind === vscode.QuickPickItemKind.Separator);
                assert.ok(separators.length >= 1, 'Should have separators for grouping templates by type');
            }
            finally {
                vscode.window.showQuickPick = originalShowQuickPick;
            }
        });
        test('Should show recently used templates first', async () => {
            const mockTemplates = [
                { name: 'Template A', description: 'First', type: 'file', path: '/test1', files: [], variables: [] },
                { name: 'Template B', description: 'Second', type: 'file', path: '/test2', files: [], variables: [] },
                { name: 'Template C', description: 'Third', type: 'file', path: '/test3', files: [], variables: [] }
            ];
            templateService.getTemplates = async () => mockTemplates;
            // Mock recently used templates
            templateService.getRecentlyUsedTemplates = async () => ['Template C', 'Template A'];
            let quickPickItems = [];
            const originalShowQuickPick = vscode.window.showQuickPick;
            vscode.window.showQuickPick = async (items) => {
                quickPickItems = items;
                return items[0];
            };
            try {
                await newFromTemplateCommand.showTemplateSelection();
                // Recently used should appear first (after any separators)
                const templateItems = quickPickItems.filter(item => item.kind !== vscode.QuickPickItemKind.Separator);
                assert.strictEqual(templateItems[0].label, 'Template C', 'Most recently used should be first');
                assert.strictEqual(templateItems[1].label, 'Template A', 'Second most recently used should be second');
            }
            finally {
                vscode.window.showQuickPick = originalShowQuickPick;
            }
        });
        test('Should support template search and filtering', async () => {
            const mockTemplates = [
                { name: 'React Component', description: 'React JSX file', type: 'file', path: '/test1', files: [], variables: [] },
                { name: 'Vue Component', description: 'Vue SFC file', type: 'file', path: '/test2', files: [], variables: [] },
                { name: 'Angular Component', description: 'Angular TS file', type: 'file', path: '/test3', files: [], variables: [] }
            ];
            templateService.getTemplates = async () => mockTemplates;
            let quickPickOptions;
            const originalShowQuickPick = vscode.window.showQuickPick;
            vscode.window.showQuickPick = async (items, options) => {
                quickPickOptions = options;
                return items[0];
            };
            try {
                await newFromTemplateCommand.showTemplateSelection();
                assert.ok(quickPickOptions, 'Should provide quick pick options');
                assert.ok(quickPickOptions.canPickMany === false, 'Should not allow multiple selection');
                assert.ok(quickPickOptions.placeHolder, 'Should have placeholder text');
                assert.ok(quickPickOptions.matchOnDescription, 'Should enable search on description');
            }
            finally {
                vscode.window.showQuickPick = originalShowQuickPick;
            }
        });
    });
    suite('Variable Input Workflow', () => {
        test('Should prompt for template variables sequentially', async () => {
            const template = {
                name: 'Test Template',
                description: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: [
                    { name: 'name', prompt: 'Enter your name', defaultValue: '' },
                    { name: 'email', prompt: 'Enter your email', defaultValue: 'user@example.com' },
                    { name: 'company', prompt: 'Enter company name', defaultValue: '' }
                ]
            };
            const inputPrompts = [];
            const inputValues = ['John Doe', 'john@example.com', 'Acme Corp'];
            let inputIndex = 0;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                inputPrompts.push(options?.prompt || '');
                return inputValues[inputIndex++];
            };
            try {
                const variables = await newFromTemplateCommand.collectVariableValues(template);
                assert.strictEqual(inputPrompts.length, 3, 'Should prompt for all variables');
                assert.ok(inputPrompts[0].includes('name'), 'First prompt should be for name');
                assert.ok(inputPrompts[1].includes('email'), 'Second prompt should be for email');
                assert.ok(inputPrompts[2].includes('company'), 'Third prompt should be for company');
                assert.strictEqual(variables.get('name'), 'John Doe');
                assert.strictEqual(variables.get('email'), 'john@example.com');
                assert.strictEqual(variables.get('company'), 'Acme Corp');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should show default values in input prompts', async () => {
            const template = {
                name: 'Test Template',
                description: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: [
                    { name: 'author', prompt: 'Enter author name', defaultValue: 'Anonymous' }
                ]
            };
            let inputOptions;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                inputOptions = options;
                return ''; // User accepts default
            };
            try {
                await newFromTemplateCommand.collectVariableValues(template);
                assert.ok(inputOptions, 'Should provide input options');
                assert.strictEqual(inputOptions.value, 'Anonymous', 'Should show default value');
                assert.ok(inputOptions.prompt?.includes('author'), 'Should show variable prompt');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should validate variable input', async () => {
            const template = {
                name: 'Test Template',
                description: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: [
                    {
                        name: 'filename',
                        prompt: 'Enter filename',
                        defaultValue: '',
                        validation: '^[a-zA-Z0-9._-]+$' // Only allow valid filename characters
                    }
                ]
            };
            let validationFunction;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                validationFunction = options?.validateInput;
                return 'valid-filename.txt';
            };
            try {
                await newFromTemplateCommand.collectVariableValues(template);
                assert.ok(validationFunction, 'Should provide validation function');
                // Test validation
                const invalidResult = validationFunction('invalid<>filename');
                const validResult = validationFunction('valid-filename.txt');
                assert.ok(invalidResult, 'Should reject invalid filename');
                assert.ok(!validResult, 'Should accept valid filename');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should handle user cancellation during variable input', async () => {
            const template = {
                name: 'Test Template',
                description: 'Test',
                type: 'file',
                path: '/test',
                files: [],
                variables: [
                    { name: 'var1', prompt: 'Enter var1', defaultValue: '' },
                    { name: 'var2', prompt: 'Enter var2', defaultValue: '' }
                ]
            };
            let inputCount = 0;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                inputCount++;
                if (inputCount === 2) {
                    return undefined; // User cancels on second input
                }
                return 'value1';
            };
            try {
                const variables = await newFromTemplateCommand.collectVariableValues(template);
                assert.ok(!variables, 'Should return undefined when user cancels');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should support multi-step variable input for complex templates', async () => {
            const template = {
                name: 'Complex Template',
                description: 'Complex multi-step template',
                type: 'folder',
                path: '/test',
                files: [],
                variables: [
                    { name: 'type', prompt: 'Project type (web/api/cli)', defaultValue: 'web' },
                    { name: 'name', prompt: 'Project name', defaultValue: '' },
                    { name: 'description', prompt: 'Project description', defaultValue: '' },
                    { name: 'author', prompt: 'Author name', defaultValue: '' },
                    { name: 'license', prompt: 'License (MIT/Apache/GPL)', defaultValue: 'MIT' }
                ]
            };
            const inputSequence = ['web', 'my-project', 'A great project', 'John Doe', 'MIT'];
            let inputIndex = 0;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                return inputSequence[inputIndex++];
            };
            try {
                const variables = await newFromTemplateCommand.collectVariableValues(template);
                assert.ok(variables, 'Should collect all variables');
                assert.strictEqual(variables.size, 5, 'Should have all 5 variables');
                assert.strictEqual(variables.get('type'), 'web');
                assert.strictEqual(variables.get('name'), 'my-project');
                assert.strictEqual(variables.get('description'), 'A great project');
                assert.strictEqual(variables.get('author'), 'John Doe');
                assert.strictEqual(variables.get('license'), 'MIT');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
    });
    suite('File Name and Location Workflow', () => {
        test('Should prompt for file/folder name', async () => {
            let namePromptShown = false;
            let namePrompt = '';
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                namePromptShown = true;
                namePrompt = options?.prompt || '';
                return 'my-new-file.txt';
            };
            try {
                const name = await newFromTemplateCommand.promptForName('file');
                assert.ok(namePromptShown, 'Should show input prompt for name');
                assert.ok(namePrompt.includes('file'), 'Prompt should mention file');
                assert.strictEqual(name, 'my-new-file.txt');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should suggest default name based on template', async () => {
            const template = {
                name: 'React Component',
                description: 'React component template',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'Component.tsx', content: '' }],
                variables: []
            };
            let inputOptions;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                inputOptions = options;
                return 'MyComponent.tsx';
            };
            try {
                await newFromTemplateCommand.promptForNameWithTemplate(template);
                assert.ok(inputOptions, 'Should provide input options');
                assert.ok(inputOptions.value, 'Should suggest default name');
                assert.ok(inputOptions.value.includes('Component'), 'Default should be based on template');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should validate file/folder names', async () => {
            let validationFunction;
            const originalShowInputBox = vscode.window.showInputBox;
            vscode.window.showInputBox = async (options) => {
                validationFunction = options?.validateInput;
                return 'valid-name.txt';
            };
            try {
                await newFromTemplateCommand.promptForName('file');
                assert.ok(validationFunction, 'Should provide validation function');
                // Test invalid names
                const invalidNames = ['con.txt', 'file*.txt', 'file?.txt', 'file<>.txt'];
                for (const invalidName of invalidNames) {
                    const result = validationFunction(invalidName);
                    if (process.platform === 'win32') {
                        assert.ok(result, `Should reject invalid name: ${invalidName}`);
                    }
                }
                // Test valid name
                const validResult = validationFunction('valid-name.txt');
                assert.ok(!validResult, 'Should accept valid name');
            }
            finally {
                vscode.window.showInputBox = originalShowInputBox;
            }
        });
        test('Should use current workspace context for location', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace/test-project'),
                name: 'test-project',
                index: 0
            };
            const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: [mockWorkspaceFolder],
                configurable: true
            });
            try {
                const location = await newFromTemplateCommand.determineTargetLocation();
                assert.ok(location, 'Should determine target location');
                assert.ok(location.includes('test-project'), 'Should use workspace context');
            }
            finally {
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalWorkspaceFolders,
                    configurable: true
                });
            }
        });
    });
    suite('Progress and Feedback Workflow', () => {
        test('Should show progress during template creation', async () => {
            const template = {
                name: 'Large Template',
                description: 'Template with many files',
                type: 'folder',
                path: '/test',
                files: Array.from({ length: 10 }, (_, i) => ({
                    relativePath: `file${i}.txt`,
                    content: `Content ${i}`
                })),
                variables: []
            };
            let progressShown = false;
            let progressTitle = '';
            let progressReports = [];
            const originalWithProgress = vscode.window.withProgress;
            vscode.window.withProgress = async (options, task) => {
                progressShown = true;
                progressTitle = options.title || '';
                const mockProgress = {
                    report: (value) => {
                        progressReports.push(value);
                    }
                };
                return await task(mockProgress);
            };
            try {
                const result = await newFromTemplateCommand.createFromTemplate(template, '/target', 'test-project', new Map());
                assert.ok(progressShown, 'Should show progress dialog');
                assert.ok(progressTitle.includes('creat'), 'Progress title should mention creation');
                assert.ok(progressReports.length > 0, 'Should report progress updates');
            }
            finally {
                vscode.window.withProgress = originalWithProgress;
            }
        });
        test('Should show success notification after creation', async () => {
            const template = {
                name: 'Simple Template',
                description: 'Simple template',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'simple.txt', content: 'Simple content' }],
                variables: []
            };
            let successMessageShown = false;
            let successMessage = '';
            const originalShowInformationMessage = vscode.window.showInformationMessage;
            vscode.window.showInformationMessage = async (message) => {
                successMessageShown = true;
                successMessage = message;
                return undefined;
            };
            try {
                const result = await newFromTemplateCommand.createFromTemplate(template, '/target', 'simple.txt', new Map());
                if (result.success) {
                    assert.ok(successMessageShown, 'Should show success message');
                    assert.ok(successMessage.includes('created') || successMessage.includes('success'), 'Success message should indicate completion');
                }
            }
            finally {
                vscode.window.showInformationMessage = originalShowInformationMessage;
            }
        });
        test('Should show error notification on failure', async () => {
            const template = {
                name: 'Failing Template',
                description: 'Template that will fail',
                type: 'file',
                path: '/test',
                files: [{ relativePath: 'fail.txt', content: 'Content' }],
                variables: []
            };
            // Mock creation to fail
            const originalCreateFromTemplate = newFromTemplateCommand.createFromTemplate;
            newFromTemplateCommand.createFromTemplate = async () => ({
                success: false,
                error: 'Mock creation failure'
            });
            let errorMessageShown = false;
            let errorMessage = '';
            const originalShowErrorMessage = vscode.window.showErrorMessage;
            vscode.window.showErrorMessage = async (message) => {
                errorMessageShown = true;
                errorMessage = message;
                return undefined;
            };
            try {
                const result = await newFromTemplateCommand.execute();
                assert.ok(errorMessageShown, 'Should show error message');
                assert.ok(errorMessage.includes('fail') || errorMessage.includes('error'), 'Error message should indicate failure');
            }
            finally {
                vscode.window.showErrorMessage = originalShowErrorMessage;
                newFromTemplateCommand.createFromTemplate = originalCreateFromTemplate;
            }
        });
        test('Should offer to open created files/folders', async () => {
            const template = {
                name: 'Openable Template',
                description: 'Template that offers to open result',
                type: 'folder',
                path: '/test',
                files: [{ relativePath: 'index.js', content: 'console.log("Hello");' }],
                variables: []
            };
            let openOfferShown = false;
            let openOfferMessage = '';
            const originalShowInformationMessage = vscode.window.showInformationMessage;
            vscode.window.showInformationMessage = async (message, ...items) => {
                if (items.length > 0) {
                    openOfferShown = true;
                    openOfferMessage = message;
                    return items[0]; // User chooses to open
                }
                return undefined;
            };
            try {
                const result = await newFromTemplateCommand.createFromTemplate(template, '/target', 'test-project', new Map());
                if (result.success) {
                    assert.ok(openOfferShown, 'Should offer to open created folder');
                    assert.ok(openOfferMessage.includes('open') || openOfferMessage.includes('Open'), 'Should offer to open the result');
                }
            }
            finally {
                vscode.window.showInformationMessage = originalShowInformationMessage;
            }
        });
    });
    suite('Templates Folder Management Workflow', () => {
        test('Should open templates folder when command executed', async () => {
            let systemCommandExecuted = false;
            let executedCommand = '';
            openTemplatesFolderCommand.executeSystemCommand = async (command) => {
                systemCommandExecuted = true;
                executedCommand = command;
            };
            await openTemplatesFolderCommand.execute();
            assert.ok(systemCommandExecuted, 'Should execute system command to open folder');
            assert.ok(executedCommand.length > 0, 'Should execute non-empty command');
        });
        test('Should create templates folder if it does not exist', async () => {
            let folderCreated = false;
            let infoMessageShown = false;
            openTemplatesFolderCommand.checkFolderExists = async () => false;
            openTemplatesFolderCommand.createFolder = async () => {
                folderCreated = true;
            };
            const originalShowInformationMessage = vscode.window.showInformationMessage;
            vscode.window.showInformationMessage = async (message) => {
                infoMessageShown = true;
                return undefined;
            };
            try {
                await openTemplatesFolderCommand.execute();
                assert.ok(folderCreated, 'Should create templates folder');
                assert.ok(infoMessageShown, 'Should inform user about folder creation');
            }
            finally {
                vscode.window.showInformationMessage = originalShowInformationMessage;
            }
        });
        test('Should handle templates folder creation errors gracefully', async () => {
            let errorShown = false;
            openTemplatesFolderCommand.checkFolderExists = async () => false;
            openTemplatesFolderCommand.createFolder = async () => {
                throw new Error('Permission denied');
            };
            const originalShowErrorMessage = vscode.window.showErrorMessage;
            vscode.window.showErrorMessage = async (message) => {
                errorShown = true;
                assert.ok(message.includes('create') || message.includes('permission'));
                return undefined;
            };
            try {
                await openTemplatesFolderCommand.execute();
                assert.ok(errorShown, 'Should show error when folder creation fails');
            }
            finally {
                vscode.window.showErrorMessage = originalShowErrorMessage;
            }
        });
    });
    suite('Context Menu Integration Workflow', () => {
        test('Should execute from File Explorer context menu', async () => {
            // Mock explorer context (right-click in explorer)
            const mockUri = vscode.Uri.file('/workspace/src');
            let commandExecuted = false;
            const originalExecute = newFromTemplateCommand.execute;
            newFromTemplateCommand.execute = async (uri) => {
                commandExecuted = true;
                assert.strictEqual(uri?.fsPath, mockUri.fsPath, 'Should receive context URI');
                return { success: true };
            };
            try {
                // Simulate command palette or context menu execution
                await vscode.commands.executeCommand('newFromTemplate.createFromTemplate', mockUri);
                assert.ok(commandExecuted, 'Should execute command with context');
            }
            finally {
                newFromTemplateCommand.execute = originalExecute;
            }
        });
        test('Should adapt behavior based on context', async () => {
            const fileUri = vscode.Uri.file('/workspace/src/components/Button.tsx');
            const folderUri = vscode.Uri.file('/workspace/src/components');
            // Test file context - should suggest file templates
            let fileContextTemplates = [];
            const originalShowTemplateSelection = newFromTemplateCommand.showTemplateSelection;
            newFromTemplateCommand.showTemplateSelection = async (context) => {
                if (context === 'file') {
                    fileContextTemplates = [
                        { name: 'File Template', type: 'file', description: '', path: '', files: [], variables: [] }
                    ];
                }
                return fileContextTemplates[0];
            };
            try {
                await newFromTemplateCommand.execute(fileUri);
                // Should filter to file templates when in file context
            }
            finally {
                newFromTemplateCommand.showTemplateSelection = originalShowTemplateSelection;
            }
        });
    });
});
//# sourceMappingURL=userInteractionWorkflow.test.js.map