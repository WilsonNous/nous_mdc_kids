import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Retorna conexão com o banco de dados MySQL"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST'),
            database=os.getenv('MYSQL_DB'),
            user=os.getenv('MYSQL_USER'),
            password=os.getenv('MYSQL_PASSWORD'),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        if connection.is_connected():
            print("✅ Conexão com MySQL estabelecida com sucesso!")
            return connection
    except Error as e:
        print(f"❌ Erro ao conectar ao MySQL: {e}")
        return None

def close_db_connection(conn):
    """Fecha conexão com o banco de dados"""
    if conn and conn.is_connected():
        conn.close()
        print("🔒 Conexão com MySQL fechada.")
