import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { Configuration, DEFAULT_CONFIGURATION, CONFIGURATION_SCHEMA, ConfigurationValidationResult, ConfigurationExport } from '../models/configuration';

/**
 * Service for managing extension configuration
 */
export class ConfigService {
  private static readonly extensionId = 'newFromTemplate';
  private cachedConfiguration: Configuration | null = null;
  private configurationDisposable: vscode.Disposable | null = null;

  /**
   * Initialize the configuration service
   */
  public async initialize(): Promise<void> {
    // Set up configuration change listener
    this.configurationDisposable = vscode.workspace.onDidChangeConfiguration(
      this.onConfigurationChanged.bind(this)
    );
    
    // Load initial configuration
    await this.loadConfiguration();
  }

  /**
   * Load configuration from VS Code settings
   */
  public async loadConfiguration(): Promise<Configuration> {
    try {
      const config = vscode.workspace.getConfiguration(ConfigService.extensionId);
      
      // Get configuration values with defaults
      const configuration: Configuration = {
        templatesPath: this.expandEnvironmentVariables(
          config.get<string>('templatesPath') || this.getDefaultTemplatesPath()
        ),
        showQuickPick: config.get<boolean>('showQuickPick', DEFAULT_CONFIGURATION.showQuickPick),
        createSubfolders: config.get<boolean>('createSubfolders', DEFAULT_CONFIGURATION.createSubfolders),
        variables: this.mergeVariables(config),
        enableCaching: config.get<boolean>('enableCaching', DEFAULT_CONFIGURATION.enableCaching!),
        cacheTimeout: config.get<number>('cacheTimeout', DEFAULT_CONFIGURATION.cacheTimeout!),
        watchForChanges: config.get<boolean>('watchForChanges', DEFAULT_CONFIGURATION.watchForChanges!),
        excludePatterns: config.get<string[]>('excludePatterns', DEFAULT_CONFIGURATION.excludePatterns!),
        maxRecentTemplates: config.get<number>('maxRecentTemplates', DEFAULT_CONFIGURATION.maxRecentTemplates!),
        showProgress: config.get<boolean>('showProgress', DEFAULT_CONFIGURATION.showProgress!),
        defaultEncoding: config.get<string>('defaultEncoding', DEFAULT_CONFIGURATION.defaultEncoding!),
        openAfterCreation: config.get<boolean>('openAfterCreation', DEFAULT_CONFIGURATION.openAfterCreation!)
      };

      // Resolve relative paths
      configuration.templatesPath = this.resolveTemplatePath(configuration.templatesPath);
      
      // Validate configuration
      const validation = this.validateConfiguration(configuration);
      if (!validation.isValid) {
        console.warn('Invalid configuration detected:', validation.errors);
        // Fall back to defaults for invalid values
        configuration.templatesPath = this.getDefaultTemplatesPath();
      }

      this.cachedConfiguration = configuration;
      return configuration;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Get current configuration (cached if available)
   */
  public async getConfiguration(): Promise<Configuration> {
    if (this.cachedConfiguration) {
      return this.cachedConfiguration;
    }
    return this.loadConfiguration();
  }

  /**
   * Get templates path from configuration
   */
  public async getTemplatesPath(): Promise<string> {
    const config = await this.getConfiguration();
    return config.templatesPath;
  }

  /**
   * Set templates path in configuration
   */
  public async setTemplatesPath(path: string, global: boolean = false): Promise<void> {
    try {
      const target = global ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
      const config = vscode.workspace.getConfiguration(ConfigService.extensionId);
      
      await config.update('templatesPath', path, target);
      
      // Clear cache to force reload
      this.cachedConfiguration = null;
    } catch (error) {
      console.error('Failed to set templates path:', error);
      throw error;
    }
  }

  /**
   * Validate configuration object
   */
  public validateConfiguration(config: any): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required properties
    if (!config.templatesPath || typeof config.templatesPath !== 'string') {
      errors.push('templatesPath is required and must be a string');
    }
    
    if (typeof config.showQuickPick !== 'boolean') {
      errors.push('showQuickPick must be a boolean');
    }
    
    if (typeof config.createSubfolders !== 'boolean') {
      errors.push('createSubfolders must be a boolean');
    }
    
    if (!config.variables || typeof config.variables !== 'object') {
      errors.push('variables must be an object');
    }

    // Check optional properties
    if (config.cacheTimeout !== undefined && (typeof config.cacheTimeout !== 'number' || config.cacheTimeout < 0)) {
      errors.push('cacheTimeout must be a non-negative number');
    }
    
    if (config.maxRecentTemplates !== undefined && 
        (typeof config.maxRecentTemplates !== 'number' || config.maxRecentTemplates < 1 || config.maxRecentTemplates > 50)) {
      errors.push('maxRecentTemplates must be a number between 1 and 50');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration to JSON string
   */
  public async exportConfiguration(config?: Configuration): Promise<string> {
    const configToExport = config || await this.getConfiguration();
    const exportData: ConfigurationExport = {
      version: '1.0.0',
      exportedAt: new Date(),
      configuration: configToExport,
      metadata: {
        platform: process.platform,
        vscodeVersion: vscode.version
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  public async importConfiguration(jsonString: string): Promise<Configuration> {
    try {
      const exportData: ConfigurationExport = JSON.parse(jsonString);
      const config = exportData.configuration;
      
      // Validate imported configuration
      const validation = this.validateConfiguration(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      return config;
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  /**
   * Get default configuration for specified platform
   */
  public getDefaultConfiguration(platform: string = process.platform): Configuration {
    const defaultConfig = { ...DEFAULT_CONFIGURATION };
    defaultConfig.templatesPath = this.getDefaultTemplatesPath(platform);
    return defaultConfig;
  }

  /**
   * Expand environment variables in path
   */
  public expandEnvironmentVariables(path: string): string {
    if (!path) {return path;}
    
    // Windows style environment variables
    path = path.replace(/%([^%]+)%/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    // Unix style environment variables
    path = path.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    path = path.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    return path;
  }

  /**
   * Handle configuration changes
   */
  public onConfigurationChanged(event?: vscode.ConfigurationChangeEvent): void {
    if (!event || event.affectsConfiguration(ConfigService.extensionId)) {
      // Clear cache to force reload
      this.cachedConfiguration = null;
    }
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    if (this.configurationDisposable) {
      this.configurationDisposable.dispose();
      this.configurationDisposable = null;
    }
    this.cachedConfiguration = null;
  }

  /**
   * Get default templates path based on platform
   */
  private getDefaultTemplatesPath(platform: string = process.platform): string {
    switch (platform) {
      case 'win32':
        // Use PowerToys NewPlus default location on Windows
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        return path.join(localAppData, 'Microsoft', 'PowerToys', 'NewPlus', 'Templates');
      case 'darwin':
        return path.join(os.homedir(), 'Documents', 'VSCode Templates');
      default: // linux and others
        return path.join(os.homedir(), '.vscode-templates');
    }
  }

  /**
   * Resolve template path (handle relative paths)
   */
  private resolveTemplatePath(templatePath: string): string {
    if (path.isAbsolute(templatePath)) {
      return templatePath;
    }
    
    // Resolve relative to workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return path.resolve(workspaceFolder.uri.fsPath, templatePath);
    }
    
    // Fall back to home directory
    return path.resolve(os.homedir(), templatePath);
  }

  /**
   * Merge global and workspace variables
   */
  private mergeVariables(config: vscode.WorkspaceConfiguration): Record<string, string> {
    const globalVars = config.inspect<Record<string, string>>('variables')?.globalValue || {};
    const workspaceVars = config.inspect<Record<string, string>>('variables')?.workspaceValue || {};
    
    // Workspace variables override global variables
    return { ...globalVars, ...workspaceVars };
  }
}
