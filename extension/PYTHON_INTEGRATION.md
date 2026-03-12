# Python Backend Integration

The VS Code Extension uses Python for template rendering while the TypeScript/JavaScript handles UI and file management.

## How Python Integration Works

### Architecture
```
TypeScript Code                 Python Code
┌─────────────────┐            ┌──────────────────────┐
│ extension.ts    │────────→   │ dbt_generator.py     │
│  (commands)     │   imports  │ (Jinja2 templates)   │
└─────────────────┘            └──────────────────────┘
         │                               │
         │                     ┌─────────┴──────────┐
         │                     ▼                    ▼
  ┌──────▼──────────┐   ┌──────────────┐   ┌─────────────┐
  │File System      │   │templates/    │   │utilities    │
  │Operations       │   │*.j2 files    │   │(yaml, etc)  │
  └─────────────────┘   └──────────────┘   └─────────────┘
```

### Implementation

#### 1. TypeScript Calls Python
```typescript
// In configuratorPanel.ts
const pythonModule = require('../../../utils/dbt_generator');

const sqlContent = pythonModule.generate_dbt_model(
  sourceSchema,
  sourceTable,
  resultTableName,
  'silver'
);
```

⚠️ **Note**: This uses `require()` which works in a Node.js context. In a proper extension build, you'd typically:
1. **Option A**: Pre-compile Python to JSON/YAML output
2. **Option B**: Call Python via subprocess
3. **Option C**: Rewrite generation logic in TypeScript (recommended long-term)

#### 2. Recommended: Use Subprocess (Better Isolation)

```typescript
import { execSync } from 'child_process';
import * as path from 'path';

function generateModelViaSubprocess(
  sourceSchema: string,
  sourceTable: string,
  resultTable: string,
  layer: string,
  pythonPath: string
): string {
  const scriptPath = path.join(__dirname, '..', '..', 'utils', 'dbt_generator.py');
  
  const command = `${pythonPath} -c "
import sys
sys.path.insert(0, '${path.dirname(scriptPath)}')
from dbt_generator import generate_dbt_model
result = generate_dbt_model('${sourceSchema}', '${sourceTable}', '${resultTable}', '${layer}')
print(result)
"`;

  try {
    const result = execSync(command, { encoding: 'utf-8' });
    return result;
  } catch (error) {
    throw new Error(`Python generation failed: ${error}`);
  }
}
```

#### 3. Long-term: TypeScript Port (Best)

Rewrite `dbt_generator.py` in TypeScript using `npm` packages:
- **Templating**: Use `nunjucks` or `eta` (Jinja2-compatible)
- **YAML**: Use `js-yaml`

```typescript
import { renderFileSync } from 'nunjucks';
import * as yaml from 'js-yaml';

function generateDbtModel(
  sourceSchema: string,
  sourceTable: string,
  resultTableName: string,
  layer: string
): string {
  const templatePath = path.join(__dirname, '..', '..', 'templates', `${layer}.sql.j2`);
  
  return renderFileSync(templatePath, {
    source_schema: sourceSchema,
    source_table: sourceTable,
    result_table_name: resultTableName
  });
}
```

## Dependencies

### Current Setup (Python)

The Python files are located in:
```
configurator_dbt/
├── utils/
│   ├── __init__.py
│   └── dbt_generator.py
├── templates/
│   ├── bronze_ingest.py.j2
│   ├── silver.sql.j2
│   ├── gold.sql.j2
│   ├── sources.yml.j2
│   └── schema.yml.j2
└── requirements.txt
```

**Requirements:**
- `jinja2` - Template rendering
- `pyyaml` - YAML parsing/writing

### When Using Subprocess

You need Python 3.8+ installed and in PATH/configured.

### When Using TypeScript Port

No Python needed! Add to `extension/package.json`:
```json
{
  "dependencies": {
    "nunjucks": "^3.2.4",
    "js-yaml": "^4.1.0"
  }
}
```

Then: `npm install`

## Configuration

### Option 1: Assume Python Available

Works if:
- User has Python installed
- User has `pip install -r requirements.txt` run in the project
- Python is in system PATH

### Option 2: Detect Python Path

```typescript
import { execSync } from 'child_process';

