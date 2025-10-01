import * as assert from 'assert';
// Import will fail until implementation exists - this is expected for TDD
import { Configuration } from '../../src/models/configuration';

suite('Configuration Entity Tests', () => {
  test('Configuration should have default values', () => {
    const config = new Configuration();
    
    assert.strictEqual(config.templatesPath, '%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates');
    assert.strictEqual(config.hideFileExtensions, true);
    assert.strictEqual(config.hideSortingPrefix, false);
    assert.strictEqual(config.replaceVariablesInFilename, false);
  });

  test('Configuration should accept custom values', () => {
    const config = new Configuration(
      'C:\\Custom\\Templates',
      false,
      true, 
      true
    );

    assert.strictEqual(config.templatesPath, 'C:\\Custom\\Templates');
    assert.strictEqual(config.hideFileExtensions, false);
    assert.strictEqual(config.hideSortingPrefix, true);
    assert.strictEqual(config.replaceVariablesInFilename, true);
  });

  test('Configuration should validate templates path is not empty', () => {
    assert.throws(() => {
      new Configuration('', true, false, false);
    });
  });

  test('Configuration should normalize paths', () => {
    const config = new Configuration('C:\\Templates\\\\SubFolder\\');
    // Should normalize double slashes and trailing slashes
    assert.ok(!config.templatesPath.includes('\\\\'));
    assert.ok(!config.templatesPath.endsWith('\\'));
  });

  test('Configuration should handle environment variables in path', () => {
    const config = new Configuration('%USERPROFILE%\\Templates');
    // Should expand environment variables (implementation detail)
    assert.ok(config.templatesPath.length > 0);
  });

  test('Configuration boolean values should be strictly typed', () => {
    const config = new Configuration();
    assert.strictEqual(typeof config.hideFileExtensions, 'boolean');
    assert.strictEqual(typeof config.hideSortingPrefix, 'boolean'); 
    assert.strictEqual(typeof config.replaceVariablesInFilename, 'boolean');
  });
});