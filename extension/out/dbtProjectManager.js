"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbtProjectManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
class DbtProjectManager {
    constructor(context) {
        this.CONFIG_KEY = 'dbtConfigurator.projectPath';
        this.context = context;
        this.loadProjectPath();
    }
    /**
     * Load project path from extension settings
     */
    loadProjectPath() {
        const config = vscode.workspace.getConfiguration('dbtConfigurator');
        this.projectPath = config.get('projectPath');
    }
    /**
     * Auto-detect DBT project from workspace folders
     */
    autoDetectProject() {
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
                vscode.window.showInformationMessage(`✅ DBT Project auto-detected: ${path.basename(this.projectPath)}`);
                return true;
            }
        }
        return false;
    }
    /**
     * Validate if a folder contains a valid DBT project
     */
    validateDbtProject(folderPath) {
        const dbtProjectPath = path.join(folderPath, 'dbt_project.yml');
        return fs.existsSync(dbtProjectPath);
    }
    /**
     * Set the project path and save to settings
     */
    async setProjectPath(folderPath) {
        this.projectPath = folderPath;
        await this.saveProjectPath();
    }
    /**
     * Save project path to settings
     */
    async saveProjectPath() {
        const config = vscode.workspace.getConfiguration('dbtConfigurator');
        await config.update('projectPath', this.projectPath, vscode.ConfigurationTarget.Workspace);
    }
    /**
     * Get the current project path
     */
    getProjectPath() {
        return this.projectPath;
    }
    /**
     * Get project information
     */
    getProjectInfo() {
        if (!this.projectPath) {
            return null;
        }
        const dbtProjectYml = path.join(this.projectPath, 'dbt_project.yml');
        const modelsDir = path.join(this.projectPath, 'models');
        try {
            const fileContent = fs.readFileSync(dbtProjectYml, 'utf8');
            const projectConfig = yaml.load(fileContent);
            const projectName = projectConfig.name || 'Unknown';
            const layers = ['bronze', 'silver', 'gold']
                .filter(layer => fs.existsSync(path.join(modelsDir, layer)))
                .map(layer => `${layer} (${this.countModels(modelsDir, layer)})`);
            return {
                name: projectName,
                path: this.projectPath,
                models: layers,
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Count models in a layer
     */
    countModels(modelsDir, layer) {
        try {
            const layerDir = path.join(modelsDir, layer);
            if (fs.existsSync(layerDir)) {
                return fs.readdirSync(layerDir).filter(f => f.endsWith('.sql')).length;
            }
        }
        catch (error) {
            // Ignore
        }
        return 0;
    }
    /**
     * Create layer directory if it doesn't exist
     */
    ensureLayerDirectory(layer) {
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
    saveModel(layer, modelName, content) {
        const layerDir = this.ensureLayerDirectory(layer);
        const filePath = path.join(layerDir, `${modelName}.sql`);
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    }
    /**
     * Save a Python script (for Bronze layer)
     */
    saveScript(scriptName, content) {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }
        const scriptsDir = path.join(this.projectPath, 'scripts');
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
    updateSourcesYml(layer, sourcesContent) {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }
        const layerDir = this.ensureLayerDirectory(layer);
        const sourcesFilePath = path.join(layerDir, 'sources.yml');
        try {
            let existingContent = {};
            if (fs.existsSync(sourcesFilePath)) {
                const fileContent = fs.readFileSync(sourcesFilePath, 'utf8');
                existingContent = yaml.load(fileContent) || {};
            }
            const newContent = yaml.load(sourcesContent);
            // Merge sources
            if (!existingContent.sources) {
                existingContent.sources = [];
            }
            existingContent.sources = [
                ...existingContent.sources,
                ...(newContent.sources || []),
            ];
            fs.writeFileSync(sourcesFilePath, yaml.dump(existingContent), 'utf8');
        }
        catch (error) {
            console.error('Error updating sources.yml:', error);
        }
    }
    /**
     * Update or create schema.yml
     */
    updateSchemaYml(layer, schemaContent) {
        if (!this.projectPath) {
            throw new Error('No DBT project selected');
        }
        const layerDir = this.ensureLayerDirectory(layer);
        const schemaFilePath = path.join(layerDir, 'schema.yml');
        try {
            let existingContent = {};
            if (fs.existsSync(schemaFilePath)) {
                const fileContent = fs.readFileSync(schemaFilePath, 'utf8');
                existingContent = yaml.load(fileContent) || {};
            }
            const newContent = yaml.load(schemaContent);
            // Merge models
            if (!existingContent.models) {
                existingContent.models = [];
            }
            existingContent.models = [
                ...existingContent.models,
                ...(newContent.models || []),
            ];
            fs.writeFileSync(schemaFilePath, yaml.dump(existingContent), 'utf8');
        }
        catch (error) {
            console.error('Error updating schema.yml:', error);
        }
    }
}
exports.DbtProjectManager = DbtProjectManager;
//# sourceMappingURL=dbtProjectManager.js.map