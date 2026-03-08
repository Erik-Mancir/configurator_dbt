import streamlit as st
from utils.dbt_generator import generate_dbt_model, generate_bronze_ingest

st.set_page_config(page_title="DBT Model Configurator", layout="wide")

st.title("🏗️ ELT Configurator - Medallion Architecture")

st.markdown("Configure your ELT pipeline with Bronze (ingestion), Silver (cleansing), and Gold (business logic) layers.")

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
            st.success("Silver Layer DBT Model Generated!")
            st.code(sql_content, language='sql')
            
            st.download_button(
                label="Download Silver SQL",
                data=sql_content,
                file_name=f"{result_table_silver}.sql",
                mime="text/plain",
                key="download_silver"
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
            st.success("Gold Layer DBT Model Generated!")
            st.code(sql_content, language='sql')
            
            st.download_button(
                label="Download Gold SQL",
                data=sql_content,
                file_name=f"{result_table_gold}.sql",
                mime="text/plain",
                key="download_gold"
            )
        else:
            st.error("Please fill in all Gold layer fields.")