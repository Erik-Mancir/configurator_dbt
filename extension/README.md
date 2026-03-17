# DBT Medallion Configurator - VS Code Extension

A VS Code extension for configuring and generating ELT pipeline components across Bronze, Silver, and Gold layers using dlt and DBT.

## Key Advantages Over Streamlit Version

### ✅ Superior Folder Selection
- **Native File Picker**: Browse and select your DBT project using VS Code's file picker instead of manually typing paths
- **Auto-Detection**: Automatically detects DBT projects in your workspace by looking for `dbt_project.yml`
- **Validation**: Instantly validates your project structure
- **Persistence**: Remembers your selected project across sessions

### ✅ Better Integration
- Works seamlessly within your existing VS Code workspace
- Generated files automatically appear in the File Explorer
- Direct editor integration - generated SQL/Python files open in the editor immediately
- No external server or browser tab needed

### ✅ Improved UX
- Sidebar panel for easy access
- Command palette integration (`Ctrl+Shift+P`)
- Keyboard shortcuts for quick access
- Real-time project information display

## Installation

### Prerequisites
- VS Code 1.85+
- Node.js 16+
- Python 3.8+ (for running the generation logic)
- Existing DBT project

### Build from Source

1. Clone the repository:
```bash
git clone <repo>
cd configurator_dbt/extension
```

2. Install dependencies:
```bash
npm install
```

3. Compile TypeScript:
```bash
npm run compile
```

4. Package the extension:
```bash
npm install -g @vscode/vsce
vsce package
```

5. Install the VSIX:
```bash
code --install-extension dbt-configurator-1.0.0.vsix
```

### Or: Install from Pre-built VSIX
Download the latest `.vsix` file and install via:
```bash
code --install-extension dbt-configurator-1.0.0.vsix
```

## Getting Started

### 1. Select Your DBT Project
- Run: `DBT Configurator: Select DBT Project Folder`
- Or press: `Ctrl+Shift+P` → Search "Select DBT Project"
- Choose your local DBT project directory

The extension will validate that `dbt_project.yml` exists.

### 2. Open the Configuration Panel
- Run: `DBT Configurator: Open Configuration Panel`
- Or use the sidebar icon 🏗️
- The panel shows your current project and allows layer configuration

### 3. Configure Layers

#### Bronze Layer (dlt Ingestion)
1. Click the **🥉 Bronze** tab
2. Fill in source details:
   - Source System (ERP, CRM, API, etc.)
   - Source Type (CSV, Parquet, JSON, Database, API)
   - Source Path (file path or connection string)
   - Source Table name (for databases)
   - Destination Table (Bronze layer name)
3. Click "Generate Bronze Pipeline"
4. Generated pipeline saves to: `bronze/pipelines/<table>_pipeline.py`

#### Silver Layer (DBT Cleansing)
1. Click the **🥈 Silver** tab
2. Fill in transformation details:
   - Source Schema (e.g., `bronze`)
   - Source Table (e.g., `raw_customers`)
   - Result Table Name (e.g., `customers_silver`)
3. Click "Generate Silver Model"
4. generates:
   - `models/silver/<table>.sql`
   - `models/silver/sources.yml`
   - `models/silver/schema.yml`

#### Gold Layer (DBT Analytics)
1. Click the **🥇 Gold** tab
2. Fill in analytics model details:
   - Source Schema (e.g., `silver`)
   - Source Table (e.g., `customers_silver`)
   - Result Table Name (e.g., `dim_customers`)
3. Click "Generate Gold Model"
4. Generates:
   - `models/gold/<table>.sql`
   - `models/gold/schema.yml`

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `dbtConfigurator.selectDbtProject` | - | Browse for DBT project folder |
| `dbtConfigurator.openBronzeConfigurator` | `Ctrl+Shift+Alt+B` (Windows/Linux)<br>`Cmd+Shift+Alt+B` (Mac) | Open Bronze layer configurator |
| `dbtConfigurator.openSilverConfigurator` | - | Open Silver layer configurator |
| `dbtConfigurator.openGoldConfigurator` | - | Open Gold layer configurator |
| `dbtConfigurator.showConfiguratorPanel` | - | Open main configuration panel |
| `dbtConfigurator.getCurrentProject` | - | Display currently selected project |

