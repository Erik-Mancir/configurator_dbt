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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const dbtProjectManager_1 = require("./dbtProjectManager");
const configuratorPanel_1 = require("./ui/configuratorPanel");
let dbtProjectManager;
let configuratorPanel;
function activate(context) {
    console.log('DBT Configurator Extension activated!');
    // Initialize project manager
    dbtProjectManager = new dbtProjectManager_1.DbtProjectManager(context);
    // Auto-detect project on activation
    dbtProjectManager.autoDetectProject();
    // Command: Select DBT Project Folder
    let selectProjectCmd = vscode.commands.registerCommand('dbtConfigurator.selectDbtProject', async () => {
        const selectedFolder = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            title: 'Select DBT Project Folder',
        });
        if (selectedFolder && selectedFolder.length > 0) {
            const folderPath = selectedFolder[0].fsPath;
            const isValid = dbtProjectManager.validateDbtProject(folderPath);
            if (isValid) {
                await dbtProjectManager.setProjectPath(folderPath);
                vscode.window.showInformationMessage(`✅ DBT Project selected: ${path.basename(folderPath)}`);
                // Refresh UI if panel is open
                if (configuratorPanel) {
                    configuratorPanel.updateProjectInfo();
                }
            }
            else {
                vscode.window.showErrorMessage('Invalid DBT project: dbt_project.yml not found!');
            }
        }
    });
    // Command: Open Main ConfiguratorPanel
    let openPanelCmd = vscode.commands.registerCommand('dbtConfigurator.showConfiguratorPanel', async () => {
        if (!configuratorPanel) {
            configuratorPanel = configuratorPanel_1.ConfiguratorPanel.createOrShow(context.extensionUri, dbtProjectManager);
        }
        else {
            configuratorPanel.reveal();
        }
    });
    // Command: Open Bronze Configurator
    let bronzeCmd = vscode.commands.registerCommand('dbtConfigurator.openBronzeConfigurator', async () => {
        if (!dbtProjectManager.getProjectPath()) {
            const result = await vscode.window.showWarningMessage('No DBT project selected. Select one now?', 'Select Project');
            if (result === 'Select Project') {
                vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
            }
            return;
        }
        const panel = configuratorPanel ??
            configuratorPanel_1.ConfiguratorPanel.createOrShow(context.extensionUri, dbtProjectManager);
        configuratorPanel = panel;
        panel.showLayer('bronze');
    });
    // Command: Open Silver Configurator
    let silverCmd = vscode.commands.registerCommand('dbtConfigurator.openSilverConfigurator', async () => {
        if (!dbtProjectManager.getProjectPath()) {
            const result = await vscode.window.showWarningMessage('No DBT project selected. Select one now?', 'Select Project');
            if (result === 'Select Project') {
                vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
            }
            return;
        }
        const panel = configuratorPanel ??
            configuratorPanel_1.ConfiguratorPanel.createOrShow(context.extensionUri, dbtProjectManager);
        configuratorPanel = panel;
        panel.showLayer('silver');
    });
    // Command: Open Gold Configurator
    let goldCmd = vscode.commands.registerCommand('dbtConfigurator.openGoldConfigurator', async () => {
        if (!dbtProjectManager.getProjectPath()) {
            const result = await vscode.window.showWarningMessage('No DBT project selected. Select one now?', 'Select Project');
            if (result === 'Select Project') {
                vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
            }
            return;
        }
        const panel = configuratorPanel ??
            configuratorPanel_1.ConfiguratorPanel.createOrShow(context.extensionUri, dbtProjectManager);
        configuratorPanel = panel;
        panel.showLayer('gold');
    });
    // Command: Show current project
    let showProjectCmd = vscode.commands.registerCommand('dbtConfigurator.getCurrentProject', () => {
        const projectPath = dbtProjectManager.getProjectPath();
        if (projectPath) {
            vscode.window.showInformationMessage(`Current DBT Project: ${projectPath}`);
        }
        else {
            vscode.window.showInformationMessage('No DBT project selected');
        }
    });
    context.subscriptions.push(selectProjectCmd, openPanelCmd, bronzeCmd, silverCmd, goldCmd, showProjectCmd);
}
function deactivate() {
    if (configuratorPanel) {
        configuratorPanel.dispose();
    }
}
//# sourceMappingURL=extension.js.map