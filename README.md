# DBT Medallion Configurator - VS Code Extension

A VS Code extension for configuring and generating ELT pipeline components across Bronze, Silver, and Gold layers using dlt and DBT.

## Medallion Architecture

```
Bronze (Raw) ──dlt───> Silver (Cleansed) ──DBT───> Gold (Analytics)
```

- **Bronze Layer**: Raw data ingestion using dlt from various sources into BigQuery
- **Silver Layer**: Data cleansing, deduplication, and standardization using DBT
- **Gold Layer**: Business-ready analytics and aggregations using DBT

## Features

### Project Management
- **Auto-Detection**: Automatically detects DBT projects in your workspace
- **File Picker**: Browse and select your DBT project (no manual path entry)
- **Project Validation**: Instantly validates `dbt_project.yml` structure
- **Persistent Context**: Remembers your selected project across sessions

### File Generation
- **Direct File Creation**: Generated files save directly to your project
- **Smart YAML Merging**: Automatically updates `sources.yml` and `schema.yml` without overwriting
- **Layer Organization**: Files saved in appropriate `models/{layer}/` directories
- **Auto-Open**: Generated files open in editor for immediate review

### Bronze Layer
- Configure dlt ingestion from CSV, Parquet, JSON, database (e.g., MSSQL), or API sources into BigQuery
- Automatic metadata tracking (ingestion timestamp, source system)
- Generate ready-to-use dlt pipelines to `bronze/pipelines/` directory

### Silver Layer
- Generate DBT models for data quality and standardization
- Built-in placeholders for data quality checks
- Automatic source and schema YAML generation
- Organized cleansing workflows

### Gold Layer
- Generate DBT models for business logic and analytics
- Reference Silver layer tables automatically
- Aggregation and transformation ready templates
- Schema YAML generation for documentation

## Quick Start

1. **Install the extension**
   ```bash
   cd extension
   npm install
   npm run compile
   ```

2. **Open in VS Code** with your DBT project as a workspace folder

3. **Open the extension**: Click 🏗️ in the sidebar or use `Ctrl+Shift+P`

4. **Select your DBT project**: Command Palette → "Select DBT Project"

5. **Generate models**: Fill the form for Bronze/Silver/Gold layer and click Generate

## Commands

- `DBT Configurator: Select DBT Project Folder` - Browse for your DBT project
- `DBT Configurator: Configure Bronze Layer` - Open Bronze ingestion form (Ctrl+Shift+Alt+B)
- `DBT Configurator: Configure Silver Layer` - Open Silver cleansing form
- `DBT Configurator: Configure Gold Layer` - Open Gold analytics form
- `DBT Configurator: Open Configuration Panel` - Show main panel
- `DBT Configurator: Show Current Project` - Display selected project

## Project Structure

```
configurator_dbt/
├── extension/                      # VS Code extension
│   ├── src/
│   │   ├── extension.ts           # Main entry point
│   │   ├── dbtProjectManager.ts   # Project management
│   │   └── ui/
│   │       └── configuratorPanel.ts # Webview UI
│   ├── package.json               # Extension manifest
│   ├── tsconfig.json              # TypeScript config
│   └── README.md                  # Extension documentation
├── utils/
│   └── dbt_generator.py           # Template rendering logic
├── templates/
│   ├── bronze_ingest.py.j2        # dlt ingestion template
│   ├── silver.sql.j2              # Silver layer DBT template
│   ├── gold.sql.j2                # Gold layer DBT template
│   ├── sources.yml.j2             # DBT sources YAML template
│   └── schema.yml.j2              # DBT schema YAML template
├── requirements.txt               # Python dependencies
└── ARCHITECTURE.md                # Medallion architecture overview
```

## Documentation

- **[extension/README.md](./extension/README.md)** - Complete extension documentation
- **[extension/QUICKSTART.md](./extension/QUICKSTART.md)** - 5-minute setup guide
- **[extension/PYTHON_INTEGRATION.md](./extension/PYTHON_INTEGRATION.md)** - Python backend details
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Medallion architecture overview

## Requirements

- VS Code 1.85+
- Node.js 16+ (for building the extension)
- Python 3.8+ (for template rendering)
- Existing DBT project

## Future Enhancements

- Syntax highlighting for generated SQL
- Template customization UI
- DBT test generation helper
- Project initialization from template
- Integration with dbt Cloud API
- Linting and validation warnings