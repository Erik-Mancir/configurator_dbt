import * as vscode from 'vscode';
import { DbtProjectManager } from '../dbtProjectManager';
export declare class ConfiguratorPanel {
    static readonly viewType = "dbtConfiguratorView";
    private readonly _panel;
    private readonly _extensionUri;
    private _disposables;
    private currentLayer;
    private dbtProjectManager;
    static createOrShow(extensionUri: vscode.Uri, dbtProjectManager: DbtProjectManager): ConfiguratorPanel;
    private constructor();
    show(): void;
    reveal(): void;
    dispose(): void;
    showLayer(layer: string): void;
    updateProjectInfo(): void;
    private _handleMessage;
    private _generateBronze;
    private _generateSilver;
    private _generateGold;
    private _openFolderInExplorer;
    private _update;
    private _getHtmlForWebview;
}
