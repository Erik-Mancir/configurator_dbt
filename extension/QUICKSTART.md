# Quick Start: VS Code Extension

Get the DBT Configurator extension running in 5 minutes.

## Prerequisites

Check you have:
- ✅ VS Code 1.85+ (open VS Code, see version in Help → About)
- ✅ Node.js 16+ (`node --version`)
- ✅ npm 7+ (`npm --version`)
- ✅ Git

## Installation

### Option 1: Develop & Test Locally (Recommended for Testing)

1. **Clone and navigate**
```bash
cd configurator_dbt/extension
npm install
```

2. **Compile TypeScript**
```bash
npm run compile
```

3. **Launch debug mode** (automatic)
```bash
# Press F5 in VS Code to open extension dev host
```

This opens a new window with the extension running. Any changes you make will be reflected on reload.

### Option 2: Build VSIX & Install

1. **Build the VSIX package**
```bash
cd extension
npm install -g @vscode/vsce
npm run vscode:prepublish
vsce package
```

2. **Install the extension**
```bash
code --install-extension dbt-configurator-1.0.0.vsix
```

## First Run

1. **Open your DBT project** in VS Code as a folder (File → Open Folder)

2. **Open the Command Palette** (`Ctrl+Shift+P`)

3. **Search for "Select DBT Project"**
   - Type: `Select DBT`
   - Click: `DBT Configurator: Select DBT Project Folder`

4. **Browse to your `dbt_project` folder**
   - The extension validates `dbt_project.yml` exists
   - You'll see: ✅ DBT Project selected

5. **Open the configurator panel**
   - Click the 🏗️ icon in the Left Sidebar
   - Or: `Ctrl+Shift+P` → `Show Configurator Panel`

6. **Generate your first model**
   - Click **🥉 Bronze** tab
   - Fill in source details
   - Click **Generate Bronze Script**
   - File opens in editor✨

## Common Tasks

### Generate a Bronze Ingestion Script
```
1. Press Ctrl+Shift+Alt+B (or: Ctrl+Shift+P → Bronze)
2. Fill form:
   - Source System: ERP
   - Source Type: csv
   - Source Path: /data/customers.csv
   - Source Table: customers
   - Destination Table: raw_customers
3. Click Generate
```

### Generate a Silver Model
```
1. Ctrl+Shift+P → Silver
2. Fill form:
   - Source Schema: bronze
   - Source Table: raw_customers
   - Result Table: customers_silver
3. Click Generate
```

### Generate a Gold Model
```
1. Ctrl+Shift+P → Gold
2. Fill form:
   - Source Schema: silver
   - Source Table: customers_silver
   - Result Table: dim_customers
3. Click Generate
```

## Check Your Project

After generating, files appear in:
- **Bronze pipelines**: `bronze/pipelines/*_pipeline.py`
- **Silver models**: `models/silver/*.sql` + YAML
- **Gold models**: `models/gold/*.sql` + YAML

All visible in VS Code's File Explorer on the left.

## Troubleshooting

### Extension doesn't appear
- **Solution**: Reload VS Code (`Ctrl+Shift+P` → Reload Window)

### "Invalid DBT project" error
- **Solution**: Make sure you selected the folder containing `dbt_project.yml`
- Check: That folder should have `models/`, `dbt_project.yml`, etc.

### Generated files not showing
- **Solution**: Refresh File Explorer (press F5 or click refresh icon)
- Check: Your project folder has write permissions

### Command palette doesn't show commands
- **Solution**: Reload window or restart VS Code
- Check: Extension is enabled (Extensions view)

## Next Steps

1. **Generate your first model** (see tasks above)
2. **Edit generated files** directly in VS Code
3. **Run dbt**: `dbt compile` in integrated terminal
4. **Customize templates** if needed (in parent `templates/` folder)

## Need Help?

Error message | Solution
---|---
"No DBT project selected" | Run "Select DBT Project" command
"Path exists but doesn't appear to be a dbt project" | Ensure `dbt_project.yml` exists
"Module not found" when running generated scripts | Install dependencies: `pip install -r requirements.txt`
Files won't generate | Check write permissions to project directory

## Tips & Tricks

- ⚡ **Keyboard Shortcut**: Bronze layer has `Ctrl+Shift+Alt+B` shortcut
- 💾 **Auto-Save**: Generated SQL/Python files open in editor automatically
- 🔄  **Persistence**: Selected project remembered across sessions
- 📝 **YAML Merge**: Sources/schemas automatically merge with existing files
- 🎯 **Quick Switch**: Use tabs to switch between Bronze/Silver/Gold

## Architecture

```
Your VS Code Window
  ├─ DBT Configurator Panel (Sidebar 🏗️)
  │  ├─ Project selector
  │  └─ Layer tabs (Bronze/Silver/Gold)
  └─ File Explorer
     └─ Your DBT Project
        ├─ bronze/pipelines/
        ├─ models/silver/
        ├─ models/gold/
        └─ dbt_project.yml
```

## What Gets Generated

### Bronze Layer
```python
# Generated dlt pipeline
import dlt
from dlt.destinations import bigquery
import pandas as pd
from datetime import datetime

pipeline = dlt.pipeline(
    pipeline_name="bronze_pipeline",
    destination=bigquery(),
    dataset_name="bronze"
)

@dlt.resource(name="raw_customers", write_disposition="replace")
def load_customers():
    # Load from CSV
    df = pd.read_csv("/data/customers.csv")
    df["_ingestion_timestamp"] = datetime.utcnow()
    df["_source_system"] = "ERP"
    yield df

pipeline.run(load_customers())
```

### Silver Layer
```sql
-- Generated DBT model
{{ config(materialized='incremental') }}

with source_data as (
    select * from {{ source('bronze', 'raw_customers') }}
    where _valid_record = true
),
cleaned as (
    -- Add your cleaning logic here
)
select * from cleaned
```

### Gold Layer
```sql
-- Generated DBT analytics model
{{ config(materialized='table') }}

select
    customer_id,
    customer_name,
    -- Add your business logic here
from {{ ref('customers_silver') }}
```

## Development

### Modify UI
Edit: `extension/src/ui/configuratorPanel.ts`
- Change form fields
- Update styling (CSS in HTML template)
- Modify validation

### Modify Project Management Logic
Edit: `extension/src/dbtProjectManager.ts`
- Add new file operations
- Change validation rules
- Customize YAML merging

### Modify Command Handlers
Edit: `extension/src/extension.ts`
- Add new commands
- Change keybindings
- Modify activation logic

After changes: `npm run compile` and reload (Ctrl+R in debug window)

## Publishing

To publish to VS Code Marketplace:

```bash
# Create publisher account at https://marketplace.visualstudio.com
vsce publish patch  # Bumps version: 1.0.0 → 1.0.1

vsce publish minor  # Bumps version: 1.0.0 → 1.1.0

vsce publish major  # Bumps version: 1.0.0 → 2.0.0
```

## More Info

- 📖 [Full Extension README](./README.md)
- 🔄 [Migration Guide from Streamlit](../EXTENSION_MIGRATION.md)
- 🏗️ [Architecture Overview](../ARCHITECTURE.md)
- 🚀 [VS Code Extension API](https://code.visualstudio.com/api)
