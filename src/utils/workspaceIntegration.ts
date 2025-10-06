import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Utilities for VS Code workspace integration
 */
export class WorkspaceIntegration {
  /**
   * Get the active workspace folder or the first one if multiple
   */
  public static getActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return undefined;
    }
    
    // Try to get the workspace folder of the currently active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
      if (workspaceFolder) {
        return workspaceFolder;
      }
    }
    
    // Fallback to first workspace folder
    return folders[0];
  }

  /**
   * Get the target directory for template creation based on context
   */
  public static async getTargetDirectory(uri?: vscode.Uri): Promise<string> {
    if (uri) {
      // Use the provided URI's directory
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if ((stat.type & vscode.FileType.Directory) !== 0) {
          return uri.fsPath;
        } else {
          return path.dirname(uri.fsPath);
        }
      } catch {
        return path.dirname(uri.fsPath);
      }
    }
    
    // Try to use the directory of the active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
      return path.dirname(activeEditor.document.uri.fsPath);
    }
    
    // Use the workspace root
    const workspaceFolder = this.getActiveWorkspaceFolder();
    if (workspaceFolder) {
      return workspaceFolder.uri.fsPath;
    }
    
    // Fallback to home directory
    return process.env.HOME || process.env.USERPROFILE || '';
  }

  /**
   * Reveal file or folder in VS Code explorer
   */
  public static async revealInExplorer(fsPath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(fsPath);
      await vscode.commands.executeCommand('revealInExplorer', uri);
    } catch (error) {
      console.warn('Failed to reveal in explorer:', error);
    }
  }

  /**
   * Open file in editor
   */
  public static async openFile(fsPath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(fsPath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      console.warn('Failed to open file:', error);
    }
  }

  /**
   * Open folder in new window or current window
   */
  public static async openFolder(fsPath: string, newWindow: boolean = false): Promise<void> {
    try {
      const uri = vscode.Uri.file(fsPath);
      await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: newWindow });
    } catch (error) {
      console.warn('Failed to open folder:', error);
    }
  }

  /**
   * Get relative path within workspace
   */
  public static getWorkspaceRelativePath(fsPath: string): string {
    const workspaceFolder = this.getActiveWorkspaceFolder();
    if (workspaceFolder) {
      return path.relative(workspaceFolder.uri.fsPath, fsPath);
    }
    return fsPath;
  }

  /**
   * Check if path is within any workspace
   */
  public static isWithinWorkspace(fsPath: string): boolean {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      return false;
    }
    
    return folders.some(folder => {
      const relative = path.relative(folder.uri.fsPath, fsPath);
      return !relative.startsWith('..') && !path.isAbsolute(relative);
    });
  }

  /**
   * Get project type hints based on workspace content
   */
  public static async getProjectTypeHints(): Promise<string[]> {
    const hints: string[] = [];
    const workspaceFolder = this.getActiveWorkspaceFolder();
    
    if (!workspaceFolder) {
      return hints;
    }
    
    try {
      const files = await vscode.workspace.fs.readDirectory(workspaceFolder.uri);
      const fileNames = files.map(([name]) => name.toLowerCase());
      
      // Detect common project types
      if (fileNames.includes('package.json')) {
        hints.push('nodejs', 'javascript', 'typescript');
      }
      if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) {
        hints.push('java');
      }
      if (fileNames.includes('cargo.toml')) {
        hints.push('rust');
      }
      if (fileNames.includes('go.mod')) {
        hints.push('go');
      }
      if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py') || fileNames.includes('pyproject.toml')) {
        hints.push('python');
      }
      if (fileNames.includes('composer.json')) {
        hints.push('php');
      }
      if (fileNames.includes('csproj') || files.some(([name]) => name.endsWith('.csproj'))) {
        hints.push('csharp', 'dotnet');
      }
      
    } catch (error) {
      console.warn('Failed to read workspace directory:', error);
    }
    
    return hints;
  }

  /**
   * Show workspace-specific information message
   */
  public static async showWorkspaceMessage(message: string, ...items: string[]): Promise<string | undefined> {
    const workspaceFolder = this.getActiveWorkspaceFolder();
    const prefix = workspaceFolder ? `[${workspaceFolder.name}] ` : '';
    return vscode.window.showInformationMessage(prefix + message, ...items);
  }

  /**
   * Register workspace folder change handlers
   */
  public static onWorkspaceFoldersChanged(handler: (event: vscode.WorkspaceFoldersChangeEvent) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeWorkspaceFolders(handler);
  }
}