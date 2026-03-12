import * as vscode from 'vscode';
import * as path from 'path';
import { DbtProjectManager } from '../dbtProjectManager';

export class ConfiguratorPanel {
    public static readonly viewType = 'dbtConfiguratorView';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private currentLayer: string = 'bronze';
    private dbtProjectManager: DbtProjectManager;

    public static createOrShow(
        extensionUri: vscode.Uri,
        dbtProjectManager: DbtProjectManager
    ): ConfiguratorPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        // For simplicity, we'll create a new one each time
        const panel = vscode.window.createWebviewPanel(
            ConfiguratorPanel.viewType,
            'DBT Configurator',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
            }
        );

        return new ConfiguratorPanel(panel, extensionUri, dbtProjectManager);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        dbtProjectManager: DbtProjectManager
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.dbtProjectManager = dbtProjectManager;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            (message) => this._handleMessage(message),
            null,
            this._disposables
        );

        this._update();
    }

    public show(): void {
        this._panel.reveal(vscode.ViewColumn.One);
    }

    public reveal(): void {
        this._panel.reveal();
    }

    public dispose(): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public showLayer(layer: string): void {
        this.currentLayer = layer;
        this._update();
    }

    public updateProjectInfo(): void {
        this._update();
    }

    private async _handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'selectProject':
                vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
                break;

            case 'generateBronze':
                await this._generateBronze(message);
                break;

            case 'generateSilver':
                await this._generateSilver(message);
                break;

            case 'generateGold':
                await this._generateGold(message);
                break;

            case 'openFolder':
                await this._openFolderInExplorer(message.folderPath);
                break;
        }
    }

    private async _generateBronze(data: any): Promise<void> {
        try {
            const projectPath = this.dbtProjectManager.getProjectPath();
            if (!projectPath) {
                vscode.window.showErrorMessage('No DBT project selected');
                return;
            }

            // This corresponds to the original Streamlit generate_bronze_ingest
            const scriptName = `ingest_${data.destinationTable}.py`;
            const pythonModule = require('../../../utils/dbt_generator');

            const scriptContent = pythonModule.generate_bronze_ingest(
                data.sourceSystem,
                data.sourceType,
                data.sourcePath,
                data.sourceTable,
                data.destinationTable
            );

            const savedPath = this.dbtProjectManager.saveScript(scriptName, scriptContent);

            vscode.window.showInformationMessage(
                `✅ Bronze ingestion script saved: ${path.basename(savedPath)}`
            );

            // Open the file in editor
            const doc = await vscode.workspace.openTextDocument(savedPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating Bronze layer: ${error}`);
        }
    }

    private async _generateSilver(data: any): Promise<void> {
        try {
            const projectPath = this.dbtProjectManager.getProjectPath();
            if (!projectPath) {
                vscode.window.showErrorMessage('No DBT project selected');
                return;
            }

            // Use Python backend to generate content
            const pythonModule = require('../../../utils/dbt_generator');

            const sqlContent = pythonModule.generate_dbt_model(
                data.sourceSchema,
                data.sourceTable,
                data.resultTable,
                'silver'
            );

            const sourcesYml = pythonModule.generate_sources_yml(
                data.sourceSchema,
                data.sourceTable,
                data.resultTable
            );

            const schemaYml = pythonModule.generate_schema_yml(
                data.resultTable,
                'silver'
            );

            // Save files
            const sqlPath = this.dbtProjectManager.saveModel('silver', data.resultTable, sqlContent);
            this.dbtProjectManager.updateSourcesYml('silver', sourcesYml);
            this.dbtProjectManager.updateSchemaYml('silver', schemaYml);

            vscode.window.showInformationMessage(
                `✅ Silver model created: models/silver/${data.resultTable}.sql`
            );

            // Open the SQL file
            const doc = await vscode.workspace.openTextDocument(sqlPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating Silver layer: ${error}`);
        }
    }

    private async _generateGold(data: any): Promise<void> {
        try {
            const projectPath = this.dbtProjectManager.getProjectPath();
            if (!projectPath) {
                vscode.window.showErrorMessage('No DBT project selected');
                return;
            }

            // Use Python backend
            const pythonModule = require('../../../utils/dbt_generator');

            const sqlContent = pythonModule.generate_dbt_model(
                data.sourceSchema,
                data.sourceTable,
                data.resultTable,
                'gold'
            );

            const schemaYml = pythonModule.generate_schema_yml(
                data.resultTable,
                'gold'
            );

            // Save files
            const sqlPath = this.dbtProjectManager.saveModel('gold', data.resultTable, sqlContent);
            this.dbtProjectManager.updateSchemaYml('gold', schemaYml);

            vscode.window.showInformationMessage(
                `✅ Gold model created: models/gold/${data.resultTable}.sql`
            );

            // Open the SQL file
            const doc = await vscode.workspace.openTextDocument(sqlPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating Gold layer: ${error}`);
        }
    }

    private async _openFolderInExplorer(folderPath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(folderPath);
            await vscode.commands.executeCommand('revealFileInOS', uri);
        } catch (error) {
            vscode.window.showErrorMessage('Could not open folder');
        }
    }

    private _update(): void {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const projectInfo = this.dbtProjectManager.getProjectInfo();
        const projectPath = this.dbtProjectManager.getProjectPath();

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DBT Configurator</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 16px;
            line-height: 1.6;
          }
          
          .container {
            max-width: 700px;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            gap: 12px;
          }
          
          .header-icon {
            font-size: 24px;
          }
          
          h1 {
            font-size: 20px;
            font-weight: 600;
          }
          
          .project-section {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-sideBar-border);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
          }
          
          .project-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .project-status-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .project-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }
          
          .no-project {
            color: var(--vscode-errorForeground);
          }
          
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }
          
          .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
          }
          
          .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          
          .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
          }
          
          .tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-sideBar-border);
          }
          
          .tab {
            padding: 8px 16px;
            border: none;
            background: transparent;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }
          
          .tab:hover {
            color: var(--vscode-editor-foreground);
          }
          
          .tab.active {
            color: var(--vscode-editor-foreground);
            border-bottom-color: var(--vscode-focusBorder);
          }
          
          .form-section {
            display: none;
          }
          
          .form-section.active {
            display: block;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-editor-foreground);
          }
          
          input,
          select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
          }
          
          input:focus,
          select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-input-background);
          }
          
          .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
          }
          
          .form-actions {
            display: flex;
            gap: 8px;
            margin-top: 24px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            margin-top: 16px;
            color: var(--vscode-editor-foreground);
          }
          
          :first-child .section-title {
            margin-top: 0;
          }
          
          .alert {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 13px;
          }
          
          .alert-info {
            background: var(--vscode-statusBar-debuggingBackground);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-statusBar-debuggingBorder);
          }
          
          .alert-warning {
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
            border: 1px solid #ffc107;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">🏗️</div>
            <h1>DBT Medallion Configurator</h1>
          </div>
          
          <div class="project-section">
            <div class="project-status">
              <div class="project-status-label">Active Project</div>
              <button class="btn btn-secondary" onclick="selectProject()">
                ${projectPath ? '✓ Change' : 'Select'}
              </button>
            </div>
            <div>
              ${projectInfo
                ? `
                <div class="project-name">${projectInfo.name}</div>
                <div class="help-text">${projectInfo.path}</div>
                ${projectInfo.models.length > 0
                    ? `<div class="help-text" style="margin-top: 8px;">Layers: ${projectInfo.models.join(', ')}</div>`
                    : ''
                }
              `
                : '<div class="no-project">No DBT project selected</div>'
            }
            </div>
          </div>
          
          ${!projectPath ? '<div class="alert alert-warning">⚠️ Select a DBT project to get started</div>' : ''}
          
          <div class="tabs">
            <button class="tab active${projectPath ? '' : ' disabled'}" onclick="switchTab('bronze')" ${projectPath ? '' : 'disabled'}>🥉 Bronze</button>
            <button class="tab${projectPath ? '' : ' disabled'}" onclick="switchTab('silver')" ${projectPath ? '' : 'disabled'}>🥈 Silver</button>
            <button class="tab${projectPath ? '' : ' disabled'}" onclick="switchTab('gold')" ${projectPath ? '' : 'disabled'}>🥇 Gold</button>
          </div>
          
          <!-- BRONZE FORM -->
          <div id="bronze" class="form-section active">
            <p class="help-text" style="margin-bottom: 16px;">Configure PySpark ingestion from various data sources</p>
            
            <div class="form-group">
              <label for="bronze-source-system">Source System</label>
              <input type="text" id="bronze-source-system" placeholder="e.g., ERP, CRM, API">
              <div class="help-text">Name of the source system</div>
            </div>
            
            <div class="form-group">
              <label for="bronze-source-type">Source Type</label>
              <select id="bronze-source-type">
                <option>csv</option>
                <option>parquet</option>
                <option>database</option>
                <option>api</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="bronze-source-path">Source Path/Connection</label>
              <input type="text" id="bronze-source-path" placeholder="e.g., /data/source.csv or jdbc://...">
            </div>
            
            <div class="form-group">
              <label for="bronze-source-table">Source Table</label>
              <input type="text" id="bronze-source-table" placeholder="e.g., customers">
            </div>
            
            <div class="form-group">
              <label for="bronze-dest-table">Destination Table (Bronze)</label>
              <input type="text" id="bronze-dest-table" placeholder="e.g., raw_customers">
            </div>
            
            <div class="form-actions">
              <button class="btn btn-primary" onclick="generateBronze()">
                ✨ Generate Bronze Script
              </button>
            </div>
          </div>
          
          <!-- SILVER FORM -->
          <div id="silver" class="form-section">
            <p class="help-text" style="margin-bottom: 16px;">Generate DBT models for data quality and standardization</p>
            
            <div class="form-group">
              <label for="silver-source-schema">Source Schema</label>
              <input type="text" id="silver-source-schema" placeholder="e.g., bronze">
              <div class="help-text">Schema containing source tables</div>
            </div>
            
            <div class="form-group">
              <label for="silver-source-table">Source Table</label>
              <input type="text" id="silver-source-table" placeholder="e.g., raw_customers">
            </div>
            
            <div class="form-group">
              <label for="silver-result-table">Result Table Name</label>
              <input type="text" id="silver-result-table" placeholder="e.g., customers_silver">
            </div>
            
            <div class="form-actions">
              <button class="btn btn-primary" onclick="generateSilver()">
                ✨ Generate Silver Model
              </button>
            </div>
          </div>
          
          <!-- GOLD FORM -->
          <div id="gold" class="form-section">
            <p class="help-text" style="margin-bottom: 16px;">Generate DBT models for business logic and analytics</p>
            
            <div class="form-group">
              <label for="gold-source-schema">Source Schema</label>
              <input type="text" id="gold-source-schema" placeholder="e.g., silver">
              <div class="help-text">Schema containing source tables</div>
            </div>
            
            <div class="form-group">
              <label for="gold-source-table">Source Table</label>
              <input type="text" id="gold-source-table" placeholder="e.g., customers_silver">
            </div>
            
            <div class="form-group">
              <label for="gold-result-table">Result Table Name</label>
              <input type="text" id="gold-result-table" placeholder="e.g., dim_customers">
            </div>
            
            <div class="form-actions">
              <button class="btn btn-primary" onclick="generateGold()">
                ✨ Generate Gold Model
              </button>
            </div>
          </div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function selectProject() {
            vscode.postMessage({ command: 'selectProject' });
          }
          
          function switchTab(tab) {
            // Hide all sections
            document.querySelectorAll('.form-section').forEach(el => {
              el.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(el => {
              el.classList.remove('active');
            });
            
            // Show selected section and mark tab
            document.getElementById(tab).classList.add('active');
            event.target.classList.add('active');
          }
          
          function generateBronze() {
            const sourceSystem = document.getElementById('bronze-source-system').value;
            const sourceType = document.getElementById('bronze-source-type').value;
            const sourcePath = document.getElementById('bronze-source-path').value;
            const sourceTable = document.getElementById('bronze-source-table').value;
            const destinationTable = document.getElementById('bronze-dest-table').value;
            
            if (!sourceSystem || !sourceType || !sourcePath || !sourceTable || !destinationTable) {
              alert('Please fill in all fields');
              return;
            }
            
            vscode.postMessage({
              command: 'generateBronze',
              sourceSystem,
              sourceType,
              sourcePath,
              sourceTable,
              destinationTable
            });
          }
          
          function generateSilver() {
            const sourceSchema = document.getElementById('silver-source-schema').value;
            const sourceTable = document.getElementById('silver-source-table').value;
            const resultTable = document.getElementById('silver-result-table').value;
            
            if (!sourceSchema || !sourceTable || !resultTable) {
              alert('Please fill in all fields');
              return;
            }
            
            vscode.postMessage({
              command: 'generateSilver',
              sourceSchema,
              sourceTable,
              resultTable
            });
          }
          
          function generateGold() {
            const sourceSchema = document.getElementById('gold-source-schema').value;
            const sourceTable = document.getElementById('gold-source-table').value;
            const resultTable = document.getElementById('gold-result-table').value;
            
            if (!sourceSchema || !sourceTable || !resultTable) {
              alert('Please fill in all fields');
              return;
            }
            
            vscode.postMessage({
              command: 'generateGold',
              sourceSchema,
              sourceTable,
              resultTable
            });
          }
        </script>
      </body>
      </html>
    `;
    }
}
