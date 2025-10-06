import * as assert from 'assert';
import { DEFAULT_CONFIGURATION } from '../../src/models/configuration';

suite('Configuration Tests', () => {
  test('Default configuration should have expected values', () => {
    assert.strictEqual(DEFAULT_CONFIGURATION.templatesPath, '%LOCALAPPDATA%\\Microsoft\\PowerToys\\NewPlus\\Templates');
    assert.strictEqual(DEFAULT_CONFIGURATION.hideFileExtensions, true);
    assert.strictEqual(DEFAULT_CONFIGURATION.hideSortingPrefix, false);
    assert.strictEqual(DEFAULT_CONFIGURATION.replaceVariablesInFilename, false);
  });

  test('Configuration properties should be of correct types', () => {
    assert.strictEqual(typeof DEFAULT_CONFIGURATION.templatesPath, 'string');
    assert.strictEqual(typeof DEFAULT_CONFIGURATION.hideFileExtensions, 'boolean');
    assert.strictEqual(typeof DEFAULT_CONFIGURATION.hideSortingPrefix, 'boolean');
    assert.strictEqual(typeof DEFAULT_CONFIGURATION.replaceVariablesInFilename, 'boolean');
  });
});