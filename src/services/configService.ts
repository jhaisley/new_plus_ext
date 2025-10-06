import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { Configuration, DEFAULT_CONFIGURATION } from '../models/configuration';
import { expandEnvironmentVariables } from '../utils/index';

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
        templatesPath: expandEnvironmentVariables(
          config.get<string>('templatesPath') || this.getDefaultTemplatesPath()
        ),
        hideFileExtensions: config.get<boolean>('display.hideFileExtensions', DEFAULT_CONFIGURATION.hideFileExtensions),
        hideSortingPrefix: config.get<boolean>('display.hideSortingPrefix', DEFAULT_CONFIGURATION.hideSortingPrefix),
        replaceVariablesInFilename: config.get<boolean>('behavior.replaceVariablesInFilename', DEFAULT_CONFIGURATION.replaceVariablesInFilename)
      };

      // Resolve relative paths
      configuration.templatesPath = this.resolveTemplatePath(configuration.templatesPath);

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
   * Get default configuration for specified platform
   */
  public getDefaultConfiguration(platform: string = process.platform): Configuration {
    const defaultConfig = { ...DEFAULT_CONFIGURATION };
    defaultConfig.templatesPath = this.getDefaultTemplatesPath(platform);
    return defaultConfig;
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
}
