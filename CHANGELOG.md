# Changelog

All notable changes to the NewPlus VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-01

### Added - VS Code Integration Features

#### Context-Aware Template Selection
- **Smart Template Filtering**: Templates are now automatically filtered based on the current workspace context and file location
- **Project Type Detection**: Automatically detects Node.js, Python, Java, and other project types to suggest relevant templates
- **Contextual Suggestions**: Right-click context menu provides templates most relevant to the selected location

#### Enhanced VS Code Integration
- **File Explorer Context Menu**: Right-click integration in VS Code file explorer for seamless workflow
- **Workspace Integration**: Comprehensive workspace folder detection and multi-root workspace support
- **Active Editor Context**: Uses currently active file location to provide better template suggestions
- **URI Handling**: Proper VS Code URI handling for all file and folder operations

#### Improved User Experience
- **Progress Indication**: Visual progress feedback for complex template creation operations
- **Context-Aware Naming**: Smart default name suggestions based on workspace context and template type
- **Enhanced Error Messages**: Comprehensive error handling with user-friendly messages and suggested solutions
- **Post-Creation Actions**: Quick actions to open created files, reveal in explorer, or browse folders

#### Workspace Intelligence
- **Project Type Hints**: Automatic detection of project frameworks and suggesting appropriate templates
- **Target Directory Resolution**: Intelligent determination of where to create new files/folders
- **Workspace-Specific Variables**: Auto-populated variables like `$WORKSPACE_NAME$` and `$TARGET_DIR$`

#### Advanced Template Features
- **Template Categorization**: Visual organization of templates with icons and categories
- **Recent Templates**: Quick access to recently used templates with visual indicators
- **Context Variables**: Automatic population of workspace and location-specific variables
- **Smart Template Recommendations**: Prioritized template suggestions based on context and usage patterns

### Technical Improvements

#### Architecture Enhancements
- **Modular Integration**: Clean separation of VS Code integration utilities
- **Service-Oriented Design**: Enhanced service layer with proper dependency injection
- **Type Safety**: Full TypeScript 5.0+ compliance with strict mode enabled
- **Promise-Based Operations**: Proper async/await patterns throughout the codebase

#### New Utility Classes
- **WorkspaceIntegration**: Comprehensive workspace detection and management utilities
- **ContextMenuIntegration**: Context-aware template filtering and suggestion logic
- **Enhanced Command System**: Improved command execution with context awareness and progress indication

#### VS Code API Integration
- **File System API**: Native VS Code file system operations for better compatibility
- **Progress API**: Integration with VS Code's progress indication system
- **Quick Pick API**: Enhanced template selection with categorization and search
- **Context Menu API**: Seamless integration with VS Code's file explorer context menu

### Configuration

#### New Settings
- All existing settings maintained for backward compatibility
- Enhanced workspace detection configuration
- Improved template path resolution with environment variable support

#### Context Menu Registration
- **File Explorer Integration**: `explorer/context` menu contributions
- **File Menu Integration**: `file/newFile` menu contributions  
- **Command Registration**: Proper VS Code command registration with activation events

### Testing and Quality

#### Integration Testing
- **VS Code API Testing**: Comprehensive testing of VS Code integration features
- **Workspace Detection Testing**: Validation of project type detection and workspace handling
- **Context Menu Testing**: Testing of context-aware template filtering and suggestions

#### Build System
- **TypeScript 5.0+ Compilation**: Full compilation without errors
- **ESLint Integration**: Code quality checks with minimal warnings
- **Test Suite**: Comprehensive test coverage for all integration features

### Developer Experience

#### Documentation
- **Comprehensive README**: Complete documentation of all integration features
- **API Documentation**: Detailed documentation of all utility classes and methods
- **Usage Examples**: Practical examples of context-aware template usage
- **Troubleshooting Guide**: Common issues and solutions for VS Code integration

#### Development Tools
- **Enhanced Build Process**: Streamlined compilation and testing workflow
- **Type Definitions**: Complete TypeScript definitions for all integration features
- **Extension Packaging**: Proper VSIX packaging for distribution

## [0.0.1] - Initial Release

### Added
- Basic template creation functionality
- File and folder template support
- Variable substitution system
- Configuration management
- Template service architecture
- Basic VS Code command integration

---

## Future Roadmap

### Planned Features
- **Template Repository**: Marketplace for sharing templates
- **Advanced Variables**: More sophisticated variable substitution
- **Template Validation**: Schema validation for template definitions
- **Bulk Operations**: Multiple file/folder creation from templates
- **Git Integration**: Template versioning and sharing via Git

### Performance Improvements
- **Template Caching**: Faster template discovery and loading
- **Incremental Updates**: Smart template directory monitoring
- **Background Processing**: Non-blocking template operations

### Enhanced Integration
- **More Project Types**: Extended project type detection
- **Language Server Integration**: Context-aware suggestions based on language servers
- **IntelliSense Integration**: Template suggestions in IntelliSense
- **Snippet Integration**: Convert templates to VS Code snippets