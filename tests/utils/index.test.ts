import * as assert from 'assert';
import * as path from 'path';
import * as utils from '../../src/utils';

suite('Validation Utils Tests', () => {
  test('Should validate template name correctly', () => {
    // Valid names
    assert.ok(utils.isValidTemplateName('MyTemplate'));
    assert.ok(utils.isValidTemplateName('template-with-dashes'));
    assert.ok(utils.isValidTemplateName('template_with_underscores'));
    assert.ok(utils.isValidTemplateName('Template123'));
    
    // Invalid names
    assert.ok(!utils.isValidTemplateName(''));
    assert.ok(!utils.isValidTemplateName('template with spaces'));
    assert.ok(!utils.isValidTemplateName('template/with/slashes'));
    assert.ok(!utils.isValidTemplateName('template\\with\\backslashes'));
    assert.ok(!utils.isValidTemplateName('template:with:colons'));
    assert.ok(!utils.isValidTemplateName('template*with*wildcards'));
    assert.ok(!utils.isValidTemplateName('template?with?questions'));
    assert.ok(!utils.isValidTemplateName('template"with"quotes'));
    assert.ok(!utils.isValidTemplateName('template<with>brackets'));
    assert.ok(!utils.isValidTemplateName('template|with|pipes'));
  });

  test('Should validate file names correctly', () => {
    // Valid file names
    assert.ok(utils.isValidFileName('document.txt'));
    assert.ok(utils.isValidFileName('my-file.json'));
    assert.ok(utils.isValidFileName('file_name.xml'));
    assert.ok(utils.isValidFileName('File123.dat'));
    
    // Invalid file names
    assert.ok(!utils.isValidFileName(''));
    assert.ok(!utils.isValidFileName('file with spaces.txt'));
    assert.ok(!utils.isValidFileName('file/with/slashes.txt'));
    assert.ok(!utils.isValidFileName('CON.txt')); // Windows reserved
    assert.ok(!utils.isValidFileName('PRN.txt')); // Windows reserved
    assert.ok(!utils.isValidFileName('file*.txt'));
    assert.ok(!utils.isValidFileName('file?.txt'));
  });

  test('Should validate folder names correctly', () => {
    // Valid folder names
    assert.ok(utils.isValidFolderName('MyFolder'));
    assert.ok(utils.isValidFolderName('folder-with-dashes'));
    assert.ok(utils.isValidFolderName('folder_with_underscores'));
    assert.ok(utils.isValidFolderName('Folder123'));
    
    // Invalid folder names
    assert.ok(!utils.isValidFolderName(''));
    assert.ok(!utils.isValidFolderName('folder with spaces'));
    assert.ok(!utils.isValidFolderName('folder/with/slashes'));
    assert.ok(!utils.isValidFolderName('CON')); // Windows reserved
    assert.ok(!utils.isValidFolderName('folder*'));
    assert.ok(!utils.isValidFolderName('folder?'));
  });

  test('Should sanitize names correctly', () => {
    assert.strictEqual(utils.sanitizeName('My Template'), 'MyTemplate');
    assert.strictEqual(utils.sanitizeName('file/with\\slashes'), 'filewithslashes');
    assert.strictEqual(utils.sanitizeName('file:with*wildcards'), 'filewithwildcards');
    assert.strictEqual(utils.sanitizeName('  spaced  '), 'spaced');
    assert.strictEqual(utils.sanitizeName('CON'), 'CON_'); // Reserved name handling
  });

  test('Should validate paths correctly', () => {
    assert.ok(utils.isValidPath('C:\\valid\\path'));
    assert.ok(utils.isValidPath('/valid/unix/path'));
    assert.ok(utils.isValidPath('./relative/path'));
    
    assert.ok(!utils.isValidPath(''));
    assert.ok(!utils.isValidPath('invalid:path*'));
    assert.ok(!utils.isValidPath('path\\with\\<invalid>\\chars'));
  });
});