## Settings

Configure via VS Code Settings (`Ctrl+,`):

- **`dbtConfigurator.projectPath`**: Path to active DBT project
- **`dbtConfigurator.autoDetectProject`**: Auto-detect DBT projects in workspace (default: `true`)

## Architecture

```
VS Code Extension
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── dbtProjectManager.ts   # DBT project validation & file management
│   └── ui/
│       └── configuratorPanel.ts # Webview UI component
├── utils/
│   └── dbt_generator.py       # Python generation logic (from Streamlit app)
├── templates/                 # Jinja2 templates
│   ├── bronze_ingest.py.j2
│   ├── silver.sql.j2
│   ├── gold.sql.j2
│   ├── sources.yml.j2
│   └── schema.yml.j2
└── package.json              # Extension manifest
```

## How It Works

1. **Project Selection**: User selects DBT project via native file picker
2. **Validation**: Extension validates `dbt_project.yml` exists
3. **Configuration**: User fills form for Bronze/Silver/Gold layer
4. **Generation**: Python backend (Jinja2) renders templates with user input
5. **File Management**: Extension manages folder structure and YAML merging
6. **Preview**: Generated files open automatically in editor

## Features

### Layer Generation
- ✅ Bronze: PySpark ingestion scripts with metadata tracking
- ✅ Silver: Data quality models with tests and documentation
- ✅ Gold: Analytics models with aggregations

### File Management
- ✅ Auto-creates layer directories (`models/bronze`, `models/silver`, `models/gold`)
- ✅ Auto-creates `bronze/pipelines/` directory for dlt ingestion
- ✅ Smart YAML merging (appends to existing `sources.yml`/`schema.yml`)
- ✅ Non-destructive updates (never overwrites existing configurations)

### Project Intelligence
- ✅ Auto-detects DBT projects from workspace
- ✅ Shows project name and model counts by layer
- ✅ Validates project structure
- ✅ Persists selection across sessions

## Troubleshooting

### "Invalid DBT project: dbt_project.yml not found!"
- Make sure you selected the root directory of your DBT project
- DBT projects must contain `dbt_project.yml` at their root

### Generated files not appearing
- Check that the DBT project path is correct
- Ensure you have write permissions to the project directory
- The files should appear in the File Explorer after generation

### Module import errors
- Ensure Python dependencies are installed in the selected project
- Run `pip install -r requirements.txt` in your project root

### Extension not appearing in Commands palette
- Try reloading VS Code (`Ctrl+Shift+P` → "Reload Window")
- Verify extension is enabled: Check Extensions view

## Development

### Build Extension
```bash
npm run compile      # TypeScript → JavaScript
npm run esbuild      # Bundle with sourcemaps
npm run esbuild-watch # Watch mode
```

### Test in Development
Press `F5` to launch VS Code in extension debug mode.

### Package for Release
```bash
npm run vscode:prepublish  # Minify and build
vsce package              # Create VSIX file
```

## Python Backend Integration

The extension leverages the existing Python generation logic from the Streamlit app:

```python
# Call from TypeScript
const pythonModule = require('../../../utils/dbt_generator');
const sqlContent = pythonModule.generate_dbt_model(
  sourceSchema, sourceTable, resultTableName, layer
);
```

The Python module (`utils/dbt_generator.py`) handles:
- Jinja2 template rendering
- YAML generation and merging
- File operations
- Project structure validation

## Future Enhancements

- [ ] Syntax highlighting for generated SQL
- [ ] Template customization UI
- [ ] DBT test generation wizard
- [ ] Project initialization from template
- [ ] Integration with dbt Cloud API
- [ ] Linting and validation warnings
- [ ] Export/import configurations

## License

MIT

## Contributing

Contributions welcome! Please submit PRs or issues to the repository.

## See Also

- [Original Streamlit Configurator](../README.md)
- [ELT Architecture Guide](../ARCHITECTURE.md)
- [DBT Documentation](https://docs.getdbt.com)
- [VS Code Extension Development](https://code.visualstudio.com/api)
