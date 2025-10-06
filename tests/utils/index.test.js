"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
// Import will fail until implementation exists - this is expected for TDD
const utils_1 = require("../../src/utils");
suite('Validation Utils Tests', () => {
    test('Should validate template name correctly', () => {
        // Valid names
        assert.ok(utils_1.ValidationUtils.isValidTemplateName('MyTemplate'));
        assert.ok(utils_1.ValidationUtils.isValidTemplateName('template-with-dashes'));
        assert.ok(utils_1.ValidationUtils.isValidTemplateName('template_with_underscores'));
        assert.ok(utils_1.ValidationUtils.isValidTemplateName('Template123'));
        // Invalid names
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName(''));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template with spaces'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template/with/slashes'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template\\with\\backslashes'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template:with:colons'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template*with*wildcards'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template?with?questions'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template"with"quotes'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template<with>brackets'));
        assert.ok(!utils_1.ValidationUtils.isValidTemplateName('template|with|pipes'));
    });
    test('Should validate file names correctly', () => {
        // Valid file names
        assert.ok(utils_1.ValidationUtils.isValidFileName('document.txt'));
        assert.ok(utils_1.ValidationUtils.isValidFileName('my-file.json'));
        assert.ok(utils_1.ValidationUtils.isValidFileName('file_name.xml'));
        assert.ok(utils_1.ValidationUtils.isValidFileName('File123.dat'));
        // Invalid file names
        assert.ok(!utils_1.ValidationUtils.isValidFileName(''));
        assert.ok(!utils_1.ValidationUtils.isValidFileName('file with spaces.txt'));
        assert.ok(!utils_1.ValidationUtils.isValidFileName('file/with/slashes.txt'));
        assert.ok(!utils_1.ValidationUtils.isValidFileName('CON.txt')); // Windows reserved
        assert.ok(!utils_1.ValidationUtils.isValidFileName('PRN.txt')); // Windows reserved
        assert.ok(!utils_1.ValidationUtils.isValidFileName('file*.txt'));
        assert.ok(!utils_1.ValidationUtils.isValidFileName('file?.txt'));
    });
    test('Should validate folder names correctly', () => {
        // Valid folder names
        assert.ok(utils_1.ValidationUtils.isValidFolderName('MyFolder'));
        assert.ok(utils_1.ValidationUtils.isValidFolderName('folder-with-dashes'));
        assert.ok(utils_1.ValidationUtils.isValidFolderName('folder_with_underscores'));
        assert.ok(utils_1.ValidationUtils.isValidFolderName('Folder123'));
        // Invalid folder names
        assert.ok(!utils_1.ValidationUtils.isValidFolderName(''));
        assert.ok(!utils_1.ValidationUtils.isValidFolderName('folder with spaces'));
        assert.ok(!utils_1.ValidationUtils.isValidFolderName('folder/with/slashes'));
        assert.ok(!utils_1.ValidationUtils.isValidFolderName('CON')); // Windows reserved
        assert.ok(!utils_1.ValidationUtils.isValidFolderName('folder*'));
        assert.ok(!utils_1.ValidationUtils.isValidFolderName('folder?'));
    });
    test('Should sanitize names correctly', () => {
        assert.strictEqual(utils_1.ValidationUtils.sanitizeName('My Template'), 'MyTemplate');
        assert.strictEqual(utils_1.ValidationUtils.sanitizeName('file/with\\slashes'), 'filewithslashes');
        assert.strictEqual(utils_1.ValidationUtils.sanitizeName('file:with*wildcards'), 'filewithwildcards');
        assert.strictEqual(utils_1.ValidationUtils.sanitizeName('  spaced  '), 'spaced');
        assert.strictEqual(utils_1.ValidationUtils.sanitizeName('CON'), 'CON_'); // Reserved name handling
    });
    test('Should validate paths correctly', () => {
        assert.ok(utils_1.ValidationUtils.isValidPath('C:\\valid\\path'));
        assert.ok(utils_1.ValidationUtils.isValidPath('/valid/unix/path'));
        assert.ok(utils_1.ValidationUtils.isValidPath('./relative/path'));
        assert.ok(!utils_1.ValidationUtils.isValidPath(''));
        assert.ok(!utils_1.ValidationUtils.isValidPath('invalid:path*'));
        assert.ok(!utils_1.ValidationUtils.isValidPath('path\\with\\<invalid>\\chars'));
    });
});
suite('File Operation Utils Tests', () => {
    test('Should check if file exists', async () => {
        // Test with known file (package.json should exist)
        const packageJsonExists = await utils_1.FileOperationUtils.fileExists(path.join(__dirname, '../../package.json'));
        assert.ok(packageJsonExists);
        // Test with non-existent file
        const nonExistentExists = await utils_1.FileOperationUtils.fileExists(path.join(__dirname, 'non-existent-file.txt'));
        assert.ok(!nonExistentExists);
    });
    test('Should check if directory exists', async () => {
        // Test with known directory
        const srcExists = await utils_1.FileOperationUtils.directoryExists(path.join(__dirname, '../../src'));
        assert.ok(srcExists);
        // Test with non-existent directory
        const nonExistentExists = await utils_1.FileOperationUtils.directoryExists(path.join(__dirname, 'non-existent-directory'));
        assert.ok(!nonExistentExists);
    });
    test('Should create directory with parents', async () => {
        const testDir = path.join(__dirname, 'test-temp-dir', 'nested', 'path');
        try {
            await utils_1.FileOperationUtils.ensureDirectory(testDir);
            const exists = await utils_1.FileOperationUtils.directoryExists(testDir);
            assert.ok(exists);
        }
        finally {
            // Clean up - remove test directory
            try {
                await utils_1.FileOperationUtils.removeDirectory(path.join(__dirname, 'test-temp-dir'));
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
    });
    test('Should copy file correctly', async () => {
        const sourceFile = path.join(__dirname, 'test-source.txt');
        const targetFile = path.join(__dirname, 'test-target.txt');
        const content = 'Test content for copy operation';
        try {
            // Create source file
            await utils_1.FileOperationUtils.writeFile(sourceFile, content);
            // Copy file
            await utils_1.FileOperationUtils.copyFile(sourceFile, targetFile);
            // Verify copy
            const targetExists = await utils_1.FileOperationUtils.fileExists(targetFile);
            assert.ok(targetExists);
            const targetContent = await utils_1.FileOperationUtils.readFile(targetFile);
            assert.strictEqual(targetContent, content);
        }
        finally {
            // Clean up
            try {
                await utils_1.FileOperationUtils.deleteFile(sourceFile);
                await utils_1.FileOperationUtils.deleteFile(targetFile);
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
    });
    test('Should copy directory recursively', async () => {
        const sourceDir = path.join(__dirname, 'test-source-dir');
        const targetDir = path.join(__dirname, 'test-target-dir');
        try {
            // Create source directory structure
            await utils_1.FileOperationUtils.ensureDirectory(sourceDir);
            await utils_1.FileOperationUtils.ensureDirectory(path.join(sourceDir, 'nested'));
            await utils_1.FileOperationUtils.writeFile(path.join(sourceDir, 'file1.txt'), 'Content 1');
            await utils_1.FileOperationUtils.writeFile(path.join(sourceDir, 'nested', 'file2.txt'), 'Content 2');
            // Copy directory
            await utils_1.FileOperationUtils.copyDirectory(sourceDir, targetDir);
            // Verify copy
            assert.ok(await utils_1.FileOperationUtils.directoryExists(targetDir));
            assert.ok(await utils_1.FileOperationUtils.fileExists(path.join(targetDir, 'file1.txt')));
            assert.ok(await utils_1.FileOperationUtils.fileExists(path.join(targetDir, 'nested', 'file2.txt')));
            const content1 = await utils_1.FileOperationUtils.readFile(path.join(targetDir, 'file1.txt'));
            const content2 = await utils_1.FileOperationUtils.readFile(path.join(targetDir, 'nested', 'file2.txt'));
            assert.strictEqual(content1, 'Content 1');
            assert.strictEqual(content2, 'Content 2');
        }
        finally {
            // Clean up
            try {
                await utils_1.FileOperationUtils.removeDirectory(sourceDir);
                await utils_1.FileOperationUtils.removeDirectory(targetDir);
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
    });
    test('Should handle file operation errors gracefully', async () => {
        // Test reading non-existent file
        try {
            await utils_1.FileOperationUtils.readFile('/non/existent/file.txt');
            assert.fail('Should have thrown error');
        }
        catch (error) {
            assert.ok(error instanceof Error);
        }
        // Test copying to invalid destination
        try {
            await utils_1.FileOperationUtils.copyFile('source.txt', '/invalid/path*/file.txt');
            assert.fail('Should have thrown error');
        }
        catch (error) {
            assert.ok(error instanceof Error);
        }
    });
});
suite('Path Utils Tests', () => {
    test('Should normalize paths correctly', () => {
        assert.strictEqual(utils_1.PathUtils.normalize('C:\\path\\with\\..\\dots'), 'C:\\path');
        assert.strictEqual(utils_1.PathUtils.normalize('/unix/path/with/../dots'), '/unix/path');
        assert.strictEqual(utils_1.PathUtils.normalize('./relative/path'), path.resolve('./relative/path'));
    });
    test('Should join paths correctly', () => {
        const joined = utils_1.PathUtils.join('base', 'folder', 'file.txt');
        assert.strictEqual(joined, path.join('base', 'folder', 'file.txt'));
    });
    test('Should resolve relative paths', () => {
        const resolved = utils_1.PathUtils.resolve('./relative/path');
        assert.strictEqual(resolved, path.resolve('./relative/path'));
    });
    test('Should get file extension correctly', () => {
        assert.strictEqual(utils_1.PathUtils.getExtension('file.txt'), '.txt');
        assert.strictEqual(utils_1.PathUtils.getExtension('document.json'), '.json');
        assert.strictEqual(utils_1.PathUtils.getExtension('noextension'), '');
        assert.strictEqual(utils_1.PathUtils.getExtension('.hidden'), '');
        assert.strictEqual(utils_1.PathUtils.getExtension('file.multiple.extensions'), '.extensions');
    });
    test('Should get basename correctly', () => {
        assert.strictEqual(utils_1.PathUtils.getBasename('C:\\path\\file.txt'), 'file.txt');
        assert.strictEqual(utils_1.PathUtils.getBasename('/unix/path/file.txt'), 'file.txt');
        assert.strictEqual(utils_1.PathUtils.getBasename('file.txt'), 'file.txt');
    });
    test('Should get dirname correctly', () => {
        assert.strictEqual(utils_1.PathUtils.getDirname('C:\\path\\file.txt'), 'C:\\path');
        assert.strictEqual(utils_1.PathUtils.getDirname('/unix/path/file.txt'), '/unix/path');
        assert.strictEqual(utils_1.PathUtils.getDirname('file.txt'), '.');
    });
    test('Should check if path is absolute', () => {
        assert.ok(utils_1.PathUtils.isAbsolute('C:\\absolute\\path'));
        assert.ok(utils_1.PathUtils.isAbsolute('/unix/absolute/path'));
        assert.ok(!utils_1.PathUtils.isAbsolute('./relative/path'));
        assert.ok(!utils_1.PathUtils.isAbsolute('relative/path'));
    });
    test('Should convert to platform-specific path separators', () => {
        const mixedPath = 'some/path\\with/mixed\\separators';
        const normalized = utils_1.PathUtils.toPlatformPath(mixedPath);
        if (process.platform === 'win32') {
            assert.ok(normalized.includes('\\'));
            assert.ok(!normalized.includes('/'));
        }
        else {
            assert.ok(normalized.includes('/'));
            assert.ok(!normalized.includes('\\'));
        }
    });
    test('Should expand environment variables', () => {
        const pathWithEnvVar = utils_1.PathUtils.expandEnvironmentVariables('${HOME}/templates');
        assert.ok(!pathWithEnvVar.includes('${HOME}'));
        const windowsPath = utils_1.PathUtils.expandEnvironmentVariables('%LOCALAPPDATA%\\templates');
        if (process.platform === 'win32') {
            assert.ok(!windowsPath.includes('%LOCALAPPDATA%'));
        }
    });
    test('Should make relative path correctly', () => {
        const from = 'C:\\base\\folder';
        const to = 'C:\\base\\folder\\subfolder\\file.txt';
        const relative = utils_1.PathUtils.makeRelative(from, to);
        assert.strictEqual(relative, path.relative(from, to));
    });
});
//# sourceMappingURL=index.test.js.map