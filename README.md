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

### Bronze Layer
- Configure PySpark ingestion from CSV, Parquet, database, or API sources
- Automatic metadata tracking (ingestion timestamp, source system)
- Generate ready-to-use PySpark scripts

### Silver Layer
- Generate DBT models for data quality and standardization
- Built-in placeholders for data quality checks
- Organized cleansing workflows

### Gold Layer
- Generate DBT models for business logic and analytics
- Reference Silver layer tables automatically
- Aggregation and transformation ready templates

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

### Configuring Bronze (Ingestion)

1. Select the **Bronze** tab
2. Enter source system name (e.g., ERP, CRM)
3. Choose source type: CSV, Parquet, Database, or API
4. Provide source path/connection string
5. Specify source and destination table names
6. Click "Generate Bronze Ingest Script"
7. Download the PySpark script and integrate into your pipeline

### Configuring Silver (DBT)

1. Select the **Silver** tab
2. Enter the source schema/database
3. Specify the source table name
4. Provide the result table name
5. Click "Generate Silver DBT Model"
6. Download the SQL file and add to your `models/silver/` directory

### Configuring Gold (DBT)

1. Select the **Gold** tab
2. Specify the Silver table to build from
3. Provide the result table name
4. Click "Generate Gold DBT Model"
5. Download the SQL file and add to your `models/gold/` directory

## Project Structure

```
configurator_dbt/
├── app.py                          # Main Streamlit application
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── templates/
│   ├── bronze_ingest.py.j2        # PySpark ingestion template
│   ├── silver.sql.j2              # Silver layer DBT template
│   └── gold.sql.j2                # Gold layer DBT template
└── utils/
    └── dbt_generator.py           # Template rendering logic
```

## Future Enhancements

- Column mapping and transformation specifications
- Data quality rule builder UI
- dbt documentation and test generation
- Direct integration with dbt Cloud/Core
- Advanced PySpark options (partitioning, bucketing, etc.)
- Support for incremental loads and CDC patterns