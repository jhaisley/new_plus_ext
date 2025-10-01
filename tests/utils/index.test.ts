import * as assert from 'assert';
import * as path from 'path';
// Import will fail until implementation exists - this is expected for TDD
import { ValidationUtils, FileOperationUtils, PathUtils } from '../../src/utils';

suite('Validation Utils Tests', () => {
  test('Should validate template name correctly', () => {
    // Valid names
    assert.ok(ValidationUtils.isValidTemplateName('MyTemplate'));
    assert.ok(ValidationUtils.isValidTemplateName('template-with-dashes'));
    assert.ok(ValidationUtils.isValidTemplateName('template_with_underscores'));
    assert.ok(ValidationUtils.isValidTemplateName('Template123'));
    
    // Invalid names
    assert.ok(!ValidationUtils.isValidTemplateName(''));
    assert.ok(!ValidationUtils.isValidTemplateName('template with spaces'));
    assert.ok(!ValidationUtils.isValidTemplateName('template/with/slashes'));
    assert.ok(!ValidationUtils.isValidTemplateName('template\\with\\backslashes'));
    assert.ok(!ValidationUtils.isValidTemplateName('template:with:colons'));
    assert.ok(!ValidationUtils.isValidTemplateName('template*with*wildcards'));
    assert.ok(!ValidationUtils.isValidTemplateName('template?with?questions'));
    assert.ok(!ValidationUtils.isValidTemplateName('template"with"quotes'));
    assert.ok(!ValidationUtils.isValidTemplateName('template<with>brackets'));
    assert.ok(!ValidationUtils.isValidTemplateName('template|with|pipes'));
  });

  test('Should validate file names correctly', () => {
    // Valid file names
    assert.ok(ValidationUtils.isValidFileName('document.txt'));
    assert.ok(ValidationUtils.isValidFileName('my-file.json'));
    assert.ok(ValidationUtils.isValidFileName('file_name.xml'));
    assert.ok(ValidationUtils.isValidFileName('File123.dat'));
    
    // Invalid file names
    assert.ok(!ValidationUtils.isValidFileName(''));
    assert.ok(!ValidationUtils.isValidFileName('file with spaces.txt'));
    assert.ok(!ValidationUtils.isValidFileName('file/with/slashes.txt'));
    assert.ok(!ValidationUtils.isValidFileName('CON.txt')); // Windows reserved
    assert.ok(!ValidationUtils.isValidFileName('PRN.txt')); // Windows reserved
    assert.ok(!ValidationUtils.isValidFileName('file*.txt'));
    assert.ok(!ValidationUtils.isValidFileName('file?.txt'));
  });

  test('Should validate folder names correctly', () => {
    // Valid folder names
    assert.ok(ValidationUtils.isValidFolderName('MyFolder'));
    assert.ok(ValidationUtils.isValidFolderName('folder-with-dashes'));
    assert.ok(ValidationUtils.isValidFolderName('folder_with_underscores'));
    assert.ok(ValidationUtils.isValidFolderName('Folder123'));
    
    // Invalid folder names
    assert.ok(!ValidationUtils.isValidFolderName(''));
    assert.ok(!ValidationUtils.isValidFolderName('folder with spaces'));
    assert.ok(!ValidationUtils.isValidFolderName('folder/with/slashes'));
    assert.ok(!ValidationUtils.isValidFolderName('CON')); // Windows reserved
    assert.ok(!ValidationUtils.isValidFolderName('folder*'));
    assert.ok(!ValidationUtils.isValidFolderName('folder?'));
  });

  test('Should sanitize names correctly', () => {
    assert.strictEqual(ValidationUtils.sanitizeName('My Template'), 'MyTemplate');
    assert.strictEqual(ValidationUtils.sanitizeName('file/with\\slashes'), 'filewithslashes');
    assert.strictEqual(ValidationUtils.sanitizeName('file:with*wildcards'), 'filewithwildcards');
    assert.strictEqual(ValidationUtils.sanitizeName('  spaced  '), 'spaced');
    assert.strictEqual(ValidationUtils.sanitizeName('CON'), 'CON_'); // Reserved name handling
  });

  test('Should validate paths correctly', () => {
    assert.ok(ValidationUtils.isValidPath('C:\\valid\\path'));
    assert.ok(ValidationUtils.isValidPath('/valid/unix/path'));
    assert.ok(ValidationUtils.isValidPath('./relative/path'));
    
    assert.ok(!ValidationUtils.isValidPath(''));
    assert.ok(!ValidationUtils.isValidPath('invalid:path*'));
    assert.ok(!ValidationUtils.isValidPath('path\\with\\<invalid>\\chars'));
  });
});

