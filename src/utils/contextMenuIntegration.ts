import * as vscode from 'vscode';
import { Template } from '../models/template';

/**
 * Context menu integration utilities for VS Code explorer
 */
export class ContextMenuIntegration {
  /**
   * Determine appropriate templates based on context
   */
  public static async getContextualTemplates(
    uri: vscode.Uri | undefined,
    allTemplates: Template[]
  ): Promise<{ suggested: Template[]; other: Template[] }> {
    const suggested: Template[] = [];
    const other: Template[] = [];
    
    if (!uri) {
      // No context, return all templates
      return { suggested: [], other: allTemplates };
    }
    
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;
      
      if (isDirectory) {
        // In a folder context, suggest both file and folder templates
        // but prioritize file templates for direct creation
        for (const template of allTemplates) {
          if (template.type === 'file') {
            suggested.push(template);
          } else {
            other.push(template);
          }
        }
      } else {
        // In a file context, suggest file templates and put folder templates in other
        for (const template of allTemplates) {
          if (template.type === 'file') {
            suggested.push(template);
          } else {
            other.push(template);
          }
        }
      }
    } catch {
      // If we can't determine the type, treat as directory
      for (const template of allTemplates) {
        if (template.type === 'file') {
          suggested.push(template);
        } else {
          other.push(template);
        }
      }
    }
    
    return { suggested, other };
  }

  /**
   * Get context-aware menu label
   */
  public static getContextMenuLabel(uri?: vscode.Uri): string {
    if (!uri) {
      return 'New from Template...';
    }
    
    // Try to determine if it's a file or folder
    return 'New from Template...';
  }

  /**
   * Analyze file context to suggest relevant template types
   */
  public static analyzeFileContext(uri: vscode.Uri): {
    directory: string;
    fileExtension?: string;
    fileName?: string;
    suggestedCategories: string[];
  } {
    const fsPath = uri.fsPath;
    const directory = require('path').dirname(fsPath);
    const fileName = require('path').basename(fsPath);
    const fileExtension = require('path').extname(fsPath);
    
    const suggestedCategories: string[] = [];
    
    // Suggest categories based on file extension
    switch (fileExtension.toLowerCase()) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        suggestedCategories.push('javascript', 'typescript', 'react');
        break;
      case '.py':
        suggestedCategories.push('python');
        break;
      case '.java':
        suggestedCategories.push('java');
        break;
      case '.cs':
        suggestedCategories.push('csharp');
        break;
      case '.cpp':
      case '.c':
      case '.h':
        suggestedCategories.push('cpp', 'c');
        break;
      case '.rs':
        suggestedCategories.push('rust');
        break;
      case '.go':
        suggestedCategories.push('go');
        break;
      case '.php':
        suggestedCategories.push('php');
        break;
      case '.rb':
        suggestedCategories.push('ruby');
        break;
      case '.html':
      case '.css':
      case '.scss':
      case '.sass':
        suggestedCategories.push('web', 'frontend');
        break;
      case '.sql':
        suggestedCategories.push('database', 'sql');
        break;
      case '.md':
        suggestedCategories.push('documentation', 'markdown');
        break;
      case '.json':
      case '.xml':
      case '.yaml':
      case '.yml':
        suggestedCategories.push('config', 'data');
        break;
    }
    
    // Suggest categories based on directory name
    const dirName = require('path').basename(directory).toLowerCase();
    if (dirName.includes('test')) {
      suggestedCategories.push('test', 'testing');
    }
    if (dirName.includes('doc')) {
      suggestedCategories.push('documentation');
    }
    if (dirName.includes('config')) {
      suggestedCategories.push('config', 'configuration');
    }
    
    return {
      directory,
      fileExtension: fileExtension || undefined,
      fileName,
      suggestedCategories
    };
  }

  /**
   * Filter templates by suggested categories
   */
  public static filterTemplatesByCategories(templates: Template[], categories: string[]): Template[] {
    if (categories.length === 0) {
      return templates;
    }
    
    return templates.filter(template => {
      if (!template.category && !template.tags) {
        return false;
      }
      
      const templateCategories = [
        template.category?.toLowerCase(),
        ...(template.tags?.map(tag => tag.toLowerCase()) || [])
      ].filter(Boolean);
      
      return categories.some(category => 
        templateCategories.includes(category.toLowerCase())
      );
    });
  }

  /**
   * Create quick pick items with context awareness
   */
  public static createContextualQuickPickItems(
    suggested: Template[],
    other: Template[],
    recentTemplates: string[]
  ): Array<vscode.QuickPickItem & { template?: Template }> {
    const items: Array<vscode.QuickPickItem & { template?: Template }> = [];
    
    // Add recent templates first
    const recentItems = recentTemplates
      .map(name => [...suggested, ...other].find(t => t.name === name))
      .filter(t => t !== undefined) as Template[];
    
    if (recentItems.length > 0) {
      items.push({
        label: 'Recently Used',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      recentItems.forEach(template => {
        items.push({
          label: `$(clock) ${template.name}`,
          description: template.description,
          detail: `${template.type} template`,
          template
        });
      });
    }
    
    // Add suggested templates
    if (suggested.length > 0) {
      items.push({
        label: 'Suggested for This Context',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      suggested
        .filter(t => !recentTemplates.includes(t.name))
        .forEach(template => {
          const icon = template.type === 'file' ? '$(file)' : '$(folder)';
          items.push({
            label: `${icon} ${template.name}`,
            description: template.description,
            detail: template.category || `${template.type} template`,
            template
          });
        });
    }
    
    // Add other templates
    const otherFiltered = other.filter(t => !recentTemplates.includes(t.name));
    if (otherFiltered.length > 0) {
      items.push({
        label: 'All Templates',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      otherFiltered.forEach(template => {
        const icon = template.type === 'file' ? '$(file)' : '$(folder)';
        items.push({
          label: `${icon} ${template.name}`,
          description: template.description,
          detail: template.category || `${template.type} template`,
          template
        });
      });
    }
    
    return items;
  }
}