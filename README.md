# DBT Model Configurator - Medallion Architecture

A Streamlit app for configuring and generating ELT pipeline components across Bronze, Silver, and Gold layers using PySpark and DBT.

## Architecture

```
Bronze (Raw) ──PySpark───> Silver (Cleansed) ──DBT───> Gold (Analytics)
```

- **Bronze Layer**: Raw data ingestion using PySpark from various sources
- **Silver Layer**: Data cleansing, deduplication, and standardization using DBT
- **Gold Layer**: Business-ready analytics and aggregations using DBT

## Features

### DBT Project Integration
- **Direct Project Connection**: Connect to an existing dbt project and save generated files automatically
- **YAML File Management**: Automatically updates existing `sources.yml` and `schema.yml` files or creates them if they don't exist
- **Organized Structure**: Files are saved in appropriate `models/{layer}/` directories
- **Non-destructive Updates**: New sources and models are appended to existing YAML files without overwriting

### Bronze Layer
- Configure PySpark ingestion from CSV, Parquet, database, or API sources
- Automatic metadata tracking (ingestion timestamp, source system)
- Generate ready-to-use PySpark scripts

### Silver Layer
- Generate DBT models for data quality and standardization
- Built-in placeholders for data quality checks
- Organized cleansing workflows
- Automatic source and schema YAML generation

### Gold Layer
- Generate DBT models for business logic and analytics
- Reference Silver layer tables automatically
- Aggregation and transformation ready templates
- Schema YAML generation for documentation

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the app:
   ```
   streamlit run app.py
   ```

3. Open the provided URL in your browser (typically `http://localhost:8501`).

## Usage

### DBT Project Setup (Optional)
For direct integration with your dbt project:

1. In the sidebar, enter the path to your dbt project root (e.g., `/path/to/your/dbt/project`)
2. The app will validate that the path exists and contains a `dbt_project.yml` file
3. Generated files will be automatically saved to the appropriate directories

If no path is provided, files can be downloaded manually.

### Configuring Bronze (Ingestion)

1. Select the **Bronze** tab
2. Enter source system name (e.g., ERP, CRM)
3. Choose source type: CSV, Parquet, Database, or API
4. Provide source path/connection string
5. Specify source and destination table names
6. Click "Generate Bronze Ingest Script"
7. If dbt project path is set, script saves to `scripts/` directory; otherwise download manually

### Configuring Silver (DBT)

1. Select the **Silver** tab
2. Enter the source schema/database (e.g., bronze)
3. Specify the source table name (e.g., raw_customers)
4. Provide the result table name (e.g., customers_silver)
5. Click "Generate Silver DBT Model"
6. If dbt project path is set, files save to `models/silver/` directory:
   - `{result_table}.sql` - The DBT model
   - `sources.yml` - Updated with new source definitions
   - `schema.yml` - Updated with new model documentation
7. Otherwise, download the SQL, sources YAML, and schema YAML files manually

### Configuring Gold (DBT)

1. Select the **Gold** tab
2. Specify the Silver table to build from (e.g., customers_silver)
3. Provide the result table name (e.g., dim_customers)
4. Click "Generate Gold DBT Model"
5. If dbt project path is set, files save to `models/gold/` directory:
   - `{result_table}.sql` - The DBT model
   - `schema.yml` - Updated with new model documentation
6. Otherwise, download the SQL and schema YAML files manually

## Project Structure

```
configurator_dbt/
├── app.py                          # Main Streamlit application
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── templates/
│   ├── bronze_ingest.py.j2        # PySpark ingestion template
│   ├── silver.sql.j2              # Silver layer DBT template
│   ├── gold.sql.j2                # Gold layer DBT template
│   ├── sources.yml.j2             # DBT sources YAML template
│   └── schema.yml.j2              # DBT schema YAML template
└── utils/
    └── dbt_generator.py           # Template rendering and file saving logic
```

## Future Enhancements

- Column mapping and transformation specifications
- Data quality rule builder UI
- dbt documentation and test generation
- Advanced PySpark options (partitioning, bucketing, etc.)
- Integration with dbt Cloud/Core APIs
- Automated dbt run and test execution
- Support for incremental loads and CDC patterns