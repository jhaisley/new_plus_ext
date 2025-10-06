"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const fs = require("fs");
suite('Template Entity Tests', () => {
    test('Template should have required properties', () => {
        const templatePath = path.join(__dirname, 'test-template.txt');
        const stats = fs.statSync(__filename); // Use current file for testing
        const template = new template_1.Template('Test Template', 'test-template.txt', templatePath, 'file', 'test-template.txt', false, stats);
        assert.strictEqual(template.name, 'Test Template');
        assert.strictEqual(template.originalName, 'test-template.txt');
        assert.strictEqual(template.path, templatePath);
        assert.strictEqual(template.type, 'file');
        assert.strictEqual(template.isDirectory, false);
    });
    test('Template should validate path exists', () => {
        const invalidPath = path.join(__dirname, 'non-existent-template.txt');
        assert.throws(() => {
            const stats = fs.statSync(__filename);
            new template_1.Template('Invalid Template', 'non-existent-template.txt', invalidPath, 'file', 'non-existent-template.txt', false, stats);
        });
    });
    test('Template should identify directory type correctly', () => {
        const dirPath = __dirname;
        const stats = fs.statSync(dirPath);
        const template = new template_1.Template('Test Directory', 'test-dir', dirPath, 'folder', 'test-dir', true, stats);
        assert.strictEqual(template.type, 'folder');
        assert.strictEqual(template.isDirectory, true);
    });
    test('Template name should not be empty after processing', () => {
        assert.throws(() => {
            const stats = fs.statSync(__filename);
            new template_1.Template('', // Empty name should throw
            'original.txt', __filename, 'file', 'original.txt', false, stats);
        });
    });
    test('Template type should match file system entity', () => {
        const filePath = __filename;
        const fileStats = fs.statSync(filePath);
        // This should throw because we're saying it's a folder but stats show it's a file
        assert.throws(() => {
            new template_1.Template('Test File', 'test.ts', filePath, 'folder', // Wrong type
            'test.ts', true, // Wrong isDirectory
            fileStats);
        });
    });
});
//# sourceMappingURL=template.test.js.map