import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DbtProjectManager } from './dbtProjectManager';
import { ConfiguratorPanel } from './ui/configuratorPanel';

let dbtProjectManager: DbtProjectManager;
let configuratorPanel: ConfiguratorPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('DBT Configurator Extension activated!');

    // Initialize project manager
    dbtProjectManager = new DbtProjectManager(context);

    // Auto-detect project on activation
    dbtProjectManager.autoDetectProject();

    // Command: Select DBT Project Folder
    let selectProjectCmd = vscode.commands.registerCommand(
        'dbtConfigurator.selectDbtProject',
        async () => {
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
                    vscode.window.showInformationMessage(
                        `✅ DBT Project selected: ${path.basename(folderPath)}`
                    );

                    // Refresh UI if panel is open
                    if (configuratorPanel) {
                        configuratorPanel.updateProjectInfo();
                    }
                } else {
                    vscode.window.showErrorMessage(
                        'Invalid DBT project: dbt_project.yml not found!'
                    );
                }
            }
        }
    );

    // Command: Open Main ConfiguratorPanel
    let openPanelCmd = vscode.commands.registerCommand(
        'dbtConfigurator.showConfiguratorPanel',
        async () => {
            if (!configuratorPanel) {
                configuratorPanel = new ConfiguratorPanel(context, dbtProjectManager);
                configuratorPanel.show();
            } else {
                configuratorPanel.reveal();
            }
        }
    );

    // Command: Open Bronze Configurator
    let bronzeCmd = vscode.commands.registerCommand(
        'dbtConfigurator.openBronzeConfigurator',
        async () => {
            if (!dbtProjectManager.getProjectPath()) {
                const result = await vscode.window.showWarningMessage(
                    'No DBT project selected. Select one now?',
                    'Select Project'
                );
                if (result === 'Select Project') {
                    vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
                }
                return;
            }

            if (!configuratorPanel) {
                configuratorPanel = new ConfiguratorPanel(context, dbtProjectManager);
                configuratorPanel.show();
            }
            configuratorPanel.showLayer('bronze');
        }
    );

    // Command: Open Silver Configurator
    let silverCmd = vscode.commands.registerCommand(
        'dbtConfigurator.openSilverConfigurator',
        async () => {
            if (!dbtProjectManager.getProjectPath()) {
                const result = await vscode.window.showWarningMessage(
                    'No DBT project selected. Select one now?',
                    'Select Project'
                );
                if (result === 'Select Project') {
                    vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
                }
                return;
            }

            if (!configuratorPanel) {
                configuratorPanel = new ConfiguratorPanel(context, dbtProjectManager);
                configuratorPanel.show();
            }
            configuratorPanel.showLayer('silver');
        }
    );

    // Command: Open Gold Configurator
    let goldCmd = vscode.commands.registerCommand(
        'dbtConfigurator.openGoldConfigurator',
        async () => {
            if (!dbtProjectManager.getProjectPath()) {
                const result = await vscode.window.showWarningMessage(
                    'No DBT project selected. Select one now?',
                    'Select Project'
                );
                if (result === 'Select Project') {
                    vscode.commands.executeCommand('dbtConfigurator.selectDbtProject');
                }
                return;
            }

            if (!configuratorPanel) {
                configuratorPanel = new ConfiguratorPanel(context, dbtProjectManager);
                configuratorPanel.show();
            }
            configuratorPanel.showLayer('gold');
        }
    );

    // Command: Show current project
    let showProjectCmd = vscode.commands.registerCommand(
        'dbtConfigurator.getCurrentProject',
        () => {
            const projectPath = dbtProjectManager.getProjectPath();
            if (projectPath) {
                vscode.window.showInformationMessage(
                    `Current DBT Project: ${projectPath}`
                );
            } else {
                vscode.window.showInformationMessage('No DBT project selected');
            }
        }
    );

    context.subscriptions.push(
        selectProjectCmd,
        openPanelCmd,
        bronzeCmd,
        silverCmd,
        goldCmd,
        showProjectCmd
    );
}

export function deactivate() {
    if (configuratorPanel) {
        configuratorPanel.dispose();
    }
}
