import * as assert from 'assert';
import { Template, TemplateFile } from '../../src/models/template';

suite('Template Tests', () => {
  test('Template should have required properties', () => {
    const template: Template = {
      name: 'Test Template',
      description: 'A test template',
      path: '/path/to/template',
      type: 'file',
      files: []
    };

    assert.strictEqual(template.name, 'Test Template');
    assert.strictEqual(template.description, 'A test template');
    assert.strictEqual(template.path, '/path/to/template');
    assert.strictEqual(template.type, 'file');
    assert.ok(Array.isArray(template.files));
  });

  test('Template type should be file or folder', () => {
    const fileTemplate: Template = {
      name: 'File Template',
      description: '',
      path: '/path/file.txt',
      type: 'file',
      files: []
    };

    const folderTemplate: Template = {
      name: 'Folder Template',
      description: '',
      path: '/path/folder',
      type: 'folder',
      files: [
        { relativePath: 'file1.txt', content: '' },
        { relativePath: 'file2.txt', content: '' }
      ]
    };

    assert.strictEqual(fileTemplate.type, 'file');
    assert.strictEqual(folderTemplate.type, 'folder');
    assert.strictEqual(folderTemplate.files.length, 2);
  });

  test('TemplateFile should have relativePath and content', () => {
    const templateFile: TemplateFile = {
      relativePath: 'src/index.ts',
      content: 'console.log("Hello");'
    };

    assert.strictEqual(templateFile.relativePath, 'src/index.ts');
    assert.strictEqual(templateFile.content, 'console.log("Hello");');
  });

  test('Template files array can contain multiple files', () => {
    const template: Template = {
      name: 'Multi-file Template',
      description: 'Template with multiple files',
      path: '/path',
      type: 'folder',
      files: [
        { relativePath: 'file1.txt', content: 'Content 1' },
        { relativePath: 'nested/file2.txt', content: 'Content 2' },
        { relativePath: 'nested/deep/file3.txt', content: 'Content 3' }
      ]
    };

    assert.strictEqual(template.files.length, 3);
    assert.strictEqual(template.files[1].relativePath, 'nested/file2.txt');
  });
});