import * as assert from 'assert';
import * as vscode from 'vscode';
// Import will fail until implementation exists - this is expected for TDD
import { ConfigurationService } from '../../src/services/configService';
import { Configuration } from '../../src/models/configuration';

suite('Configuration Service Tests', () => {
  let configService: ConfigurationService;

  setup(() => {
    configService = new ConfigurationService();
  });

  test('Should get templates path from VS Code configuration', () => {
    const templatesPath = configService.getTemplatesPath();
    assert.ok(typeof templatesPath === 'string');
    assert.ok(templatesPath.length > 0);
  });

  test('Should return default templates path when not configured', () => {
    const templatesPath = configService.getTemplatesPath();
    // Should expand environment variables and provide sensible default
    assert.ok(templatesPath.includes('Templates') || templatesPath.includes('PowerToys'));
  });

  test('Should get boolean configuration values', () => {
    const hideExtensions = configService.shouldHideFileExtensions();
    const hidePrefixes = configService.shouldHideSortingPrefix();
    const replaceVars = configService.shouldReplaceVariables();

    assert.strictEqual(typeof hideExtensions, 'boolean');
    assert.strictEqual(typeof hidePrefixes, 'boolean');
    assert.strictEqual(typeof replaceVars, 'boolean');
  });

  test('Should provide reactive configuration updates', (done) => {
    const disposable = configService.onConfigurationChanged(() => {
      disposable.dispose();
      done();
    });

    // Simulate configuration change
    // In real test, this would trigger VS Code configuration change event
    setTimeout(() => {
      // Trigger change
      configService.handleConfigurationChange();
    }, 10);
  });

  test('Should expand environment variables in templates path', () => {
    const templatesPath = configService.getTemplatesPath();
    
    // Should not contain raw environment variable syntax
    assert.ok(!templatesPath.includes('%'));
    assert.ok(!templatesPath.includes('$'));
  });

  test('Should validate configuration values', () => {
    const config = configService.getCurrentConfiguration();
    
    assert.ok(config instanceof Configuration);
    assert.ok(config.templatesPath.length > 0);
    assert.ok(typeof config.hideFileExtensions === 'boolean');
    assert.ok(typeof config.hideSortingPrefix === 'boolean');
    assert.ok(typeof config.replaceVariablesInFilename === 'boolean');
  });

  test('Should handle missing configuration gracefully', () => {
    // Should provide sensible defaults when VS Code config is missing
    const config = configService.getCurrentConfiguration();
    assert.ok(config.templatesPath.length > 0);
  });

  test('Should normalize path separators for current platform', () => {
    const templatesPath = configService.getTemplatesPath();
    
    if (process.platform === 'win32') {
      // Windows should use backslashes
      assert.ok(templatesPath.includes('\\') || !templatesPath.includes('/'));
    } else {
      // Unix-like should use forward slashes
      assert.ok(!templatesPath.includes('\\') || templatesPath.includes('/'));
    }
  });

  test('Should dispose resources properly', () => {
    const disposable = configService.onConfigurationChanged(() => {});
    
    // Should be able to dispose
    assert.doesNotThrow(() => {
      disposable.dispose();
    });
  });

  test('Should handle configuration schema validation', () => {
    // Test invalid configuration values
    const config = configService.getCurrentConfiguration();
    
    // Templates path should never be empty
    assert.ok(config.templatesPath.length > 0);
    
    // Boolean values should be actual booleans
    assert.strictEqual(typeof config.hideFileExtensions, 'boolean');
    assert.strictEqual(typeof config.hideSortingPrefix, 'boolean');
    assert.strictEqual(typeof config.replaceVariablesInFilename, 'boolean');
  });
});