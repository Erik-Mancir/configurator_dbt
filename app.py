import streamlit as st
from utils.dbt_generator import (
    generate_dbt_model, 
    generate_bronze_ingest, 
    generate_sources_yml, 
    generate_schema_yml, 
    save_to_dbt_project
)
import os

st.set_page_config(page_title="DBT Model Configurator", layout="wide")

st.title("🏗️ ELT Configurator - Medallion Architecture")

st.markdown("Configure your ELT pipeline with Bronze (ingestion), Silver (cleansing), and Gold (business logic) layers.")

# DBT Project Configuration
st.sidebar.header("DBT Project Settings")
dbt_project_path = st.sidebar.text_input(
    "DBT Project Path", 
    placeholder="e.g., /path/to/your/dbt/project",
    help="Optional: Path to your dbt project root. If provided, files will be saved directly to the project."
)

if dbt_project_path and not os.path.exists(dbt_project_path):
    st.sidebar.error("DBT project path does not exist!")
elif dbt_project_path and not os.path.exists(os.path.join(dbt_project_path, 'dbt_project.yml')):
    st.sidebar.warning("Path exists but doesn't appear to be a dbt project (no dbt_project.yml found).")

# Main tabs for different layers
tab1, tab2, tab3 = st.tabs(["🥉 Bronze (Ingestion)", "🥈 Silver (DBT)", "🥇 Gold (DBT)"])

# ============= BRONZE TAB =============
with tab1:
    st.header("Bronze Layer - Data Ingestion with PySpark")
    st.markdown("Configure PySpark ingestion from various data sources.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        source_system = st.text_input("Source System", placeholder="e.g., ERP, CRM, API", key="bronze_source_sys")
        source_type = st.selectbox("Source Type", ["csv", "parquet", "database", "api"], key="bronze_source_type")
    
    with col2:
        source_path = st.text_input("Source Path/Connection", placeholder="e.g., /data/source.csv or jdbc://...", key="bronze_path")
        source_table = st.text_input("Source Table", placeholder="e.g., customers", key="bronze_source_table")
    
    destination_table_bronze = st.text_input("Destination Table (Bronze)", placeholder="e.g., raw_customers", key="bronze_dest_table")
    
    if st.button("Generate Bronze Ingest Script", key="btn_bronze"):
        if all([source_system, source_type, source_path, source_table, destination_table_bronze]):
            script_content = generate_bronze_ingest(source_system, source_type, source_path, source_table, destination_table_bronze)
            st.success("PySpark Ingestion Script Generated!")
            st.code(script_content, language='python')
            
            if dbt_project_path:
                scripts_dir = os.path.join(dbt_project_path, 'scripts')
                script_path = os.path.join(scripts_dir, f"ingest_{destination_table_bronze}.py")
                from utils.dbt_generator import save_generated_file
                save_generated_file(script_content, script_path)
                st.info(f"Script saved to: {script_path}")
            else:
                st.download_button(
                    label="Download PySpark Script",
                    data=script_content,
                    file_name=f"ingest_{destination_table_bronze}.py",
                    mime="text/plain",
                    key="download_bronze"
                )
        else:
            st.error("Please fill in all Bronze layer fields.")

# ============= SILVER TAB =============
with tab2:
    st.header("Silver Layer - Data Cleansing & Standardization (DBT)")
    st.markdown("Generate DBT models for data quality and standardization.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        source_schema_silver = st.text_input("Source Schema", placeholder="e.g., bronze", key="silver_schema")
        source_table_silver = st.text_input("Source Table", placeholder="e.g., raw_customers", key="silver_source_table")
    
    with col2:
        result_table_silver = st.text_input("Result Table Name", placeholder="e.g., customers_silver", key="silver_result_table")
    
    if st.button("Generate Silver DBT Model", key="btn_silver"):
        if all([source_schema_silver, source_table_silver, result_table_silver]):
            sql_content = generate_dbt_model(source_schema_silver, source_table_silver, result_table_silver, layer='silver')
            sources_yml = generate_sources_yml(source_schema_silver, source_table_silver, result_table_silver)
            schema_yml = generate_schema_yml(result_table_silver, 'silver')
            
            st.success("Silver Layer DBT Model Generated!")
            st.code(sql_content, language='sql')
            
            if dbt_project_path:
                save_to_dbt_project(dbt_project_path, 'silver', sql_content, result_table_silver, sources_yml, schema_yml)
                st.info(f"Files saved to dbt project: models/silver/{result_table_silver}.sql, sources.yml updated, schema.yml updated")
            else:
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.download_button(
                        label="Download Silver SQL",
                        data=sql_content,
                        file_name=f"{result_table_silver}.sql",
                        mime="text/plain",
                        key="download_silver_sql"
                    )
                with col2:
                    st.download_button(
                        label="Download Sources YAML",
                        data=sources_yml,
                        file_name="sources.yml",
                        mime="text/plain",
                        key="download_silver_sources"
                    )
                with col3:
                    st.download_button(
                        label="Download Schema YAML",
                        data=schema_yml,
                        file_name=f"{result_table_silver}.yml",
                        mime="text/plain",
                        key="download_silver_schema"
                    )
        else:
            st.error("Please fill in all Silver layer fields.")

# ============= GOLD TAB =============
with tab3:
    st.header("Gold Layer - Business Analytics (DBT)")
    st.markdown("Generate DBT models for business-ready analytics.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        source_table_gold = st.text_input("Source Table (Silver)", placeholder="e.g., customers_silver", key="gold_source_table")
    
    with col2:
        result_table_gold = st.text_input("Result Table Name", placeholder="e.g., dim_customers", key="gold_result_table")
    
    if st.button("Generate Gold DBT Model", key="btn_gold"):
        if source_table_gold and result_table_gold:
            sql_content = generate_dbt_model('silver', source_table_gold, result_table_gold, layer='gold')
            schema_yml = generate_schema_yml(result_table_gold, 'gold')
            
            st.success("Gold Layer DBT Model Generated!")
            st.code(sql_content, language='sql')
            
            if dbt_project_path:
                save_to_dbt_project(dbt_project_path, 'gold', sql_content, result_table_gold, None, schema_yml)
                st.info(f"Files saved to dbt project: models/gold/{result_table_gold}.sql, schema.yml updated")
            else:
                col1, col2 = st.columns(2)
                with col1:
                    st.download_button(
                        label="Download Gold SQL",
                        data=sql_content,
                        file_name=f"{result_table_gold}.sql",
                        mime="text/plain",
                        key="download_gold_sql"
                    )
                with col2:
                    st.download_button(
                        label="Download Schema YAML",
                        data=schema_yml,
                        file_name=f"{result_table_gold}.yml",
                        mime="text/plain",
                        key="download_gold_schema"
                    )
        else:
            st.error("Please fill in all Gold layer fields.")