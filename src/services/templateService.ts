import * as vscode from 'vscode';
import * as path from 'path';
import { Template, TemplateDiscoveryOptions, TemplateValidationResult } from '../models/template';
import { ConfigService } from './configService';

/**
 * Service for discovering and managing templates
 */
export class TemplateService {
  private templates: Template[] = [];
  private recentTemplates: string[] = [];
  private fileWatcher: vscode.FileSystemWatcher | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize the template service
   */
  public async initialize(): Promise<void> {
    await this.setupFileWatcher();
    
    // Initial template discovery
    await this.discoverTemplates();
  }

  /**
   * Discover all templates in the configured directory
   */
  public async discoverTemplates(options?: TemplateDiscoveryOptions): Promise<Template[]> {
    try {
      const config = await this.configService.getConfiguration();
      const templatesPath = config.templatesPath;
      console.log(`TemplateService: Discovering templates in: ${templatesPath}`);
      
      // Check if templates directory exists
      if (!await this.directoryExists(templatesPath)) {
        console.warn(`Templates directory does not exist: ${templatesPath}`);
        return [];
      }
      
      const templateDirs = await this.findTemplateDirectories(templatesPath, options);
      console.log(`TemplateService: Found ${templateDirs.length} template directories:`, templateDirs);
      
      // Load all templates in parallel for speed
      const templatePromises = templateDirs.map(templateDir => this.loadTemplate(templateDir));
      const loadedTemplates = await Promise.all(templatePromises);
      
      const discoveredTemplates = loadedTemplates
        .filter(template => template !== null) as Template[];
      
      // Sort templates by name
      discoveredTemplates.sort((a, b) => a.name.localeCompare(b.name));
      
      this.templates = discoveredTemplates;
      return discoveredTemplates;
    } catch (error) {
      console.error('Error discovering templates:', error);
      return [];
    }
  }

  /**
   * Get all available templates
   */
  public async getTemplates(options?: TemplateDiscoveryOptions): Promise<Template[]> {
    // Simple approach - always return current templates, refresh when needed
    if (this.templates.length === 0) {
      await this.discoverTemplates(options);
    }
    
    return this.filterTemplates(this.templates, options);
  }

  /**
   * Get recently used templates
   */
  public async getRecentlyUsedTemplates(): Promise<string[]> {
    return [...this.recentTemplates];
  }

  /**
   * Add template to recently used list
   */
  public async addToRecentlyUsed(templateName: string): Promise<void> {
    const maxRecent = 10;
    
    // Remove if already exists
    const index = this.recentTemplates.indexOf(templateName);
    if (index > -1) {
      this.recentTemplates.splice(index, 1);
    }
    
    // Add to beginning
    this.recentTemplates.unshift(templateName);
    
    // Limit size
    if (this.recentTemplates.length > maxRecent) {
      this.recentTemplates = this.recentTemplates.slice(0, maxRecent);
    }
  }

  /**
   * Load template content for a specific template (lazy loading)
   */
  public async loadTemplateContent(template: Template): Promise<void> {
    if (template.files.length > 0 && template.files[0].content) {
      return; // Already loaded
    }

    try {
      const isFile = template.type === 'file';
      template.files = await this.loadTemplateFiles(template.path, isFile);
    } catch (error) {
      console.warn(`Failed to load template content for ${template.name}:`, error);
    }
  }

  /**
   * Validate template structure and content
   */
  public validateTemplate(template: any): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required properties
    if (!template.name || typeof template.name !== 'string') {
      errors.push('Template must have a valid name');
    }
    
    if (!template.type || !['file', 'folder'].includes(template.type)) {
      errors.push('Template type must be "file" or "folder"');
    }
    
    if (!template.description || typeof template.description !== 'string') {
      warnings.push('Template should have a description');
    }
    
    // Validate name format
    if (template.name && template.name.length > 100) {
      errors.push('Template name is too long (max 100 characters)');
    }
    
    if (template.name && !/^[a-zA-Z0-9\s._-]+$/.test(template.name)) {
      errors.push('Template name contains invalid characters');
    }
    
    // Check files array
    if (!Array.isArray(template.files)) {
      errors.push('Template must have a files array');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Refresh templates
   */
  public async refreshTemplates(): Promise<void> {
    await this.discoverTemplates();
  }

  /**
   * Handle templates directory changes
   */
  public async onTemplatesDirectoryChanged(): Promise<void> {
    await this.refreshTemplates();
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }
    this.templates = [];
  }

