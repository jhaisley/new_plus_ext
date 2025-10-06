"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const path = require("path");
// Import will fail until implementation exists - this is expected for TDD
const templateService_1 = require("../../src/services/templateService");
const configService_1 = require("../../src/services/configService");
const variableService_1 = require("../../src/services/variableService");
const newFromTemplate_1 = require("../../src/commands/newFromTemplate");
suite('Template Discovery Integration Tests', () => {
    let templateService;
    let configService;
    let testWorkspaceRoot;
    setup(async () => {
        // Use a test workspace or create temporary directory
        testWorkspaceRoot = path.join(__dirname, '..', 'test-workspace');
        configService = new configService_1.ConfigService();
        templateService = new templateService_1.TemplateService(configService);
        // Set up test configuration
        await configService.setTemplatesPath(path.join(testWorkspaceRoot, 'templates'));
    });
    test('Should discover all templates in configured directory', async () => {
        // Create test template structure
        const templatesPath = await configService.getTemplatesPath();
        await createTestTemplateStructure(templatesPath);
        const templates = await templateService.discoverTemplates();
        assert.ok(templates.length >= 2); // Should find at least file and folder templates
        const fileTemplate = templates.find(t => t.name === 'TestFileTemplate');
        const folderTemplate = templates.find(t => t.name === 'TestFolderTemplate');
        assert.ok(fileTemplate);
        assert.ok(folderTemplate);
        assert.strictEqual(fileTemplate.type, 'file');
        assert.strictEqual(folderTemplate.type, 'folder');
    });
    test('Should handle nested template directories', async () => {
        const templatesPath = await configService.getTemplatesPath();
        await createNestedTemplateStructure(templatesPath);
        const templates = await templateService.discoverTemplates();
        const nestedTemplate = templates.find(t => t.name === 'NestedTemplate');
        assert.ok(nestedTemplate);
        assert.ok(nestedTemplate.path.includes('category'));
    });
    test('Should validate template structure during discovery', async () => {
        const templatesPath = await configService.getTemplatesPath();
        await createInvalidTemplateStructure(templatesPath);
        const templates = await templateService.discoverTemplates();
        // Invalid templates should be filtered out
        const invalidTemplate = templates.find(t => t.name === 'InvalidTemplate');
        assert.ok(!invalidTemplate);
    });
    test('Should handle template discovery errors gracefully', async () => {
        // Point to non-existent directory
        await configService.setTemplatesPath('/non/existent/path');
        const templates = await templateService.discoverTemplates();
        // Should return empty array, not throw error
        assert.strictEqual(templates.length, 0);
    });
    test('Should refresh template cache when directory changes', async () => {
        const templatesPath = await configService.getTemplatesPath();
        await createTestTemplateStructure(templatesPath);
        // First discovery
        let templates = await templateService.discoverTemplates();
        const initialCount = templates.length;
        // Add new template
        await createAdditionalTemplate(templatesPath);
        // Force refresh
        await templateService.refreshTemplates();
        templates = await templateService.discoverTemplates();
        assert.ok(templates.length > initialCount);
    });
    async function createTestTemplateStructure(basePath) {
        // Create file template
        const fileTemplatePath = path.join(basePath, 'TestFileTemplate');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(fileTemplatePath));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(fileTemplatePath, 'template.txt')), Buffer.from('Hello {{name}}!'));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(fileTemplatePath, 'template.json')), Buffer.from(JSON.stringify({
            name: 'TestFileTemplate',
            description: 'A test file template',
            type: 'file',
            variables: [{ name: 'name', prompt: 'Enter name' }]
        }, null, 2)));
        // Create folder template
        const folderTemplatePath = path.join(basePath, 'TestFolderTemplate');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderTemplatePath));
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.join(folderTemplatePath, 'src')));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(folderTemplatePath, 'src', 'index.js')), Buffer.from('console.log("{{projectName}}");'));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(folderTemplatePath, 'template.json')), Buffer.from(JSON.stringify({
            name: 'TestFolderTemplate',
            description: 'A test folder template',
            type: 'folder',
            variables: [{ name: 'projectName', prompt: 'Enter project name' }]
        }, null, 2)));
    }
    async function createNestedTemplateStructure(basePath) {
        const nestedPath = path.join(basePath, 'category', 'NestedTemplate');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(nestedPath));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(nestedPath, 'template.json')), Buffer.from(JSON.stringify({
            name: 'NestedTemplate',
            description: 'A nested template',
            type: 'file'
        }, null, 2)));
    }
    async function createInvalidTemplateStructure(basePath) {
        const invalidPath = path.join(basePath, 'InvalidTemplate');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(invalidPath));
        // Create template without required template.json
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(invalidPath, 'some-file.txt')), Buffer.from('content'));
    }
    async function createAdditionalTemplate(basePath) {
        const additionalPath = path.join(basePath, 'AdditionalTemplate');
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(additionalPath));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(additionalPath, 'template.json')), Buffer.from(JSON.stringify({
            name: 'AdditionalTemplate',
            description: 'An additional template',
            type: 'file'
        }, null, 2)));
    }
});
suite('Template Creation Workflow Integration Tests', () => {
    let newFromTemplateCommand;
    let templateService;
    let variableService;
    let configService;
    let testWorkspaceRoot;
    setup(async () => {
        testWorkspaceRoot = path.join(__dirname, '..', 'test-workspace');
        configService = new configService_1.ConfigService();
        variableService = new variableService_1.VariableService();
        templateService = new templateService_1.TemplateService(configService);
        newFromTemplateCommand = new newFromTemplate_1.NewFromTemplateCommand(templateService, variableService);
        await configService.setTemplatesPath(path.join(testWorkspaceRoot, 'templates'));
    });
    test('Should create file from template with variable substitution', async () => {
        // Set up template
        const template = await createFileTemplateWithVariables();
        const targetPath = path.join(testWorkspaceRoot, 'output');
        const fileName = 'test-output.txt';
        // Mock user input
        const variableValues = new Map([
            ['name', 'TestUser'],
            ['greeting', 'Hello']
        ]);
        // Execute creation
        const result = await newFromTemplateCommand.createFromTemplate(template, targetPath, fileName, variableValues);
        assert.ok(result.success);
        // Verify file creation
        const createdFilePath = path.join(targetPath, fileName);
        const createdFile = await vscode.workspace.fs.readFile(vscode.Uri.file(createdFilePath));
        const content = Buffer.from(createdFile).toString();
        assert.ok(content.includes('TestUser'));
        assert.ok(content.includes('Hello'));
        assert.ok(!content.includes('{{name}}'));
        assert.ok(!content.includes('{{greeting}}'));
    });
    test('Should create folder from template with recursive variable substitution', async () => {
        // Set up folder template
        const template = await createFolderTemplateWithVariables();
        const targetPath = path.join(testWorkspaceRoot, 'output');
        const folderName = 'test-project';
        // Mock user input
        const variableValues = new Map([
            ['projectName', 'MyProject'],
            ['author', 'TestAuthor']
        ]);
        // Execute creation
        const result = await newFromTemplateCommand.createFromTemplate(template, targetPath, folderName, variableValues);
        assert.ok(result.success);
        // Verify folder structure creation
        const createdFolderPath = path.join(targetPath, folderName);
        const srcFolderExists = await fileExists(path.join(createdFolderPath, 'src'));
        assert.ok(srcFolderExists);
        // Verify variable substitution in files
        const indexFile = await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(createdFolderPath, 'src', 'index.js')));
        const content = Buffer.from(indexFile).toString();
        assert.ok(content.includes('MyProject'));
        assert.ok(content.includes('TestAuthor'));
    });
    test('Should handle file name variable substitution', async () => {
        const template = await createTemplateWithFileNameVariable();
        const targetPath = path.join(testWorkspaceRoot, 'output');
        const fileName = '{{componentName}}.component.ts';
        const variableValues = new Map([
            ['componentName', 'MyComponent']
        ]);
        const result = await newFromTemplateCommand.createFromTemplate(template, targetPath, fileName, variableValues);
        assert.ok(result.success);
        // Verify file name substitution
        const expectedFileName = 'MyComponent.component.ts';
        const createdFile = await fileExists(path.join(targetPath, expectedFileName));
        assert.ok(createdFile);
    });
    test('Should validate target location before creation', async () => {
        const template = await createSimpleFileTemplate();
        const invalidTargetPath = '/invalid/path/that/does/not/exist';
        const fileName = 'test.txt';
        const result = await newFromTemplateCommand.createFromTemplate(template, invalidTargetPath, fileName, new Map());
        assert.ok(!result.success);
        assert.ok(result.error);
        assert.ok(result.error.includes('target') || result.error.includes('path'));
    });
    test('Should handle creation conflicts gracefully', async () => {
        const template = await createSimpleFileTemplate();
        const targetPath = path.join(testWorkspaceRoot, 'output');
        const fileName = 'existing-file.txt';
        // Create existing file
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetPath));
        await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(targetPath, fileName)), Buffer.from('existing content'));
        const result = await newFromTemplateCommand.createFromTemplate(template, targetPath, fileName, new Map());
        // Should handle conflict (either error or overwrite prompt)
        assert.ok(!result.success || result.overwritten);
    });
    test('Should provide progress feedback for large templates', async () => {
        const template = await createLargeTemplate();
        const targetPath = path.join(testWorkspaceRoot, 'output');
        const folderName = 'large-project';
        let progressReported = false;
        const originalWithProgress = vscode.window.withProgress;
        vscode.window.withProgress = async (options, task) => {
            progressReported = true;
            return await task({ report: () => { } });
        };
        try {
            const result = await newFromTemplateCommand.createFromTemplate(template, targetPath, folderName, new Map());
            assert.ok(result.success);
            assert.ok(progressReported);
        }
        finally {
            vscode.window.withProgress = originalWithProgress;
        }
    });
    async function createFileTemplateWithVariables() {
        return {
            name: 'FileWithVariables',
            description: 'File template with variables',
            type: 'file',
            path: path.join(__dirname, 'mock-templates', 'file-with-vars'),
            files: [
                {
                    relativePath: 'template.txt',
                    content: '{{greeting}} {{name}}!\nWelcome to our application.'
                }
            ],
            variables: [
                { name: 'name', prompt: 'Enter your name', defaultValue: '' },
                { name: 'greeting', prompt: 'Enter greeting', defaultValue: 'Hello' }
            ]
        };
    }
    async function createFolderTemplateWithVariables() {
        return {
            name: 'FolderWithVariables',
            description: 'Folder template with variables',
            type: 'folder',
            path: path.join(__dirname, 'mock-templates', 'folder-with-vars'),
            files: [
                {
                    relativePath: 'src/index.js',
                    content: '// Project: {{projectName}}\n// Author: {{author}}\nconsole.log("{{projectName}}");'
                },
                {
                    relativePath: 'README.md',
                    content: '# {{projectName}}\n\nCreated by {{author}}'
                }
            ],
            variables: [
                { name: 'projectName', prompt: 'Enter project name', defaultValue: '' },
                { name: 'author', prompt: 'Enter author name', defaultValue: '' }
            ]
        };
    }
    async function createTemplateWithFileNameVariable() {
        return {
            name: 'ComponentTemplate',
            description: 'Component template with file name variable',
            type: 'file',
            path: path.join(__dirname, 'mock-templates', 'component'),
            files: [
                {
                    relativePath: 'template.ts',
                    content: 'export class {{componentName}} {\n  // Component implementation\n}'
                }
            ],
            variables: [
                { name: 'componentName', prompt: 'Enter component name', defaultValue: '' }
            ]
        };
    }
    async function createSimpleFileTemplate() {
        return {
            name: 'SimpleFile',
            description: 'Simple file template',
            type: 'file',
            path: path.join(__dirname, 'mock-templates', 'simple'),
            files: [
                {
                    relativePath: 'template.txt',
                    content: 'Simple template content'
                }
            ],
            variables: []
        };
    }
    async function createLargeTemplate() {
        const files = [];
        // Create a template with many files to test progress reporting
        for (let i = 0; i < 50; i++) {
            files.push({
                relativePath: `file${i}.txt`,
                content: `Content for file ${i}`
            });
        }
        return {
            name: 'LargeTemplate',
            description: 'Large template with many files',
            type: 'folder',
            path: path.join(__dirname, 'mock-templates', 'large'),
            files,
            variables: []
        };
    }
    async function fileExists(filePath) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        }
        catch {
            return false;
        }
    }
});
//# sourceMappingURL=templateWorkflow.test.js.map