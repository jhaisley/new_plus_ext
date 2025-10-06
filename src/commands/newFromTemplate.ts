import * as vscode from 'vscode';
import * as path from 'path';
import { Template, TemplateCreationResult } from '../models/template';
import { TemplateService } from '../services/templateService';
import { VariableService } from '../services/variableService';
import { WorkspaceIntegration } from '../utils/workspaceIntegration';
import { ContextMenuIntegration } from '../utils/contextMenuIntegration';
import { ConfigService } from '../services/configService';

/**
 * Command for creating files/folders from templates
 */
export class NewFromTemplateCommand {
  constructor(
    private templateService: TemplateService,
    private variableService: VariableService,
    private workspaceIntegration?: WorkspaceIntegration,
    private configService?: ConfigService
  ) {}

  /**
   * Analyze context from URI to determine user intent
   */
  private async analyzeContext(uri?: vscode.Uri): Promise<{
    type?: string;
    targetPath?: string;
    isFile?: boolean;
    isFolder?: boolean;
    workspaceFolder?: vscode.WorkspaceFolder;
    projectType?: string;
  }> {
    const context: any = {};
    
    if (uri) {
      context.targetPath = uri.fsPath;
      
      // Use workspace integration for enhanced context analysis
      if (this.workspaceIntegration) {
        const workspaceFolder = WorkspaceIntegration.getActiveWorkspaceFolder();
        if (workspaceFolder) {
          context.workspaceFolder = workspaceFolder;
          
          // Get project type hints
          const projectHints = await WorkspaceIntegration.getProjectTypeHints();
          if (projectHints.length > 0) {
            context.projectType = projectHints[0];
          }
        }
        
        // Get target directory from workspace integration
        const targetDir = await WorkspaceIntegration.getTargetDirectory(uri);
        if (targetDir) {
          context.targetPath = targetDir;
        }
      }
      
      // Check if URI points to a file or folder - FIX: await the stat call
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        context.isFile = (stat.type & vscode.FileType.File) !== 0;
        context.isFolder = (stat.type & vscode.FileType.Directory) !== 0;
        
        // Set context type for template filtering
        if (context.isFolder) {
          context.type = 'folder';
        } else if (context.isFile) {
          // If it's a file, user probably wants to create in the same directory
          context.targetPath = path.dirname(uri.fsPath);
          context.type = 'file';
        }
      } catch {
        // Assume it's a folder if we can't determine
        context.type = 'folder';
      }
      
      // Find workspace folder
      context.workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    }
    
