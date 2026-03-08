from jinja2 import Environment, FileSystemLoader
import os

def generate_dbt_model(source_schema, source_table, result_table_name, layer='silver'):
    """
    Generate a dbt model SQL file based on the provided parameters and layer.

    Args:
        source_schema (str): The schema of the source table.
        source_table (str): The name of the source table.
        result_table_name (str): The name of the resulting table/model.
        layer (str): The medallion architecture layer - 'silver' or 'gold'.

    Returns:
        str: The generated SQL content.
    """
    # Set up Jinja2 environment
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    
    # Select template based on layer
    if layer.lower() == 'silver':
        template = env.get_template('silver.sql.j2')
    elif layer.lower() == 'gold':
        template = env.get_template('gold.sql.j2')
    else:
        raise ValueError(f"Unsupported layer: {layer}. Choose 'silver' or 'gold'.")

    # Render the template
    sql_content = template.render(
        source_schema=source_schema,
        source_table=source_table,
        result_table_name=result_table_name
    )

    return sql_content

def generate_bronze_ingest(source_system, source_type, source_path, source_table, destination_table):
    """
    Generate a PySpark ingestion script for Bronze layer.

    Args:
        source_system (str): Name of the source system (e.g., 'ERP', 'CRM').
        source_type (str): Type of source ('csv', 'parquet', 'database').
        source_path (str): Path or connection string to the source.
        source_table (str): Name of the source table.
        destination_table (str): Name of the destination table in Bronze.

    Returns:
        str: The generated PySpark ingestion script.
    """
    # Set up Jinja2 environment
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('bronze_ingest.py.j2')

    # Render the template
    script_content = template.render(
        source_system=source_system,
        source_type=source_type,
        source_path=source_path,
        source_table=source_table,
        destination_table=destination_table
    )

    return script_content

def save_generated_file(content, file_path):
    """
    Save the generated content to a file.

    Args:
        content (str): The content to save.
        file_path (str): The path where to save the file.
    """
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as f:
        f.write(content)