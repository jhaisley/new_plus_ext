import * as vscode from 'vscode';
import * as path from 'path';
import { Template, TemplateDiscoveryOptions, TemplateValidationResult } from '../models/template';
import { ConfigService } from './configService';

/**
 * Service for discovering and managing templates
 */
export class TemplateService {
  private static readonly cacheValidityMs = 5 * 60 * 1000; // 5 minutes
  private static readonly maxCacheSize = 100; // Maximum number of cached template sets
  private static readonly lazyLoadThreshold = 50; // Load templates lazily if more than this number
  private templates: Template[] = [];
  private templatesCache: Map<string, Template[]> = new Map();
  private recentTemplates: string[] = [];
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private lastDiscoveryTime: number = 0;
  private isLazyLoadingEnabled = true;
  private templateContentCache: Map<string, string> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Initialize the template service
   */
  public async initialize(): Promise<void> {
    const config = await this.configService.getConfiguration();
    
    if (config.watchForChanges) {
      await this.setupFileWatcher();
    }
    
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
      
      // Check cache validity
      const cacheKey = this.createCacheKey(templatesPath, options);
      if (config.enableCaching && this.isCacheValid(cacheKey)) {
        console.log('TemplateService: Using cached templates');
        return this.templatesCache.get(cacheKey) || [];
      }
      
      // Check if templates directory exists
      console.log('TemplateService: Checking if directory exists...');
      if (!await this.directoryExists(templatesPath)) {
        console.warn(`Templates directory does not exist: ${templatesPath}`);
        return [];
      }
      console.log('TemplateService: Directory exists, finding template directories...');
      
      const discoveredTemplates: Template[] = [];
      const templateDirs = await this.findTemplateDirectories(templatesPath, options);
      console.log(`TemplateService: Found ${templateDirs.length} template directories:`, templateDirs);
      
      for (const templateDir of templateDirs) {
        try {
          console.log(`TemplateService: Loading template from: ${templateDir}`);
          const template = await this.loadTemplate(templateDir);
          if (template) {
            discoveredTemplates.push(template);
            console.log(`TemplateService: Successfully loaded template: ${template.name}`);
          } else {
            console.warn(`TemplateService: Failed to load template from: ${templateDir}`);
          }
        } catch (error) {
          console.warn(`Failed to load template from ${templateDir}:`, error);
        }
      }
      
      // Sort templates by name
      discoveredTemplates.sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache the results
      if (config.enableCaching) {
        this.templatesCache.set(cacheKey, discoveredTemplates);
        this.lastDiscoveryTime = Date.now();
        this.cleanupCache(); // Prevent memory leaks
      }
      
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
    console.log('TemplateService: getTemplates called');
    const config = await this.configService.getConfiguration();
    const templatesPath = config.templatesPath;
    const cacheKey = this.createCacheKey(templatesPath, options);
    
    // Use cache if valid
    if (config.enableCaching && this.templates.length > 0 && this.isCacheValid(cacheKey)) {
      console.log('TemplateService: Returning cached templates');
      return this.filterTemplates(this.templates, options);
    }
    
    // Discover templates
    console.log('TemplateService: Calling discoverTemplates...');
    const templates = await this.discoverTemplates(options);
    return this.filterTemplates(templates, options);
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
    const config = await this.configService.getConfiguration();
    const maxRecent = config.maxRecentTemplates || 10;
    
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
    
    // Check files array - for NewPlus style, files can be empty (folder templates)
    if (!Array.isArray(template.files)) {
      errors.push('Template must have a files array');
    }
    // Note: Empty files array is OK for NewPlus - it just means copy the directory structure
    
    // Check variables array
    if (template.variables && !Array.isArray(template.variables)) {
      errors.push('Template variables must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean up old cache entries to prevent memory leaks
   */
  private cleanupCache(): void {
    if (this.templatesCache.size > TemplateService.maxCacheSize) {
      // Remove oldest entries (simple FIFO cleanup)
      const entriesToRemove = this.templatesCache.size - TemplateService.maxCacheSize;
      const keys = Array.from(this.templatesCache.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        this.templatesCache.delete(keys[i]);
      }
    }
    
    // Clean template content cache as well
    if (this.templateContentCache.size > TemplateService.maxCacheSize) {
      const entriesToRemove = this.templateContentCache.size - TemplateService.maxCacheSize;
      const keys = Array.from(this.templateContentCache.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        this.templateContentCache.delete(keys[i]);
      }
    }
  }

  /**
   * Refresh templates cache
   */
  public async refreshTemplates(): Promise<void> {
    this.templatesCache.clear();
    this.templateContentCache.clear();
    this.lastDiscoveryTime = 0;
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
    this.templatesCache.clear();
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
      console.log(`TemplateService: Checking if directory exists: ${dirPath}`);
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
      const exists = (stat.type & vscode.FileType.Directory) !== 0;
      console.log(`TemplateService: Directory exists: ${exists}`);
      return exists;
    } catch (error) {
      console.log(`TemplateService: Directory check failed:`, error);
      return false;
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheKey?: string): boolean {
    if (cacheKey && !this.templatesCache.has(cacheKey)) {
      return false;
    }
    
    return Date.now() - this.lastDiscoveryTime < TemplateService.cacheValidityMs;
  }

  /**
   * Create cache key for discovery options
   */
  private createCacheKey(templatesPath: string, options?: TemplateDiscoveryOptions): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${templatesPath}|${optionsStr}`;
  }

  /**
   * Find template directories in the given path
   */
  private async findTemplateDirectories(basePath: string, options?: TemplateDiscoveryOptions): Promise<string[]> {
    const templateDirs: string[] = [];
    
    try {
      console.log(`TemplateService: Reading directory: ${basePath}`);
      const baseUri = vscode.Uri.file(basePath);
      const entries = await vscode.workspace.fs.readDirectory(baseUri);
      console.log(`TemplateService: Found ${entries.length} entries in directory`);
      
      for (const [name, type] of entries) {
        // Skip template.json metadata files
        if (name === 'template.json') {
          continue;
        }
        
        console.log(`TemplateService: Checking entry: ${name}, type: ${type}`);
        
        // Only add top-level items (files or directories)
        if (type === vscode.FileType.Directory || type === vscode.FileType.File) {
          const fullPath = path.join(basePath, name);
          console.log(`TemplateService: Found template: ${fullPath}`);
          templateDirs.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${basePath}:`, error);
    }
    
    return templateDirs;
  }

