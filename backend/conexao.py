"""Conexao com MySQL para o backend da Brabus Barber.

Bibliotecas instaladas via requirements.txt:
  * mysql-connector-python: driver oficial para conexao/SQL do MySQL.
  * python-dotenv: le configuracoes DB_* de um arquivo .env opcional.

Uso:
    from conexao import conectar

    with conectar() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id_usuario, nome FROM usuario")
            usuarios = cursor.fetchall()
        finally:
            cursor.close()

O context manager abaixo garante commit em sucesso, rollback em erro e
fechamento da conexao. O mysql-connector nao usa conn.execute() como psycopg;
as consultas sao feitas por cursor.execute().
"""

import os
from contextlib import contextmanager

import mysql.connector
from dotenv import load_dotenv

# Le .env do diretorio do projeto, se presente.
load_dotenv()


@contextmanager
def conectar():
    """Abre e fecha uma conexao MySQL corretamente, com transacao.

    Se alguma consulta levantar excecao, descarta alteracoes via rollback.
    Nao reutilize uma mesma conexao global entre requisicoes da API.
    """
    senha = os.getenv("DB_PASSWORD")
    if not senha:
        raise ValueError("Defina DB_PASSWORD no .env antes de conectar.")

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3307")),
        database=os.getenv("DB_NAME", "brabus_barber"),
        user=os.getenv("DB_USER", "brabus_app"),
        password=senha,
        connection_timeout=5,
        charset="utf8mb4",     # Nomes e descricoes com acentos
        autocommit=False,      # Commit explicito ao sair do bloco
    )
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
