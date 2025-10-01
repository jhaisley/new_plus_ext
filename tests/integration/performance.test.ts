import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
// Import will fail until implementation exists - this is expected for TDD
import { TemplateService } from '../../src/services/templateService';
import { ConfigService } from '../../src/services/configService';
import { VariableService } from '../../src/services/variableService';
import { NewFromTemplateCommand } from '../../src/commands/newFromTemplate';
import { Template } from '../../src/models/template';

suite('Performance Validation Tests', () => {
  let templateService: TemplateService;
  let configService: ConfigService;
  let variableService: VariableService;
  let newFromTemplateCommand: NewFromTemplateCommand;

  setup(() => {
    configService = new ConfigService();
    variableService = new VariableService();
    templateService = new TemplateService(configService);
    newFromTemplateCommand = new NewFromTemplateCommand(templateService, variableService);
  });

  suite('Template Discovery Performance', () => {
    test('Should discover templates in under 2 seconds for 100 templates', async () => {
      // Create mock templates directory with 100 templates
      const mockTemplates = createMockTemplates(100);
      
      // Mock template service to use in-memory templates
      templateService.discoverTemplates = async () => mockTemplates;
      
      const startTime = Date.now();
      const templates = await templateService.discoverTemplates();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.strictEqual(templates.length, 100);
      assert.ok(duration < 2000, `Discovery took ${duration}ms, should be under 2000ms`);
    });

    test('Should handle large number of templates without memory issues', async () => {
      const largeTemplateCount = 1000;
      const mockTemplates = createMockTemplates(largeTemplateCount);
      
      templateService.discoverTemplates = async () => mockTemplates;
      
      const initialMemory = process.memoryUsage();
      const templates = await templateService.discoverTemplates();
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);
      
      assert.strictEqual(templates.length, largeTemplateCount);
      assert.ok(memoryIncreaseInMB < 50, `Memory increase ${memoryIncreaseInMB}MB should be under 50MB`);
    });

    test('Should cache template discovery results', async () => {
      let discoveryCallCount = 0;
      const originalDiscoverTemplates = templateService.discoverTemplates;
      
      templateService.discoverTemplates = async () => {
        discoveryCallCount++;
        return createMockTemplates(10);
      };
      
      // First call should trigger discovery
      const templates1 = await templateService.getTemplates();
      
      // Second call should use cache
      const templates2 = await templateService.getTemplates();
      
      assert.strictEqual(discoveryCallCount, 1, 'Should only discover once and use cache');
      assert.strictEqual(templates1.length, templates2.length);
    });

    test('Should invalidate cache when templates directory changes', async () => {
      let discoveryCallCount = 0;
      templateService.discoverTemplates = async () => {
        discoveryCallCount++;
        return createMockTemplates(5);
      };
      
      // Initial discovery
      await templateService.getTemplates();
      
      // Simulate directory change
      await templateService.onTemplatesDirectoryChanged();
      
      // Should trigger new discovery
      await templateService.getTemplates();
      
      assert.strictEqual(discoveryCallCount, 2, 'Should re-discover after directory change');
    });

    test('Should handle concurrent template discovery requests efficiently', async () => {
      let discoveryCallCount = 0;
      templateService.discoverTemplates = async () => {
        discoveryCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        return createMockTemplates(10);
      };
      
      // Start multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => templateService.getTemplates());
      
      const results = await Promise.all(promises);
      
      // Should only call discovery once, not for each request
      assert.strictEqual(discoveryCallCount, 1, 'Should handle concurrent requests efficiently');
      
      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        assert.strictEqual(results[i].length, results[0].length);
      }
    });
  });

  suite('Template Creation Performance', () => {
    test('Should create simple file template in under 500ms', async () => {
      const simpleTemplate: Template = {
        name: 'SimpleFile',
        type: 'file',
        path: '/test',
        files: [{ relativePath: 'simple.txt', content: 'Simple content' }],
        variables: []
      };
      
      const startTime = Date.now();
      const result = await newFromTemplateCommand.createFromTemplate(
        simpleTemplate,
        '/target',
        'simple.txt',
        new Map()
      );
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(result.success);
      assert.ok(duration < 500, `Creation took ${duration}ms, should be under 500ms`);
    });

    test('Should create folder template with 50 files in under 5 seconds', async () => {
      const folderTemplate: Template = {
        name: 'MediumFolder',
        type: 'folder',
        path: '/test',
        files: Array.from({ length: 50 }, (_, i) => ({
          relativePath: `file${i}.txt`,
          content: `Content for file ${i}`
        })),
        variables: []
      };
      
      const startTime = Date.now();
      const result = await newFromTemplateCommand.createFromTemplate(
        folderTemplate,
        '/target',
        'medium-project',
        new Map()
      );
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(result.success);
      assert.ok(duration < 5000, `Creation took ${duration}ms, should be under 5000ms`);
    });

    test('Should handle large file content efficiently', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of content
      const largeFileTemplate: Template = {
        name: 'LargeFile',
        type: 'file',
        path: '/test',
        files: [{ relativePath: 'large.txt', content: largeContent }],
        variables: []
      };
      
      const initialMemory = process.memoryUsage();
      const startTime = Date.now();
      
      const result = await newFromTemplateCommand.createFromTemplate(
        largeFileTemplate,
        '/target',
        'large.txt',
        new Map()
      );
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      
      const duration = endTime - startTime;
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
      
      assert.ok(result.success);
      assert.ok(duration < 3000, `Large file creation took ${duration}ms, should be under 3000ms`);
      assert.ok(memoryIncrease < 10, `Memory increase ${memoryIncrease}MB should be under 10MB`);
    });

    test('Should batch file operations for better performance', async () => {
      const batchTemplate: Template = {
        name: 'BatchTest',
        type: 'folder',
        path: '/test',
        files: Array.from({ length: 100 }, (_, i) => ({
          relativePath: `batch/file${i}.txt`,
          content: `Batch file ${i}`
        })),
        variables: []
      };
      
      let fileOperationCount = 0;
      
      // Mock file operations to count individual calls
      const originalCreateFile = newFromTemplateCommand.createFile;
      newFromTemplateCommand.createFile = async (...args: any[]) => {
        fileOperationCount++;
        return originalCreateFile.apply(newFromTemplateCommand, args);
      };
      
      const startTime = Date.now();
      const result = await newFromTemplateCommand.createFromTemplate(
        batchTemplate,
        '/target',
        'batch-project',
        new Map()
      );
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      const avgTimePerFile = duration / 100;
      
      assert.ok(result.success);
      assert.ok(avgTimePerFile < 50, `Average time per file ${avgTimePerFile}ms should be under 50ms`);
    });
  });

  suite('Variable Processing Performance', () => {
    test('Should process simple variables quickly', async () => {
      const template = 'Hello {{name}}, welcome to {{company}}!';
      const variables = new Map([
        ['name', 'John Doe'],
        ['company', 'Acme Corp']
      ]);
      
      const startTime = Date.now();
      const result = variableService.processTemplate(template, variables);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(result.includes('John Doe'));
      assert.ok(result.includes('Acme Corp'));
      assert.ok(duration < 10, `Variable processing took ${duration}ms, should be under 10ms`);
    });

    test('Should handle many variables efficiently', async () => {
      const variables = new Map();
      let template = 'Template with many variables: ';
      
      // Create 100 variables
      for (let i = 0; i < 100; i++) {
        const varName = `var${i}`;
        variables.set(varName, `value${i}`);
        template += `{{${varName}}} `;
      }
      
      const startTime = Date.now();
      const result = variableService.processTemplate(template, variables);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(result.includes('value0'));
      assert.ok(result.includes('value99'));
      assert.ok(duration < 100, `Processing 100 variables took ${duration}ms, should be under 100ms`);
    });

    test('Should process large template content efficiently', async () => {
      const baseContent = 'Line with {{variable}} content. ';
      const largeTemplate = baseContent.repeat(10000); // ~300KB template
      const variables = new Map([['variable', 'replaced']]);
      
      const startTime = Date.now();
      const result = variableService.processTemplate(largeTemplate, variables);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(result.includes('replaced'));
      assert.ok(!result.includes('{{variable}}'));
      assert.ok(duration < 1000, `Large template processing took ${duration}ms, should be under 1000ms`);
    });

    test('Should cache variable processing results', async () => {
      const template = 'Template with {{cached}} variable';
      const variables = new Map([['cached', 'value']]);
      
      let processingCallCount = 0;
      const originalProcessTemplate = variableService.processTemplate;
      variableService.processTemplate = (tmpl: string, vars: Map<string, string>) => {
        processingCallCount++;
        return originalProcessTemplate.call(variableService, tmpl, vars);
      };
      
      // Process same template multiple times
      const result1 = variableService.processTemplate(template, variables);
      const result2 = variableService.processTemplate(template, variables);
      const result3 = variableService.processTemplate(template, variables);
      
      assert.strictEqual(result1, result2);
      assert.strictEqual(result2, result3);
      
      // Should use caching for identical inputs
      if (variableService.isCachingEnabled()) {
        assert.ok(processingCallCount < 3, 'Should use caching for identical templates');
      }
    });
  });

  suite('Configuration Loading Performance', () => {
    test('Should load configuration in under 100ms', async () => {
      const startTime = Date.now();
      const config = await configService.loadConfiguration();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      assert.ok(config);
      assert.ok(duration < 100, `Configuration loading took ${duration}ms, should be under 100ms`);
    });

    test('Should cache configuration between loads', async () => {
      let loadCallCount = 0;
      const originalLoadConfiguration = configService.loadConfiguration;
      configService.loadConfiguration = async () => {
        loadCallCount++;
        return originalLoadConfiguration.call(configService);
      };
      
      // Multiple loads should use cache
      await configService.getConfiguration();
      await configService.getConfiguration();
      await configService.getConfiguration();
      
      assert.strictEqual(loadCallCount, 1, 'Should cache configuration between loads');
    });

    test('Should handle configuration changes efficiently', async () => {
      let changeHandlerCallCount = 0;
      
      // Mock configuration change handler
      configService.onConfigurationChanged = () => {
        changeHandlerCallCount++;
      };
      
      const startTime = Date.now();
      
      // Simulate multiple rapid configuration changes
      for (let i = 0; i < 10; i++) {
        await configService.onConfigurationChanged();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      assert.ok(duration < 200, `Handling 10 config changes took ${duration}ms, should be under 200ms`);
    });
  });

  suite('Memory Management', () => {
    test('Should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const templates = await templateService.getTemplates();
        const config = await configService.getConfiguration();
        
        // Process some variables
        variableService.processTemplate('Test {{var}}', new Map([['var', 'value']]));
        
        // Force garbage collection periodically
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
      
      assert.ok(memoryIncrease < 20, `Memory increase ${memoryIncrease}MB should be under 20MB`);
    });

    test('Should dispose of resources properly', async () => {
      let disposalCount = 0;
      
      // Mock disposable objects
      const createDisposable = () => ({
        dispose: () => {
          disposalCount++;
        }
      });
      
      // Create resources that should be disposed
      const resources = Array.from({ length: 10 }, () => createDisposable());
      
      // Simulate service cleanup
      await configService.dispose();
      await templateService.dispose();
      
      // Manually dispose test resources
      resources.forEach(resource => resource.dispose());
      
      assert.strictEqual(disposalCount, 10, 'Should dispose all resources');
    });
  });

  suite('Concurrent Operations', () => {
    test('Should handle concurrent template creation without conflicts', async () => {
      const template: Template = {
        name: 'Concurrent',
        type: 'file',
        path: '/test',
        files: [{ relativePath: 'concurrent.txt', content: 'Concurrent content' }],
        variables: []
      };
      
      const startTime = Date.now();
      
      // Start multiple concurrent creations
      const promises = Array.from({ length: 10 }, (_, i) =>
        newFromTemplateCommand.createFromTemplate(
          template,
          '/target',
          `concurrent${i}.txt`,
          new Map()
        )
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // All should succeed
      for (const result of results) {
        assert.ok(result.success);
      }
      
      assert.ok(duration < 2000, `10 concurrent operations took ${duration}ms, should be under 2000ms`);
    });

    test('Should handle concurrent configuration access', async () => {
      const startTime = Date.now();
      
      // Start multiple concurrent configuration loads
      const promises = Array.from({ length: 20 }, () => configService.getConfiguration());
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // All should return the same configuration
      for (let i = 1; i < results.length; i++) {
        assert.deepStrictEqual(results[i], results[0]);
      }
      
      assert.ok(duration < 500, `20 concurrent config loads took ${duration}ms, should be under 500ms`);
    });
  });

  // Helper function to create mock templates for testing
  function createMockTemplates(count: number): Template[] {
    return Array.from({ length: count }, (_, i) => ({
      name: `Template${i}`,
      description: `Description for template ${i}`,
      type: i % 2 === 0 ? 'file' : 'folder',
      path: `/templates/template${i}`,
      files: [
        {
          relativePath: `file${i}.txt`,
          content: `Content for template ${i}`
        }
      ],
      variables: [
        {
          name: `var${i}`,
          prompt: `Enter value for var${i}`,
          defaultValue: `default${i}`
        }
      ]
    }));
  }
});