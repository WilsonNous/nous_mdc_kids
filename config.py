import mysql.connector
from mysql.connector import Error

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='seu_host_mysql_hostgator',
            database='seu_banco',
            user='seu_usuario',
            password='sua_senha'
        )
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None