suite('File Operation Utils Tests', () => {
  test('Should check if file exists', async () => {
    // Test with known file (package.json should exist)
    const packageJsonExists = await utils.fileExists(
      path.join(__dirname, '../../package.json')
    );
    assert.ok(packageJsonExists);
    
    // Test with non-existent file
    const nonExistentExists = await utils.fileExists(
      path.join(__dirname, 'non-existent-file.txt')
    );
    assert.ok(!nonExistentExists);
  });

  test('Should check if directory exists', async () => {
    // Test with known directory
    const srcExists = await utils.directoryExists(
      path.join(__dirname, '../../src')
    );
    assert.ok(srcExists);
    
    // Test with non-existent directory
    const nonExistentExists = await utils.directoryExists(
      path.join(__dirname, 'non-existent-directory')
    );
    assert.ok(!nonExistentExists);
  });

  test('Should create directory with parents', async () => {
    const testDir = path.join(__dirname, 'test-temp-dir', 'nested', 'path');
    
    try {
      await utils.ensureDirectory(testDir);
      const exists = await utils.directoryExists(testDir);
      assert.ok(exists);
    } finally {
      // Clean up - remove test directory
      try {
        await utils.removeDirectory(path.join(__dirname, 'test-temp-dir'));
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
      await utils.writeFile(sourceFile, content);
      
      // Copy file
      await utils.copyFile(sourceFile, targetFile);
      
      // Verify copy
      const targetExists = await utils.fileExists(targetFile);
      assert.ok(targetExists);
      
      const targetContent = await utils.readFile(targetFile);
      assert.strictEqual(targetContent, content);
    } finally {
      // Clean up
      try {
        await utils.deleteFile(sourceFile);
        await utils.deleteFile(targetFile);
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
      await utils.ensureDirectory(sourceDir);
      await utils.ensureDirectory(path.join(sourceDir, 'nested'));
      await utils.writeFile(path.join(sourceDir, 'file1.txt'), 'Content 1');
      await utils.writeFile(path.join(sourceDir, 'nested', 'file2.txt'), 'Content 2');
      
      // Copy directory
      await utils.copyDirectory(sourceDir, targetDir);
      
      // Verify copy
      assert.ok(await utils.directoryExists(targetDir));
      assert.ok(await utils.fileExists(path.join(targetDir, 'file1.txt')));
      assert.ok(await utils.fileExists(path.join(targetDir, 'nested', 'file2.txt')));
      
      const content1 = await utils.readFile(path.join(targetDir, 'file1.txt'));
      const content2 = await utils.readFile(path.join(targetDir, 'nested', 'file2.txt'));
      assert.strictEqual(content1, 'Content 1');
      assert.strictEqual(content2, 'Content 2');
    } finally {
      // Clean up
      try {
        await utils.removeDirectory(sourceDir);
        await utils.removeDirectory(targetDir);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('Should handle file operation errors gracefully', async () => {
    // Test reading non-existent file
    try {
      await utils.readFile('/non/existent/file.txt');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    
    // Test copying to invalid destination
    try {
      await utils.copyFile('source.txt', '/invalid/path*/file.txt');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });
});

suite('Path Utils Tests', () => {
  test('Should normalize paths correctly', () => {
    assert.strictEqual(utils.normalize('C:\\path\\with\\..\\dots'), 'C:\\path');
    assert.strictEqual(utils.normalize('/unix/path/with/../dots'), '/unix/path');
    assert.strictEqual(utils.normalize('./relative/path'), path.resolve('./relative/path'));
  });

  test('Should join paths correctly', () => {
    const joined = utils.joinPaths('base', 'folder', 'file.txt');
    assert.strictEqual(joined, path.join('base', 'folder', 'file.txt'));
  });

  test('Should resolve relative paths', () => {
    const resolved = utils.resolvePath('./relative/path');
    assert.strictEqual(resolved, path.resolve('./relative/path'));
  });

  test('Should get file extension correctly', () => {
    assert.strictEqual(utils.getExtension('file.txt'), '.txt');
    assert.strictEqual(utils.getExtension('document.json'), '.json');
    assert.strictEqual(utils.getExtension('noextension'), '');
    assert.strictEqual(utils.getExtension('.hidden'), '');
    assert.strictEqual(utils.getExtension('file.multiple.extensions'), '.extensions');
  });

  test('Should get basename correctly', () => {
    assert.strictEqual(utils.getBasename('C:\\path\\file.txt'), 'file.txt');
    assert.strictEqual(utils.getBasename('/unix/path/file.txt'), 'file.txt');
    assert.strictEqual(utils.getBasename('file.txt'), 'file.txt');
  });

  test('Should get dirname correctly', () => {
    assert.strictEqual(utils.getDirname('C:\\path\\file.txt'), 'C:\\path');
    assert.strictEqual(utils.getDirname('/unix/path/file.txt'), '/unix/path');
    assert.strictEqual(utils.getDirname('file.txt'), '.');
  });

  test('Should check if path is absolute', () => {
    assert.ok(utils.isAbsolute('C:\\absolute\\path'));
    assert.ok(utils.isAbsolute('/unix/absolute/path'));
    assert.ok(!utils.isAbsolute('./relative/path'));
    assert.ok(!utils.isAbsolute('relative/path'));
  });

  test('Should convert to platform-specific path separators', () => {
    const mixedPath = 'some/path\\with/mixed\\separators';
    const normalized = utils.toPlatformPath(mixedPath);
    
    if (process.platform === 'win32') {
      assert.ok(normalized.includes('\\'));
      assert.ok(!normalized.includes('/'));
    } else {
      assert.ok(normalized.includes('/'));
      assert.ok(!normalized.includes('\\'));
    }
  });

  test('Should expand environment variables', () => {
    const pathWithEnvVar = utils.expandEnvironmentVariables('${HOME}/templates');
    assert.ok(!pathWithEnvVar.includes('${HOME}'));
    
    const windowsPath = utils.expandEnvironmentVariables('%LOCALAPPDATA%\\templates');
    if (process.platform === 'win32') {
      assert.ok(!windowsPath.includes('%LOCALAPPDATA%'));
    }
  });

  test('Should make relative path correctly', () => {
    const from = 'C:\\base\\folder';
    const to = 'C:\\base\\folder\\subfolder\\file.txt';
    const relative = utils.makeRelative(from, to);
    assert.strictEqual(relative, path.relative(from, to));
  });
});