suite('File Operation Utils Tests', () => {
  test('Should check if file exists', async () => {
    // Test with known file (package.json should exist)
    const packageJsonExists = await FileOperationUtils.fileExists(
      path.join(__dirname, '../../package.json')
    );
    assert.ok(packageJsonExists);
    
    // Test with non-existent file
    const nonExistentExists = await FileOperationUtils.fileExists(
      path.join(__dirname, 'non-existent-file.txt')
    );
    assert.ok(!nonExistentExists);
  });

  test('Should check if directory exists', async () => {
    // Test with known directory
    const srcExists = await FileOperationUtils.directoryExists(
      path.join(__dirname, '../../src')
    );
    assert.ok(srcExists);
    
    // Test with non-existent directory
    const nonExistentExists = await FileOperationUtils.directoryExists(
      path.join(__dirname, 'non-existent-directory')
    );
    assert.ok(!nonExistentExists);
  });

  test('Should create directory with parents', async () => {
    const testDir = path.join(__dirname, 'test-temp-dir', 'nested', 'path');
    
    try {
      await FileOperationUtils.ensureDirectory(testDir);
      const exists = await FileOperationUtils.directoryExists(testDir);
      assert.ok(exists);
    } finally {
      // Clean up - remove test directory
      try {
        await FileOperationUtils.removeDirectory(path.join(__dirname, 'test-temp-dir'));
      } catch (e) {
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
      await FileOperationUtils.writeFile(sourceFile, content);
      
      // Copy file
      await FileOperationUtils.copyFile(sourceFile, targetFile);
      
      // Verify copy
      const targetExists = await FileOperationUtils.fileExists(targetFile);
      assert.ok(targetExists);
      
      const targetContent = await FileOperationUtils.readFile(targetFile);
      assert.strictEqual(targetContent, content);
    } finally {
      // Clean up
      try {
        await FileOperationUtils.deleteFile(sourceFile);
        await FileOperationUtils.deleteFile(targetFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('Should copy directory recursively', async () => {
    const sourceDir = path.join(__dirname, 'test-source-dir');
    const targetDir = path.join(__dirname, 'test-target-dir');
    
    try {
      // Create source directory structure
      await FileOperationUtils.ensureDirectory(sourceDir);
      await FileOperationUtils.ensureDirectory(path.join(sourceDir, 'nested'));
      await FileOperationUtils.writeFile(path.join(sourceDir, 'file1.txt'), 'Content 1');
      await FileOperationUtils.writeFile(path.join(sourceDir, 'nested', 'file2.txt'), 'Content 2');
      
      // Copy directory
      await FileOperationUtils.copyDirectory(sourceDir, targetDir);
      
      // Verify copy
      assert.ok(await FileOperationUtils.directoryExists(targetDir));
      assert.ok(await FileOperationUtils.fileExists(path.join(targetDir, 'file1.txt')));
      assert.ok(await FileOperationUtils.fileExists(path.join(targetDir, 'nested', 'file2.txt')));
      
      const content1 = await FileOperationUtils.readFile(path.join(targetDir, 'file1.txt'));
      const content2 = await FileOperationUtils.readFile(path.join(targetDir, 'nested', 'file2.txt'));
      assert.strictEqual(content1, 'Content 1');
      assert.strictEqual(content2, 'Content 2');
    } finally {
      // Clean up
      try {
        await FileOperationUtils.removeDirectory(sourceDir);
        await FileOperationUtils.removeDirectory(targetDir);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('Should handle file operation errors gracefully', async () => {
    // Test reading non-existent file
    try {
      await FileOperationUtils.readFile('/non/existent/file.txt');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    
    // Test copying to invalid destination
    try {
      await FileOperationUtils.copyFile('source.txt', '/invalid/path*/file.txt');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });
});

suite('Path Utils Tests', () => {
  test('Should normalize paths correctly', () => {
    assert.strictEqual(PathUtils.normalize('C:\\path\\with\\..\\dots'), 'C:\\path');
    assert.strictEqual(PathUtils.normalize('/unix/path/with/../dots'), '/unix/path');
    assert.strictEqual(PathUtils.normalize('./relative/path'), path.resolve('./relative/path'));
  });

  test('Should join paths correctly', () => {
    const joined = PathUtils.join('base', 'folder', 'file.txt');
    assert.strictEqual(joined, path.join('base', 'folder', 'file.txt'));
  });

  test('Should resolve relative paths', () => {
    const resolved = PathUtils.resolve('./relative/path');
    assert.strictEqual(resolved, path.resolve('./relative/path'));
  });

  test('Should get file extension correctly', () => {
    assert.strictEqual(PathUtils.getExtension('file.txt'), '.txt');
    assert.strictEqual(PathUtils.getExtension('document.json'), '.json');
    assert.strictEqual(PathUtils.getExtension('noextension'), '');
    assert.strictEqual(PathUtils.getExtension('.hidden'), '');
    assert.strictEqual(PathUtils.getExtension('file.multiple.extensions'), '.extensions');
  });

  test('Should get basename correctly', () => {
    assert.strictEqual(PathUtils.getBasename('C:\\path\\file.txt'), 'file.txt');
    assert.strictEqual(PathUtils.getBasename('/unix/path/file.txt'), 'file.txt');
    assert.strictEqual(PathUtils.getBasename('file.txt'), 'file.txt');
  });

  test('Should get dirname correctly', () => {
    assert.strictEqual(PathUtils.getDirname('C:\\path\\file.txt'), 'C:\\path');
    assert.strictEqual(PathUtils.getDirname('/unix/path/file.txt'), '/unix/path');
    assert.strictEqual(PathUtils.getDirname('file.txt'), '.');
  });

  test('Should check if path is absolute', () => {
    assert.ok(PathUtils.isAbsolute('C:\\absolute\\path'));
    assert.ok(PathUtils.isAbsolute('/unix/absolute/path'));
    assert.ok(!PathUtils.isAbsolute('./relative/path'));
    assert.ok(!PathUtils.isAbsolute('relative/path'));
  });

  test('Should convert to platform-specific path separators', () => {
    const mixedPath = 'some/path\\with/mixed\\separators';
    const normalized = PathUtils.toPlatformPath(mixedPath);
    
    if (process.platform === 'win32') {
      assert.ok(normalized.includes('\\'));
      assert.ok(!normalized.includes('/'));
    } else {
      assert.ok(normalized.includes('/'));
      assert.ok(!normalized.includes('\\'));
    }
  });

  test('Should expand environment variables', () => {
    const pathWithEnvVar = PathUtils.expandEnvironmentVariables('${HOME}/templates');
    assert.ok(!pathWithEnvVar.includes('${HOME}'));
    
    const windowsPath = PathUtils.expandEnvironmentVariables('%LOCALAPPDATA%\\templates');
    if (process.platform === 'win32') {
      assert.ok(!windowsPath.includes('%LOCALAPPDATA%'));
    }
  });

  test('Should make relative path correctly', () => {
    const from = 'C:\\base\\folder';
    const to = 'C:\\base\\folder\\subfolder\\file.txt';
    const relative = PathUtils.makeRelative(from, to);
    assert.strictEqual(relative, path.relative(from, to));
  });
});