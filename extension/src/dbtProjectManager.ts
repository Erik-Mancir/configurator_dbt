import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class DbtProjectManager {
    private projectPath: string | undefined;
    private context: vscode.ExtensionContext;
    private readonly CONFIG_KEY = 'dbtConfigurator.projectPath';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadProjectPath();
    }

    /**
     * Load project path from extension settings
     */
    private loadProjectPath(): void {
        const config = vscode.workspace.getConfiguration('dbtConfigurator');
        this.projectPath = config.get<string>('projectPath');
    }

    /**
     * Auto-detect DBT project from workspace folders
     */
    public autoDetectProject(): boolean {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }

        // Search for dbt_project.yml in workspace folders
        for (const folder of workspaceFolders) {
            const dbtProjectPath = path.join(folder.uri.fsPath, 'dbt_project.yml');
            if (fs.existsSync(dbtProjectPath)) {
                this.projectPath = folder.uri.fsPath;
                this.saveProjectPath();
                vscode.window.showInformationMessage(
                    `✅ DBT Project auto-detected: ${path.basename(this.projectPath)}`
                );
                return true;
            }
        }

        return false;
    }

    /**
     * Validate if a folder contains a valid DBT project
     */
    public validateDbtProject(folderPath: string): boolean {
        const dbtProjectPath = path.join(folderPath, 'dbt_project.yml');
        return fs.existsSync(dbtProjectPath);
    }

    /**
     * Set the project path and save to settings
     */
    public async setProjectPath(folderPath: string): Promise<void> {
        this.projectPath = folderPath;
        await this.saveProjectPath();
    }

    /**
     * Save project path to settings
     */
    private async saveProjectPath(): Promise<void> {
        const config = vscode.workspace.getConfiguration('dbtConfigurator');
        await config.update('projectPath', this.projectPath, vscode.ConfigurationTarget.Workspace);
    }

    /**
     * Get the current project path
     */
    public getProjectPath(): string | undefined {
        return this.projectPath;
    }

    /**
     * Get project information
     */
    public getProjectInfo(): { name: string; path: string; models: string[] } | null {
        if (!this.projectPath) {
            return null;
        }

        const dbtProjectYml = path.join(this.projectPath, 'dbt_project.yml');
        const modelsDir = path.join(this.projectPath, 'models');

        try {
            const fileContent = fs.readFileSync(dbtProjectYml, 'utf8');
            const projectConfig = yaml.load(fileContent) as any;
            const projectName = projectConfig.name || 'Unknown';

            const layers = ['bronze', 'silver', 'gold']
                .filter(layer => fs.existsSync(path.join(modelsDir, layer)))
                .map(layer => `${layer} (${this.countModels(modelsDir, layer)})`);

            return {
                name: projectName,
                path: this.projectPath,
                models: layers,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Count models in a layer
     */
    private countModels(modelsDir: string, layer: string): number {
        try {
            const layerDir = path.join(modelsDir, layer);
            if (fs.existsSync(layerDir)) {
                return fs.readdirSync(layerDir).filter(f => f.endsWith('.sql')).length;
            }
        } catch (error) {
            // Ignore
        }
        return 0;
    }

    /**
     * Create layer directory if it doesn't exist
     */
    public ensureLayerDirectory(layer: string): string {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }

        const layerDir = path.join(this.projectPath, 'models', layer);
        if (!fs.existsSync(layerDir)) {
            fs.mkdirSync(layerDir, { recursive: true });
        }
        return layerDir;
    }

    /**
     * Save a model file to the project
     */
    public saveModel(layer: string, modelName: string, content: string): string {
        const layerDir = this.ensureLayerDirectory(layer);
        const filePath = path.join(layerDir, `${modelName}.sql`);
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    }

    /**
     * Save a Python script (for Bronze layer)
     */
    public saveScript(scriptName: string, content: string): string {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }

        const scriptsDir = path.join(this.projectPath, 'bronze', 'pipelines');
        if (!fs.existsSync(scriptsDir)) {
            fs.mkdirSync(scriptsDir, { recursive: true });
        }

        const filePath = path.join(scriptsDir, scriptName);
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    }

    /**
     * Update or create sources.yml
     */
    public updateSourcesYml(layer: string, sourcesContent: string): void {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }

        const layerDir = this.ensureLayerDirectory(layer);
        const sourcesFilePath = path.join(layerDir, 'sources.yml');

        try {
            let existingContent: any = {};

            if (fs.existsSync(sourcesFilePath)) {
                const fileContent = fs.readFileSync(sourcesFilePath, 'utf8');
                existingContent = yaml.load(fileContent) || {};
            }

            const newContent = yaml.load(sourcesContent) as any;

            // Merge sources
            if (!existingContent.sources) {
                existingContent.sources = [];
            }

            existingContent.sources = [
                ...existingContent.sources,
                ...(newContent.sources || []),
            ];

            fs.writeFileSync(sourcesFilePath, yaml.dump(existingContent), 'utf8');
        } catch (error) {
            console.error('Error updating sources.yml:', error);
        }
    }

    /**
     * Update or create schema.yml
     */
    public updateSchemaYml(layer: string, schemaContent: string): void {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }

        const layerDir = this.ensureLayerDirectory(layer);
        const schemaFilePath = path.join(layerDir, 'schema.yml');

        try {
            let existingContent: any = {};

            if (fs.existsSync(schemaFilePath)) {
                const fileContent = fs.readFileSync(schemaFilePath, 'utf8');
                existingContent = yaml.load(fileContent) || {};
            }

            const newContent = yaml.load(schemaContent) as any;

            // Merge models
            if (!existingContent.models) {
                existingContent.models = [];
            }

            existingContent.models = [
                ...existingContent.models,
                ...(newContent.models || []),
            ];

            fs.writeFileSync(schemaFilePath, yaml.dump(existingContent), 'utf8');
        } catch (error) {
            console.error('Error updating schema.yml:', error);
        }
    }
}
