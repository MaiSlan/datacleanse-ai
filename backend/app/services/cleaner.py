import pandas as pd
import io

def clean_csv_data(file_bytes: bytes) -> bytes:
    """
    Takes raw CSV bytes, cleans the data using Pandas, 
    and returns the cleaned CSV as bytes.
    """
    # 1. Read the raw bytes into a Pandas DataFrame
    df = pd.read_csv(io.BytesIO(file_bytes), on_bad_lines='skip')
    
    # 2. Standardize column names (lowercase, replace spaces with underscores)
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    
    # 3. Drop rows that are completely empty
    df.dropna(how='all', inplace=True)
    
    # 4. Fill missing text values with "Unknown" and numbers with 0
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].fillna("Unknown")
        else:
            df[col] = df[col].fillna(0)
            
    # 5. Convert the cleaned DataFrame back to CSV bytes
    output_buffer = io.BytesIO()
    df.to_csv(output_buffer, index=False)
    
    return output_buffer.getvalue()