import * as vscode from 'vscode';
export declare class DbtProjectManager {
    private projectPath;
    private context;
    private readonly CONFIG_KEY;
    constructor(context: vscode.ExtensionContext);
    /**
     * Load project path from extension settings
     */
    private loadProjectPath;
    /**
     * Auto-detect DBT project from workspace folders
     */
    autoDetectProject(): boolean;
    /**
     * Validate if a folder contains a valid DBT project
     */
    validateDbtProject(folderPath: string): boolean;
    /**
     * Set the project path and save to settings
     */
    setProjectPath(folderPath: string): Promise<void>;
    /**
     * Save project path to settings
     */
    private saveProjectPath;
    /**
     * Get the current project path
     */
    getProjectPath(): string | undefined;
    /**
     * Get project information
     */
    getProjectInfo(): {
        name: string;
        path: string;
        models: string[];
    } | null;
    /**
     * Count models in a layer
     */
    private countModels;
    /**
     * Create layer directory if it doesn't exist
     */
    ensureLayerDirectory(layer: string): string;
    /**
     * Save a model file to the project
     */
    saveModel(layer: string, modelName: string, content: string): string;
    /**
     * Save a Python script (for Bronze layer)
     */
    saveScript(scriptName: string, content: string): string;
    /**
     * Update or create sources.yml
     */
    updateSourcesYml(layer: string, sourcesContent: string): void;
    /**
     * Update or create schema.yml
     */
    updateSchemaYml(layer: string, schemaContent: string): void;
}