    return context;
  }

  /**
   * Execute the main command
   */
  public async execute(uri?: vscode.Uri): Promise<TemplateCreationResult | undefined> {
    try {
      // Get available templates
      console.log('NewPlus: Fetching templates...');
      const templates = await this.templateService.getTemplates();
      console.log(`NewPlus: Found ${templates.length} templates`);
      
      if (templates.length === 0) {
        // Get the actual path being used for better error message
        let templatesPath = 'templates directory';
        if (this.configService) {
          try {
            const config = await this.configService.getConfiguration();
            templatesPath = config.templatesPath;
            console.log(`NewPlus: Templates path: ${templatesPath}`);
          } catch (configError) {
            console.error('NewPlus: Failed to get config:', configError);
          }
        }
        
        const errorMessage = `No templates found in: ${templatesPath}`;
        console.error('NewPlus:', errorMessage);
        
        // Show detailed error message directly
        const actions = ['Open Templates Folder', 'Open Settings'];
        const selectedAction = await vscode.window.showErrorMessage(
          errorMessage,
          ...actions
        );
        
        if (selectedAction === 'Open Templates Folder') {
          await vscode.commands.executeCommand('newFromTemplate.openTemplatesFolder');
        } else if (selectedAction === 'Open Settings') {
          await vscode.commands.executeCommand('workbench.action.openSettings', 'newFromTemplate');
        }
        
        return { success: false, error: errorMessage };
      }

      // Determine context from URI
      const context = await this.analyzeContext(uri);
      
      // Show template selection with context filtering
      const selectedTemplate = await this.showTemplateSelection(context.type, uri);
      if (!selectedTemplate) {
        return undefined; // User cancelled
      }

      // Use context location if available
      const targetLocation = context.targetPath || this.determineTargetLocation(uri);

      // Collect variable values with context-aware defaults
      const variables = await this.collectVariableValues(selectedTemplate, context);
      if (!variables) {
        return undefined; // User cancelled
      }

      // Load template content now (lazy loading)
      await this.templateService.loadTemplateContent(selectedTemplate);

      // Prompt for name with context-aware suggestions
      const name = await this.promptForNameWithContext(selectedTemplate, context);
      if (!name) {
        return undefined; // User cancelled
      }

      // Validate inputs before creation
      if (!targetLocation) {
        const message = 'Unable to determine where to create the template';
        console.error('NewPlus:', message);
        vscode.window.showErrorMessage(message);
        return undefined;
      }

      // Create from template with progress indication
      const result = await this.createFromTemplateWithProgress(selectedTemplate, targetLocation, name, variables);

      // Show result and handle post-creation actions
      if (result.success) {
        await this.templateService.addToRecentlyUsed(selectedTemplate.name);
        await this.handleSuccessfulCreation(result, selectedTemplate);
      } else {
        const message = `Failed to create ${selectedTemplate.type}: ${result.error || 'Unknown error'}`;
        console.error('NewPlus:', message);
        vscode.window.showErrorMessage(message);
        return undefined;
      }

      return result;
    } catch (error) {
      console.error('NewPlus: Error in execute:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Show template selection quick pick with context-aware filtering
   */
  public async showTemplateSelection(contextType?: string, uri?: vscode.Uri): Promise<Template | undefined> {
    const allTemplates = await this.templateService.getTemplates();
    const recentTemplates = await this.templateService.getRecentlyUsedTemplates();

    // Use context-aware filtering if URI is provided
    let templates = allTemplates;
    let suggested: Template[] = [];
    let other: Template[] = [];
    
    if (uri) {
      const contextResult = await ContextMenuIntegration.getContextualTemplates(uri, allTemplates);
      suggested = contextResult.suggested;
      other = contextResult.other;
      templates = [...suggested, ...other];
    } else if (contextType) {
      // Fallback to basic type filtering
      if (contextType === 'file') {
        templates = allTemplates.filter(t => t.type === 'file');
      } else if (contextType === 'folder') {
        templates = allTemplates.filter(t => t.type === 'folder');
      }
    }

    // Create quick pick items
    const items: (vscode.QuickPickItem & { template: Template })[] = [];

    // Add suggested templates first if any
    if (suggested.length > 0) {
      items.push({
        label: 'Suggested for this context',
        kind: vscode.QuickPickItemKind.Separator
      } as any);

      for (const template of suggested) {
        const isRecent = recentTemplates.includes(template.name);
        items.push({
          label: `${isRecent ? '$(clock) ' : '$(star) '}${template.name}`,
          description: template.description,
          detail: `${template.type} template${isRecent ? ' • Recently used' : ' • Recommended'}`,
          template
        });
      }
    }

    // Add context hint if filtering
    if (contextType && !uri) {
      items.push({
        label: `Templates for ${contextType === 'file' ? 'files' : 'folders'}`,
        kind: vscode.QuickPickItemKind.Separator
      } as any);
    }

    // Add recent templates (excluding already shown suggested ones)
    const nonSuggestedRecent = recentTemplates
      .map(name => templates.find(t => t.name === name))
      .filter(t => t !== undefined && !suggested.includes(t)) as Template[];
      
    if (nonSuggestedRecent.length > 0) {
      items.push({
        label: 'Recently Used',
        kind: vscode.QuickPickItemKind.Separator
      } as any);

      for (const template of nonSuggestedRecent) {
        items.push({
          label: `$(clock) ${template.name}`,
          description: template.description,
          detail: `${template.type} template`,
          template
        });
      }
    }

    // Group remaining templates by type (excluding suggested and recent)
    const excludeSet = new Set([...suggested, ...nonSuggestedRecent]);
    const remainingTemplates = templates.filter(t => !excludeSet.has(t));
    const fileTemplates = remainingTemplates.filter(t => t.type === 'file');
    const folderTemplates = remainingTemplates.filter(t => t.type === 'folder');

    if (fileTemplates.length > 0 && (!contextType || contextType === 'file')) {
      items.push({
        label: 'File Templates',
        kind: vscode.QuickPickItemKind.Separator
      } as any);

      for (const template of fileTemplates) {
        items.push({
          label: `$(file) ${template.name}`,
          description: template.description,
          detail: 'File template',
          template
        });
      }
    }

    if (folderTemplates.length > 0 && (!contextType || contextType === 'folder')) {
      items.push({
        label: 'Folder Templates',
        kind: vscode.QuickPickItemKind.Separator
      } as any);

      for (const template of folderTemplates) {
        items.push({
          label: `$(folder) ${template.name}`,
          description: template.description,
          detail: 'Folder template',
          template
        });
      }
    }

    // Show "Browse All" option if context filtering is active
    if ((contextType || uri) && allTemplates.length > templates.length) {
      items.push({
        label: 'Browse All Templates',
        kind: vscode.QuickPickItemKind.Separator
      } as any);
      
      items.push({
        label: '$(search) Show all templates',
        description: 'Browse templates of all types',
        detail: 'Remove context filter',
        template: null as any
      });
    }

    const selected = await vscode.window.showQuickPick(items.filter(item => 'template' in item), {
      placeHolder: contextType ? 
        `Select a ${contextType} template to use` : 
        'Select a template to use',
      matchOnDescription: true,
      matchOnDetail: true
    });

    // Handle "Browse All" selection
    if (selected && !selected.template) {
      return this.showTemplateSelection(); // Remove context filter
    }

    return selected?.template;
  }

  /**
   * Collect variable values from user
   */
  public async collectVariableValues(template: Template, context?: any): Promise<Map<string, string> | undefined> {
    const variables = new Map<string, string>();

    // Add built-in variables
    const builtInVars = this.variableService.createBuiltInVariables();
    for (const [key, value] of builtInVars) {
      variables.set(key, value);
    }
    
    // Add context-specific variables
    if (context?.workspaceFolder) {
      variables.set('WORKSPACE_NAME', context.workspaceFolder.name);
      variables.set('WORKSPACE_PATH', context.workspaceFolder.uri.fsPath);
    }
    
    if (context?.targetPath) {
      variables.set('TARGET_DIR', path.basename(context.targetPath));
      variables.set('TARGET_PATH', context.targetPath);
    }

    // Note: Template.variables is always empty (not implemented)
    // No custom variable prompting needed

    return variables;
  }

  /**
   * Prompt for name with template suggestion
   */
  public async promptForNameWithTemplate(template: Template): Promise<string | undefined> {
    let suggestion = '';
    
    // Try to suggest a name based on template
    if (template.files.length > 0) {
      const firstFile = template.files[0];
      suggestion = path.basename(firstFile.relativePath);
    } else {
      suggestion = template.name.replace(/Template$/, '');
    }

    return await this.promptForName(template.type, suggestion);
  }

  /**
   * Prompt for name with context-aware suggestions
   */
  public async promptForNameWithContext(template: Template, context?: any): Promise<string | undefined> {
    let suggestion = '';
    
    // Generate context-aware suggestions
    if (context?.workspaceFolder && template.type === 'folder') {
      // For folder templates, suggest based on workspace
      suggestion = `${context.workspaceFolder.name}-${template.name.replace(/Template$/, '').toLowerCase()}`;
    } else if (template.files.length > 0) {
      // Use template file structure
      const firstFile = template.files[0];
      suggestion = path.basename(firstFile.relativePath);
      
      // Add timestamp for uniqueness if in same directory
      if (context?.isFolder) {
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const ext = path.extname(suggestion);
        const base = path.basename(suggestion, ext);
        suggestion = `${base}-${timestamp}${ext}`;
      }
    } else {
      suggestion = template.name.replace(/Template$/, '');
    }

    return await this.promptForName(template.type, suggestion);
  }

  /**
   * Prompt for file/folder name
   */
  public async promptForName(type: 'file' | 'folder', suggestion?: string): Promise<string | undefined> {
    const options: vscode.InputBoxOptions = {
      prompt: `Enter ${type} name`,
      value: suggestion || '',
      placeHolder: type === 'file' ? 'filename.ext' : 'foldername',
      validateInput: (value: string) => {
        if (!value.trim()) {
          return `${type === 'file' ? 'File' : 'Folder'} name is required`;
        }

        // Basic validation for invalid characters
        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(value)) {
          return 'Name contains invalid characters';
        }

        // Windows reserved names
        if (process.platform === 'win32') {
          const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
          if (reserved.test(value)) {
            return 'Name is reserved by Windows';
          }
        }

        return undefined;
      }
    };

    return await vscode.window.showInputBox(options);
  }

  /**
   * Determine target location for creation
   */
  public determineTargetLocation(uri?: vscode.Uri): string {
    if (uri) {
      return uri.fsPath;
    }

    // Use first workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return workspaceFolder.uri.fsPath;
    }

    // Fallback to home directory
    return process.env.HOME || process.env.USERPROFILE || '';
  }

  /**
   * Create file/folder from template
   */
  public async createFromTemplate(
    template: Template,
    targetPath: string,
    name: string,
    variables: Map<string, string>
  ): Promise<TemplateCreationResult> {
    try {
      let createdPath: string;
      let filesCreated = 0;

      if (template.type === 'file') {
        // Process file name for variables
        const processedName = this.variableService.processPath(name, variables);
        createdPath = path.join(targetPath, processedName);
        
        // Create single file
        await this.createFileFromTemplate(template, createdPath, variables);
        filesCreated = 1;
      } else {
        // Create folder and its contents
        const processedName = this.variableService.processPath(name, variables);
        createdPath = path.join(targetPath, processedName);
        
        // Create folder structure
        filesCreated = await this.createFolderFromTemplate(template, createdPath, variables);
      }

      return {
        success: true,
        createdPath,
        filesCreated
      };
    } catch (error) {
      return {
        success: false,
        error: `Creation failed: ${error}`
      };
    }
  }

  /**
   * Create file from template
   */
  public async createFile(filePath: string, content: string): Promise<TemplateCreationResult> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));

      // Write file
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), encoder.encode(content));

      return { success: true, createdPath: filePath };
    } catch (error) {
      return { success: false, error: `Failed to create file: ${error}` };
    }
  }

  /**
   * Create file/folder from template with progress indication
   */
  public async createFromTemplateWithProgress(
    template: Template,
    targetPath: string,
    name: string,
    variables: Map<string, string>
  ): Promise<TemplateCreationResult> {
    if (template.files.length <= 1) {
      // Simple creation, no progress needed
      return this.createFromTemplate(template, targetPath, name, variables);
    }

    // Show progress for complex templates
    return vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Creating ${template.type} from template`,
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0, message: 'Preparing...' });
      
      try {
        const result = await this.createFromTemplate(template, targetPath, name, variables);
        
        if (result.success) {
          progress.report({ increment: 100, message: 'Complete!' });
        }
        
        return result;
      } catch (error) {
        return { success: false, error: `Creation failed: ${error}` };
      }
    });
  }

  /**
   * Handle successful creation with appropriate notifications and actions
   */
  public async handleSuccessfulCreation(result: TemplateCreationResult, template: Template): Promise<void> {
    const itemType = template.type === 'file' ? 'File' : 'Folder';
    const fileCount = result.filesCreated || 1;
    
    let message = `${itemType} created successfully!`;
    if (fileCount > 1) {
      message = `${itemType} created with ${fileCount} files!`;
    }
    
    const actions: string[] = [];
    
    if (template.type === 'file') {
      actions.push('Open File');
    } else {
      actions.push('Open Folder');
    }
    
    actions.push('Reveal in Explorer');
    
    const selected = await vscode.window.showInformationMessage(message, ...actions);
    
    if (selected && result.createdPath) {
      switch (selected) {
        case 'Open File':
          const document = await vscode.workspace.openTextDocument(result.createdPath);
          await vscode.window.showTextDocument(document);
          break;
        case 'Open Folder':
          const uri = vscode.Uri.file(result.createdPath);
          await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
          break;
        case 'Reveal in Explorer':
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(result.createdPath));
          break;
      }
    }
  }

  /**
   * Offer to open created file/folder
   */
  private async offerToOpen(createdPath: string, type: 'file' | 'folder'): Promise<void> {
    const action = type === 'file' ? 'Open File' : 'Open Folder';
    const selected = await vscode.window.showInformationMessage(
      `${type === 'file' ? 'File' : 'Folder'} created successfully!`,
      action
    );

    if (selected === action) {
      if (type === 'file') {
        const document = await vscode.workspace.openTextDocument(createdPath);
        await vscode.window.showTextDocument(document);
      } else {
        const uri = vscode.Uri.file(createdPath);
        await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
      }
    }
  }

  /**
   * Create file from template
   */
  private async createFileFromTemplate(template: Template, filePath: string, variables: Map<string, string>): Promise<void> {
    if (template.files.length === 0) {
      throw new Error('Template has no files');
    }

    // Use first file as the main file
    const templateFile = template.files[0];
    const processedContent = this.variableService.processTemplate(templateFile.content, variables);
    
    const result = await this.createFile(filePath, processedContent);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  /**
   * Create folder from template
   */
  private async createFolderFromTemplate(template: Template, folderPath: string, variables: Map<string, string>): Promise<number> {
    // Create base folder
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));

    let filesCreated = 0;

    // Create all files in the template
    for (const templateFile of template.files) {
      const processedPath = this.variableService.processPath(templateFile.relativePath, variables);
      const fullPath = path.join(folderPath, processedPath);
      const processedContent = this.variableService.processTemplate(templateFile.content, variables);

      const result = await this.createFile(fullPath, processedContent);
      if (result.success) {
        filesCreated++;
      }
    }

    return filesCreated;
  }
}