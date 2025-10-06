import * as vscode from 'vscode';
import { ConfigService } from './services/configService';
import { TemplateService } from './services/templateService';
import { VariableService } from './services/variableService';
import { NewFromTemplateCommand } from './commands/newFromTemplate';
import { OpenTemplatesFolderCommand } from './commands/openTemplatesFolder';
import { WorkspaceIntegration } from './utils/workspaceIntegration';
import { ContextMenuIntegration } from './utils/contextMenuIntegration';

// Services
let configService: ConfigService;
let templateService: TemplateService;
let variableService: VariableService;

// Integration utilities
let workspaceIntegration: WorkspaceIntegration;

// Commands
let newFromTemplateCommand: NewFromTemplateCommand;
let openTemplatesFolderCommand: OpenTemplatesFolderCommand;

/**
 * Extension context wrapper for testing
 */
export class ExtensionContext {
  /**
   * Activate the extension
   */
  public static async activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('NewPlus extension is being activated...');

    try {
      // Initialize services
      configService = new ConfigService();
      await configService.initialize();

      variableService = new VariableService();
      
      templateService = new TemplateService(configService);
      await templateService.initialize();

      // Initialize integration utilities
      workspaceIntegration = new WorkspaceIntegration();

      // Initialize commands
      newFromTemplateCommand = new NewFromTemplateCommand(templateService, variableService, workspaceIntegration);
      openTemplatesFolderCommand = new OpenTemplatesFolderCommand();

      // Register commands
      const disposables = [
        vscode.commands.registerCommand('newFromTemplate.createFromTemplate', 
          (uri?: vscode.Uri) => newFromTemplateCommand.execute(uri)
        ),
        vscode.commands.registerCommand('newFromTemplate.openTemplatesFolder', 
          () => openTemplatesFolderCommand.execute()
        )
      ];

      // Add disposables to context
      context.subscriptions.push(...disposables);

      console.log('NewPlus extension activated successfully!');
    } catch (error) {
      console.error('Failed to activate NewPlus extension:', error);
      vscode.window.showErrorMessage(`Failed to activate NewPlus extension: ${error}`);
    }
  }

  /**
   * Deactivate the extension
   */
  public static async deactivate(): Promise<void> {
    console.log('NewPlus extension is being deactivated...');

    try {
      // Dispose services
      if (configService) {
        await configService.dispose();
      }
      if (templateService) {
        await templateService.dispose();
      }
      
      console.log('NewPlus extension deactivated successfully!');
    } catch (error) {
      console.error('Error during NewPlus extension deactivation:', error);
    }
  }
}

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await ExtensionContext.activate(context);
}

/**
 * Called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
  await ExtensionContext.deactivate();
}