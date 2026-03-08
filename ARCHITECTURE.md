# ELT Pipeline Architecture - Medallion Approach

## Overview

This configurator implements the **Medallion Architecture** (also known as the Delta Lake architecture), which organizes data and transformations across three layers:

```
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                      │
│         (Databases, APIs, Files, Event Streams, etc.)         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ PySpark Ingestion
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ BRONZE LAYER (Raw Layer)                                     │
│ ├─ Raw data extracted as-is                                  │
│ ├─ Minimal transformation                                    │
│ ├─ Single source of truth for source data                    │
│ └─ Example: raw_customers, raw_orders                        │
│                                                              │
│ Technology: PySpark with ingestion metadata tracking         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ DBT Transformation
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ SILVER LAYER (Cleansed/Standardized Layer)                   │
│ ├─ Data quality checks and cleansing                         │
│ ├─ Deduplication                                             │
│ ├─ Standardized formats and naming conventions               │
│ ├─ Business logic-free transformations                       │
│ └─ Example: customers_silver, orders_silver                  │
│                                                              │
│ Technology: DBT with staging models and tests                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ DBT Transformation
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ GOLD LAYER (Mart/Analytics Layer)                            │
│ ├─ Business-ready aggregated data                            │
│ ├─ Complex business logic applied                            │
│ ├─ Optimized for reporting and BI tools                      │
│ └─ Example: dim_customers, fct_orders                        │
│                                                              │
│ Technology: DBT with mart models and documentation           │
└──────────────────────────────────────────────────────────────┘
        │
        │ Business Intelligence & Analytics
        ▼
   (Dashboards, Reports, ML Models, etc.)
```

## Layer Details

### Bronze Layer (Raw/Landing)

**Purpose**: Store raw, unprocessed data exactly as received from source systems.

**Characteristics**:
- Minimal to no transformation
- Preserves original data quality and structure
- Single point of truth for source data
- Includes ingestion metadata (timestamp, source system)
- Optimized for rapid ingestion

**PySpark Ingestion Template**:
```python
# The template supports multiple source types:
# - CSV files
# - Parquet files
# - Database connections (JDBC)
# - APIs (can be extended)

# Generated scripts automatically add:
# - _ingestion_timestamp: When data was loaded
# - _source_system: Which system it came from
```

### Silver Layer (Cleansed/Standardized)

**Purpose**: Clean and standardize data for downstream consumption.

**Characteristics**:
- Data quality validation
- Deduplication logic
- Schema standardization
- Business logic-free
- Conformed dimensions and facts
- Foundation for gold models

**DBT Transformations**:
- Reference Bronze layer tables as sources
- Include WHERE clauses for data quality checks
- Add business logic placeholders for teams to implement
- Support for dbt tests (uniqueness, not-null, relationships)

### Gold Layer (Business/Analytics)

**Purpose**: Provide business-ready data for analytics and BI tools.

**Characteristics**:
- Complex business logic applied
- Aggregations and calculations
- Optimized for readability and performance
- Conformed to business terminology
- Ready for reporting and analysis

**DBT Transformations**:
- Reference Silver layer models via `ref()`
- Aggregate and reshape data
- Create fact and dimension tables
- Include business-level documentation

## Data Governance

### Lineage Tracking
- DBT automatically maintains lineage through `source()` and `ref()` functions
- Clear dependency tracking from Bronze → Silver → Gold
- Lineage visible in dbt DAG

### Quality Assurance
- Bronze: Metadata tracking for data quality monitoring
- Silver: dbt tests for schema validation
- Gold: Business logic validation and documentation

### Naming Conventions

| Layer  | Table Pattern       | Example              | Purpose                      |
|--------|---------------------|----------------------|------------------------------|
| Bronze | `raw_[system]_[entity]` | `raw_erp_customers`  | Source-aligned naming        |
| Silver | `[entity]_silver`   | `customers_silver`   | Cleansed version             |
| Gold   | `dim_[entity]` / `fct_[entity]` | `dim_customers` / `fct_orders` | Business-ready designation |

## Integration Points

### With Existing DBT Project

1. **Project Structure**:
   ```
   your_dbt_project/
   ├── models/
   │   ├── bronze/
   │   │   └── (ingested via PySpark, not DBT models)
   │   ├── silver/
   │   │   ├── staging_*.sql (cleansing models)
   │   │   └── intermediate_*.sql (combinations)
   │   └── gold/
   │       ├── dim_*.sql (dimensions)
   │       └── fct_*.sql (facts)
   │   ├── sources.yml (source definitions)
   │   └── schema.yml (documentation)
   ```

2. **Sources Configuration**:
   ```yaml
   # sources.yml for Silver layer
   sources:
     - name: bronze
       database: bronze_db
       tables:
         - name: raw_customers
           columns:
             - name: id
               tests:
                 - unique
                 - not_null
   ```

3. **Incremental Models** (optional for large datasets):
   ```sql
   {{ config(
       materialized='incremental',
       unique_key='id'
   ) }}
   ```

## Execution Flow

### Initial Full Load

```
Source → PySpark (Bronze) → DBT Run:
  1. Execute Bronze ingestion script
  2. Run 'dbt run -s state:new' for Silver models
  3. Run Silver model tests 'dbt test -s tag:silver'
  4. Run 'dbt run -s tag:gold' for Gold models
  5. Generate documentation 'dbt docs generate'
```

### Incremental Updates

```
Source → PySpark (Bronze Upsert) → DBT Run:
  1. Execute Bronze ingestion with upsert logic
  2. Run 'dbt run -s state:modified' for affected models
  3. Cascading effects automatically handled by DBT DAG
```

## Next Steps

1. **Customize Templates**: Extend templates with business-specific logic
2. **Add Quality Rules**: Implement data quality checks in Silver
3. **Define Business Logic**: Build aggregations and calculations in Gold
4. **Set Up Testing**: Add dbt tests for each layer
5. **Document**: Use dbt YAML descriptions and tests as documentation
6. **Schedule**: Integrate with orchestration tools (Airflow, Databricks, etc.)