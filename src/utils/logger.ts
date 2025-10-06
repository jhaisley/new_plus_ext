import * as vscode from 'vscode';

/**
 * Log levels for the NewPlus extension
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Comprehensive logging service for the NewPlus extension
 */
export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('NewPlus');
  }

  /**
   * Get the singleton logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize the logger with configuration
   */
  public initialize(logLevel: LogLevel = LogLevel.INFO): void {
    this.logLevel = logLevel;
    this.info('Logger initialized');
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: string): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: string): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: string): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: string, error?: Error): void {
    let fullMessage = message;
    if (error) {
      fullMessage += ` | Error: ${error.message}`;
    }
    this.log(LogLevel.ERROR, fullMessage, context);
  }

  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number): void {
    this.info(`Performance: ${operation} took ${duration}ms`);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    const contextStr = context ? `[${context}] ` : '';
    
    const logLine = `${timestamp} ${levelStr} ${contextStr}${message}`;
    
    this.outputChannel.appendLine(logLine);
    
    // Also log to console
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      case LogLevel.INFO:
        console.log(logLine);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.ERROR:
        console.error(logLine);
        break;
    }
  }

  /**
   * Show the output channel
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * Dispose of the logger
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();