  /**
   * Setup file system watcher for templates directory
   */
  private async setupFileWatcher(): Promise<void> {
    const templatesPath = await this.configService.getTemplatesPath();
    
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    
    const globPattern = new vscode.RelativePattern(templatesPath, '**/*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(globPattern);
    
    this.fileWatcher.onDidCreate(() => this.onTemplatesDirectoryChanged());
    this.fileWatcher.onDidChange(() => this.onTemplatesDirectoryChanged());
    this.fileWatcher.onDidDelete(() => this.onTemplatesDirectoryChanged());
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
      return (stat.type & vscode.FileType.Directory) !== 0;
    } catch {
      return false;
    }
  }

  /**
   * Find template directories in the given path
   */
  private async findTemplateDirectories(basePath: string, options?: TemplateDiscoveryOptions): Promise<string[]> {
    const templateDirs: string[] = [];
    
    try {
      const baseUri = vscode.Uri.file(basePath);
      const entries = await vscode.workspace.fs.readDirectory(baseUri);
      
      for (const [name, type] of entries) {
        // Skip template.json metadata files
        if (name === 'template.json') {
          continue;
        }
        
        // Only add top-level items (files or directories)
        if (type === vscode.FileType.Directory || type === vscode.FileType.File) {
          const fullPath = path.join(basePath, name);
          templateDirs.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${basePath}:`, error);
    }
    
    return templateDirs;
  }

  /**
   * Load template metadata (without file content - lazy loaded later)
   */
  private async loadTemplate(templatePath: string): Promise<Template | null> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(templatePath));
      const isFile = (stat.type & vscode.FileType.File) !== 0;
      
      let templateName = path.basename(templatePath);
      let templateType: 'file' | 'folder' = isFile ? 'file' : 'folder';
      
      // Remove file extension for display name if it's a file
      if (isFile) {
        templateName = path.basename(templatePath, path.extname(templatePath));
      }
      
      const template: Template = {
        name: templateName,
        description: `Template: ${templateName}`,
        type: templateType,
        path: templatePath,
        files: []  // Empty - will be lazy loaded when actually used
      };
      
      return template;
    } catch (error) {
      console.warn(`Failed to load template from ${templatePath}:`, error);
      return null;
    }
  }

  /**
   * Load all files from template path (file or directory)
   */
  private async loadTemplateFiles(templatePath: string, isFile: boolean): Promise<any[]> {
    const files: any[] = [];
    
    try {
      if (isFile) {
        // Single file template
        const fileName = path.basename(templatePath);
        const fileUri = vscode.Uri.file(templatePath);
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        const content = new TextDecoder().decode(fileData);
        
        files.push({
          relativePath: fileName,
          content
        });
      } else {
        // Directory template - recursively load all files
        const dirFiles = await this.loadTemplateFilesRecursive(templatePath, '');
        files.push(...dirFiles);
      }
    } catch (error) {
      console.warn(`Failed to load template files from ${templatePath}:`, error);
    }
    
    return files;
  }

  /**
   * Recursively load template files
   */
  private async loadTemplateFilesRecursive(dirPath: string, baseRelativePath: string): Promise<any[]> {
    const files: any[] = [];
    
    try {
      const dirUri = vscode.Uri.file(dirPath);
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      
      for (const [name, type] of entries) {
        const fullPath = path.join(dirPath, name);
        const relativePath = path.join(baseRelativePath, name);
        
        if (type === vscode.FileType.File) {
          const fileUri = vscode.Uri.file(fullPath);
          const fileData = await vscode.workspace.fs.readFile(fileUri);
          const content = new TextDecoder().decode(fileData);
          files.push({
            relativePath: relativePath,
            content
          });
        } else if (type === vscode.FileType.Directory) {
          const subFiles = await this.loadTemplateFilesRecursive(fullPath, relativePath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.warn(`Failed to load files from ${dirPath}:`, error);
    }
    
    return files;
  }

  /**
   * Filter templates by options
   */
  private filterTemplates(templates: Template[], options?: TemplateDiscoveryOptions): Template[] {
    if (!options) {
      return templates;
    }
    
    let filtered = templates;
    
    if (options.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }
    
    return filtered;
  }
}
