from jinja2 import Environment, FileSystemLoader
import os
import yaml

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

def generate_sources_yml(source_schema, source_table, result_table_name, database=None):
    """
    Generate a sources.yml file for dbt.

    Args:
        source_schema (str): The schema of the source.
        source_table (str): The name of the source table.
        result_table_name (str): The name of the resulting model.
        database (str): The database name (optional).

    Returns:
        str: The generated YAML content.
    """
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('sources.yml.j2')

    yaml_content = template.render(
        source_schema=source_schema,
        source_table=source_table,
        result_table_name=result_table_name,
        database=database
    )

    return yaml_content

def generate_schema_yml(result_table_name, layer):
    """
    Generate a schema.yml file for dbt model documentation.

    Args:
        result_table_name (str): The name of the model.
        layer (str): The layer ('silver' or 'gold').

    Returns:
        str: The generated YAML content.
    """
    template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('schema.yml.j2')

    yaml_content = template.render(
        result_table_name=result_table_name,
        layer=layer
    )

    return yaml_content

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

def save_to_dbt_project(dbt_project_path, layer, sql_content, result_table_name, sources_yml=None, schema_yml=None):
    """
    Save generated files to a dbt project structure.

    Args:
        dbt_project_path (str): Path to the dbt project root.
        layer (str): The layer ('bronze', 'silver', 'gold').
        sql_content (str): The SQL model content.
        result_table_name (str): The model name.
        sources_yml (str): Sources YAML content (optional).
        schema_yml (str): Schema YAML content (optional).
    """
    models_dir = os.path.join(dbt_project_path, 'models')
    layer_dir = os.path.join(models_dir, layer)

    # Save SQL model
    sql_file_path = os.path.join(layer_dir, f'{result_table_name}.sql')
    save_generated_file(sql_content, sql_file_path)

    # Update sources.yml if provided
    if sources_yml:
        update_sources_yml(layer_dir, sources_yml)

    # Update schema.yml if provided
    if schema_yml:
        update_schema_yml(layer_dir, schema_yml)

def update_sources_yml(models_dir, new_sources_content):
    """
    Update or create sources.yml by appending new source definitions.

    Args:
        models_dir (str): Path to the models directory.
        new_sources_content (str): YAML content for new sources.
    """
    sources_file_path = os.path.join(models_dir, 'sources.yml')
    
    # Parse the new sources content
    new_sources = yaml.safe_load(new_sources_content)
    
    if os.path.exists(sources_file_path):
        # Load existing sources.yml
        with open(sources_file_path, 'r') as f:
            existing_content = yaml.safe_load(f) or {'version': 2, 'sources': []}
    else:
        existing_content = {'version': 2, 'sources': []}
    
    # Ensure sources key exists
    if 'sources' not in existing_content:
        existing_content['sources'] = []
    
    # Add new sources if they don't already exist
    for new_source in new_sources.get('sources', []):
        source_name = new_source.get('name')
        if not any(s.get('name') == source_name for s in existing_content['sources']):
            existing_content['sources'].append(new_source)
    
    # Write back to file
    with open(sources_file_path, 'w') as f:
        yaml.dump(existing_content, f, default_flow_style=False, sort_keys=False)

def update_schema_yml(models_dir, new_schema_content):
    """
    Update or create schema.yml by appending new model definitions.

    Args:
        models_dir (str): Path to the models directory.
        new_schema_content (str): YAML content for new models.
    """
    schema_file_path = os.path.join(models_dir, 'schema.yml')
    
    # Parse the new schema content
    new_schema = yaml.safe_load(new_schema_content)
    
    if os.path.exists(schema_file_path):
        # Load existing schema.yml
        with open(schema_file_path, 'r') as f:
            existing_content = yaml.safe_load(f) or {'version': 2, 'models': []}
    else:
        existing_content = {'version': 2, 'models': []}
    
    # Ensure models key exists
    if 'models' not in existing_content:
        existing_content['models'] = []
    
    # Add new models if they don't already exist
    for new_model in new_schema.get('models', []):
        model_name = new_model.get('name')
        if not any(m.get('name') == model_name for m in existing_content['models']):
            existing_content['models'].append(new_model)
    
    # Write back to file
    with open(schema_file_path, 'w') as f:
        yaml.dump(existing_content, f, default_flow_style=False, sort_keys=False)