function getPythonPath(): string {
  try {
    // Try 'python3' first (Unix/Mac)
    execSync('python3 --version', { encoding: 'utf-8' });
    return 'python3';
  } catch (e1) {
    try {
      // Fall back to 'python' (Windows)
      execSync('python --version', { encoding: 'utf-8' });
      return 'python';
    } catch (e2) {
      throw new Error('Python not found. Please install Python 3.8+');
    }
  }
}
```

### Option 3: Bundle Python (Advanced)

Use PyInstaller to bundle Python with the extension (significantly increases VSIX size).

## Current Implementation (This Extension)

**Status**: Uses direct `require()` of Python module

**Limitations**:
- ✗ Requires Node.js to be able to import Python
- ✗ Not recommended for production
- ✗ Works for development/testing only

**Recommended Fix**:

Update `configuratorPanel.ts` to use subprocess:

```typescript
import { execSync } from 'child_process';

async function generateSilver(data: any): Promise<void> {
  // Instead of require(), call Python subprocess
  const pythonPath = 'python3'; // or detect based on system
  const command = `
import sys
sys.path.insert(0, '${projectPath}/utils')
from dbt_generator import generate_dbt_model, generate_sources_yml, generate_schema_yml
import json

sql = generate_dbt_model('${data.sourceSchema}', '${data.sourceTable}', '${data.resultTable}', 'silver')
sources = generate_sources_yml('${data.sourceSchema}', '${data.sourceTable}', '${data.resultTable}')
schema = generate_schema_yml('${data.resultTable}', 'silver')

print(json.dumps({
  'sql': sql,
  'sources': sources,
  'schema': schema
}))
`;

  try {
    const result = execSync(`${pythonPath} -c "${command.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    const parsed = JSON.parse(result);
    
    // Save files using parsed data
    const sqlPath = this.dbtProjectManager.saveModel('silver', data.resultTable, parsed.sql);
    this.dbtProjectManager.updateSourcesYml('silver', parsed.sources);
    this.dbtProjectManager.updateSchemaYml('silver', parsed.schema);
    
    vscode.window.showInformationMessage(`✅ Silver model created!`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating Silver layer: ${error}`);
  }
}
```

## File Structure for Development

```
extension/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── dbtProjectManager.ts      # Project management
│   └── ui/
│       └── configuratorPanel.ts  # UI + Python calls
├── out/                          # Compiled JavaScript (generated)
├── package.json                  # npm metadata
├── tsconfig.json                 # TypeScript config
└── README.md
```

## Testing Python Integration

```typescript
// Test script to verify Python availability
import { execSync } from 'child_process';

function testPythonAvailability(): void {
  try {
    const result = execSync('python3 -c "from jinja2 import Environment; print(\'OK\')"', {
      encoding: 'utf-8'
    });
    console.log('Python available:', result);
  } catch (error) {
    console.error('Python not available or Jinja2 not installed');
  }
}
```

## Migration Path

### Phase 1 (Current)
- Use Python via direct require (works for development)

### Phase 2 (Recommended)
- Use subprocess to call Python
- Add environment validation
- Better error handling

### Phase 3 (Future)
- Port generation logic to TypeScript
- Use `nunjucks` for templating
- Remove Python dependency
- Smaller VSIX file
- Faster execution

## See Also

- [Extension README](./README.md) - Full documentation
- [QUICKSTART](./QUICKSTART.md) - Getting started guide
- [Python Backend](../../utils/dbt_generator.py) - Jinja2 rendering logic
- [Jinja2 Docs](https://jinja.palletsprojects.com/)
- [VS Code Extension API](https://code.visualstudio.com/api)