  /**
   * Load template from directory
   */
  private async loadTemplate(templatePath: string): Promise<Template | null> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(templatePath));
      const isFile = (stat.type & vscode.FileType.File) !== 0;
      const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;
      
      let templateName = path.basename(templatePath);
      let templateType: 'file' | 'folder' = isFile ? 'file' : 'folder';
      
      // Remove file extension for display name if it's a file
      if (isFile) {
        templateName = path.basename(templatePath, path.extname(templatePath));
      }
      
      console.log(`TemplateService: Loading files for template: ${templateName}`);
      const files = await this.loadTemplateFiles(templatePath, isFile);
      console.log(`TemplateService: Loaded ${files.length} files for template: ${templateName}`);
      
      const template: Template = {
        name: templateName,
        description: `Template: ${templateName}`,
        type: templateType,
        path: templatePath,
        files,
        variables: [],
        category: 'General',
        tags: [],
        version: '1.0.0',
        createdAt: new Date(),
        modifiedAt: new Date()
      };
      
      console.log(`TemplateService: Template loaded successfully: ${templateName}`);
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
   * Load template content lazily when needed
   */
  private filterTemplates(templates: Template[], options?: TemplateDiscoveryOptions): Template[] {
    if (!options) {return templates;}
    
    let filtered = templates;
    
    if (options.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }
    
    if (options.category) {
      filtered = filtered.filter(t => t.category === options.category);
    }
    
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(t => 
        t.tags && options.tags!.some(tag => t.tags!.includes(tag))
      );
    }
    
    return filtered;
  }

  /**
   * Load template content lazily when needed
   */
  private async loadTemplateContentLazily(template: Template): Promise<void> {
    if (template.files.length === 0 || template.files[0].content) {
      return; // Already loaded or no files
    }
    
    const cacheKey = `${template.path}_content`;
    if (this.templateContentCache.has(cacheKey)) {
      template.files[0].content = this.templateContentCache.get(cacheKey)!;
      return;
    }
    
    try {
      // Load the first file's content for preview purposes
      const firstFile = template.files[0];
      const fullPath = path.join(template.path, firstFile.relativePath);
      const fileUri = vscode.Uri.file(fullPath);
      const fileData = await vscode.workspace.fs.readFile(fileUri);
      const content = new TextDecoder().decode(fileData);
      
      firstFile.content = content;
      this.templateContentCache.set(cacheKey, content);
    } catch (error) {
      console.warn(`Failed to load template content for ${template.name}:`, error);
      template.files[0].content = ''; // Fallback to empty content
    }
  }
}
