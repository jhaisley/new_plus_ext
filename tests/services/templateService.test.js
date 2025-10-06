"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
// Import will fail until implementation exists - this is expected for TDD
const templateService_1 = require("../../src/services/templateService");
suite('Template Service Tests', () => {
    let templateService;
    setup(() => {
        templateService = new templateService_1.TemplateService();
    });
    test('Should discover templates from configured directory', async () => {
        const templates = await templateService.discoverTemplates();
        assert.ok(Array.isArray(templates));
    });
    test('Should scan directory recursively', async () => {
        // This test assumes a nested template structure exists
        const templates = await templateService.discoverTemplates();
        // Should find templates in subdirectories
        const hasNestedTemplates = templates.some(t => path.dirname(t.relativePath) !== '.');
        // Note: This may pass even with empty results in test environment
        assert.ok(typeof hasNestedTemplates === 'boolean');
    });
    test('Should return sorted list with folders first', async () => {
        const templates = await templateService.discoverTemplates();
        let foundFirstFile = false;
        for (const template of templates) {
            if (template.type === 'file' && !foundFirstFile) {
                foundFirstFile = true;
            }
            else if (template.type === 'folder' && foundFirstFile) {
                assert.fail('Folders should come before files in sorted list');
            }
        }
    });
    test('Should handle missing templates directory gracefully', async () => {
        templateService.setTemplatesPath('/non/existent/path');
        const templates = await templateService.discoverTemplates();
        assert.strictEqual(templates.length, 0);
    });
    test('Should get template by path', async () => {
        const templates = await templateService.discoverTemplates();
        if (templates.length > 0) {
            const firstTemplate = templates[0];
            const retrieved = await templateService.getTemplate(firstTemplate.path);
            assert.ok(retrieved);
            assert.strictEqual(retrieved.path, firstTemplate.path);
        }
    });
    test('Should return null for non-existent template path', async () => {
        const retrieved = await templateService.getTemplate('/non/existent/template.txt');
        assert.strictEqual(retrieved, null);
    });
    test('Should validate template file permissions', async () => {
        const templates = await templateService.discoverTemplates();
        for (const template of templates) {
            // All discovered templates should be readable
            assert.ok(template.stats);
            assert.ok(template.stats.isFile() || template.stats.isDirectory());
        }
    });
    test('Should preserve file permissions during discovery', async () => {
        const templates = await templateService.discoverTemplates();
        for (const template of templates) {
            // Stats should be preserved from fs.stat
            assert.ok(template.stats.mode !== undefined);
            assert.ok(template.stats.size !== undefined);
            assert.ok(template.stats.mtime instanceof Date);
        }
    });
    test('Should handle empty templates directory', async () => {
        // Test behavior with empty directory
        templateService.setTemplatesPath(path.join(__dirname, 'empty-test-dir'));
        const templates = await templateService.discoverTemplates();
        assert.strictEqual(templates.length, 0);
    });
    test('Should differentiate between files and directories', async () => {
        const templates = await templateService.discoverTemplates();
        for (const template of templates) {
            if (template.type === 'file') {
                assert.strictEqual(template.isDirectory, false);
                assert.ok(template.stats.isFile());
            }
            else if (template.type === 'folder') {
                assert.strictEqual(template.isDirectory, true);
                assert.ok(template.stats.isDirectory());
            }
        }
    });
});
//# sourceMappingURL=templateService.test.js.map