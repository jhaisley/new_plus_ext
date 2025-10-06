import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigService } from '../services/configService';

/**
 * Command for opening the templates folder in system explorer
 */
export class OpenTemplatesFolderCommand {
  private configService: ConfigService;

  constructor(configService?: ConfigService) {
    this.configService = configService || new ConfigService();
  }

  /**
   * Execute the command to open templates folder
   */
  public async execute(): Promise<void> {
    try {
      const templatesPath = await this.getTemplatesPath();
      
      // Check if folder exists
      if (!await this.checkFolderExists(templatesPath)) {
        const create = await vscode.window.showInformationMessage(
          'Templates folder does not exist. Would you like to create it?',
          'Create Folder'
        );
        
        if (create === 'Create Folder') {
          await this.createFolder(templatesPath);
          vscode.window.showInformationMessage('Templates folder created successfully!');
        } else {
          return;
        }
      }
      
      // Open folder using VS Code's built-in command
      const folderUri = vscode.Uri.file(templatesPath);
      await vscode.commands.executeCommand('revealFileInOS', folderUri);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open templates folder: ${error}`);
    }
  }

  /**
   * Get templates path from configuration
   */
  public async getTemplatesPath(): Promise<string> {
    if (this.configService) {
      return await this.configService.getTemplatesPath();
    }
    // Fallback for tests or standalone usage
    return process.env.VSCODE_TEMPLATES_PATH || path.join(process.env.HOME || process.env.USERPROFILE || '', 'Documents', 'VSCode Templates');
  }

  /**
   * Check if folder exists
   */
  public async checkFolderExists(folderPath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
      return (stat.type & vscode.FileType.Directory) !== 0;
    } catch {
      return false;
    }
  }

  /**
   * Create folder
   */
  public async createFolder(folderPath: string): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));
  }
}