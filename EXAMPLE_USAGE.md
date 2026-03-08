# Example Configuration - E-Commerce Data Pipeline

## Scenario

We're building an ELT pipeline for an e-commerce platform with customer and order data from multiple sources.

## Bronze Layer - Ingestion Configuration

### Source 1: Customer System (CSV)

```
Source System: CRM
Source Type: csv
Source Path: /data/sources/crm_customers.csv
Source Table: customers
Destination Table: raw_crm_customers
```

Generated PySpark Script: `ingest_raw_crm_customers.py`
- Reads from CSV with inferred schema
- Adds ingestion timestamp and source system metadata
- Writes to `bronze.raw_crm_customers`

### Source 2: ERP System (Database)

```
Source System: ERP
Source Type: database
Source Path: jdbc:sqlserver://erp-server:1433;database=orders
Source Table: orders
Destination Table: raw_erp_orders
```

Generated PySpark Script: `ingest_raw_erp_orders.py`
- Connects via JDBC to ERP database
- Pulls all new orders
- Writes to `bronze.raw_erp_orders`

## Silver Layer - Cleansing & Standardization

### Silver Model 1: Customers

```
Source Schema: bronze
Source Table: raw_crm_customers
Result Table Name: customers_silver
```

Generated SQL: `customers_silver.sql`
```sql
-- Cleansing logic applied:
-- - Deduplication on customer ID
-- - Remove null emails
-- - Standardize country codes
-- - Convert date formats
```

### Silver Model 2: Orders

```
Source Schema: bronze
Source Table: raw_erp_orders
Result Table Name: orders_silver
```

Generated SQL: `orders_silver.sql`
```sql
-- Cleansing logic applied:
-- - Remove cancelled orders
-- - Validate order amounts > 0
-- - Standardize currency
-- - Calculate order age
```

## Gold Layer - Business Analytics

### Gold Model 1: Customer Dimension

```
Source Table (Silver): customers_silver
Result Table Name: dim_customers
```

Generated SQL: `dim_customers.sql`
```sql
-- Business logic applied:
-- - Customer segmentation
-- - Lifetime value calculation
-- - Risk scoring
-- - Business-friendly naming
```

### Gold Model 2: Orders Fact Table

```
Source Table (Silver): orders_silver
Result Table Name: fct_orders
```

Generated SQL: `fct_orders.sql`
```sql
-- Analytics logic applied:
-- - Daily order aggregations
-- - Product category mapping
-- - Revenue calculations
-- - Dimensional joins
```

### Gold Model 3: Customer Metrics

```
Source Table (Silver): customers_silver + orders_silver
Result Table Name: mart_customer_metrics
```

```sql
-- Complex aggregations:
-- - Orders per customer
-- - Average order value
-- - Customer acquisition date
-- - Last purchase date
```

## Directory Structure After Generation

```
your_dbt_project/
├── models/
│   ├── bronze/
│   │   └── sources.yml (reference Bronze tables)
│   │
│   ├── silver/
│   │   ├── customers_silver.sql
│   │   ├── orders_silver.sql
│   │   └── silver.yml (tests & descriptions)
│   │
│   └── gold/
│       ├── dim_customers.sql
│       ├── fct_orders.sql
│       ├── mart_customer_metrics.sql
│       └── gold.yml (documentation)
│
└── scripts/
    ├── ingest_raw_crm_customers.py
    └── ingest_raw_erp_orders.py
```

## Execution Sequence

### Day 1: Initial Load

```bash
# 1. Ingest Bronze data
python scripts/ingest_raw_crm_customers.py
python scripts/ingest_raw_erp_orders.py

# 2. Build Silver layer
dbt run -s tag:silver
dbt test -s tag:silver

# 3. Build Gold layer
dbt run -s tag:gold
dbt docs generate
```

### Daily Runs (After Day 1)

```bash
# 1. Incremental Bronze updates
python scripts/ingest_raw_crm_customers.py  # upserts new/changed records
python scripts/ingest_raw_erp_orders.py     # adds new orders

# 2. Rebuild affected models
dbt run
dbt test

# 3. Fresh documentation
dbt docs generate
```

## Configuration in sources.yml

```yaml
sources:
  - name: bronze
    schema: bronze
    tables:
      - name: raw_crm_customers
        description: "Raw customer data from CRM system"
        columns:
          - name: customer_id
            description: "Unique customer identifier"
            tests:
              - unique
              - not_null
          - name: email
            tests:
              - not_null
      
      - name: raw_erp_orders
        description: "Raw order data from ERP system"
        columns:
          - name: order_id
            tests:
              - unique
              - not_null
          - name: order_amount
            tests:
              - not_null
```

## Expected Results

After running through all three layers, you'll have:

- ✅ `bronze.raw_crm_customers` - 100K raw customer records
- ✅ `bronze.raw_erp_orders` - 500K raw order records
- ✅ `silver.customers_silver` - 98K deduplicated customers
- ✅ `silver.orders_silver` - 495K valid orders
- ✅ `gold.dim_customers` - 98K customer dimension
- ✅ `gold.fct_orders` - 495K order facts
- ✅ `gold.mart_customer_metrics` - Customer metrics table

All with proper lineage tracking, documentation, and data quality assurance!