import mysql.connector
from mysql.connector import Error

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='108.167.132.58',
            database='noust785_crm_mdc_canasvieiras',
            user='noust785_admin',
            password='M@st3rk3y')
        return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None
