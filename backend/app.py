"""API demonstrativa da Brabus Barber com MySQL e FastAPI.

Bibliotecas externas (instale: python -m pip install -r requirements.txt):
  fastapi                -> endpoints HTTP e validacao de requisicoes
  uvicorn                -> servidor local da API
  mysql-connector-python -> comunicacao com MySQL, usado em conexao.py
  python-dotenv          -> carregamento das configuracoes do arquivo .env

Iniciar: python -m uvicorn app:app --reload
Documentacao: http://127.0.0.1:8000/docs

IMPORTANTE: Exemplo de desenvolvimento SEM autenticacao de API.
Nao publique na internet antes de implementar login, autorizacao e HTTPS.
"""

import logging
from decimal import Decimal

import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from conexao import conectar

log = logging.getLogger(__name__)
app = FastAPI(title="Brabus Barber API (MySQL)", version="0.2.0")


class LeituraRFIDProduto(BaseModel):
    """Dados enviados pelo equipamento ou aplicativo de leitura de produtos."""
    uid: str = Field(min_length=1, max_length=128)
    leitor: str | None = Field(default=None, max_length=80)


class LeituraRFIDUsuario(BaseModel):
    """Dados enviados pelo equipamento ou aplicativo de leitura de cartoes."""
    uid: str = Field(min_length=1, max_length=64)
    leitor: str | None = Field(default=None, max_length=80)


def uid_limpo(uid: str) -> str:
    """Padroniza UIDs: cadastro e leitura devem usar o mesmo formato."""
    codigo = uid.strip().upper()
    if not codigo:
        raise HTTPException(status_code=422, detail="UID nao pode estar vazio.")
    return codigo


def preparar_linha(linha: dict | None) -> dict | None:
    """Serializa DECIMAL como texto para nao perder centavos por float.

    Exemplo: 'preco_venda': Decimal('35.90') -> '35.90'.
    """
    if linha is None:
        return None
    return {
        chave: str(valor) if isinstance(valor, Decimal) else valor
        for chave, valor in linha.items()
    }


def falha_banco(exc: Exception):
    """Oculta detalhes internos da conexao de quem consumir a API."""
    log.error("Falha ao acessar o MySQL: %s", type(exc).__name__)
    raise HTTPException(
        status_code=503,
        detail="Banco indisponivel. Verifique o MySQL e as variaveis do .env.",
    ) from exc


@app.get("/saude")
def saude():
    """Testa a conexao real com o servidor MySQL (SELECT 1)."""
    try:
        with conectar() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            finally:
                cursor.close()
        return {"status": "ok", "banco": "mysql", "conectado": True}
    except (mysql.connector.Error, ValueError) as exc:
        falha_banco(exc)


@app.get("/produtos")
def listar_produtos():
    """Lista produtos ativos e estoque contado pelas etiquetas disponiveis."""
    sql = """
        SELECT p.id_produto, p.nome, p.preco_venda,
               COUNT(r.id_rfid_produto) AS quantidade_disponivel
        FROM produto p
        LEFT JOIN rfid_produto r
          ON r.id_produto = p.id_produto AND r.status = 'disponivel'
        WHERE p.ativo = TRUE
        GROUP BY p.id_produto, p.nome, p.preco_venda
        ORDER BY p.nome
    """
    try:
        with conectar() as conn:
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute(sql)
                produtos = cursor.fetchall()
            finally:
                cursor.close()
        return [preparar_linha(p) for p in produtos]
    except (mysql.connector.Error, ValueError) as exc:
        falha_banco(exc)


@app.post("/rfid/produto/ler")
def ler_etiqueta_produto(leitura: LeituraRFIDProduto):
    """Consulta uma unidade pelo UID e registra a leitura, cadastrada ou nao.

    NAO reduz estoque nem registra uma venda. A leitura desconhecida recebe
    id_rfid_produto = NULL no historico, para rastreabilidade.
    """
    uid = uid_limpo(leitura.uid)
    try:
        with conectar() as conn:
            cursor = conn.cursor(dictionary=True)
            try:
                # %s + tupla: parametros tratados pelo driver, sem concatenar SQL.
                cursor.execute(
                    """
                    SELECT r.id_rfid_produto, r.uid, r.status,
                           p.id_produto, p.nome, p.preco_venda, p.ativo
                    FROM rfid_produto r
                    JOIN produto p ON p.id_produto = r.id_produto
                    WHERE r.uid = %s
                    """,
                    (uid,),
                )
                produto = cursor.fetchone()

                # A segunda operacao pertence a mesma transacao.
                # Se INSERT falhar, o contexto faz rollback.
                cursor.execute(
                    """
                    INSERT INTO rfid_leitura_produto
                        (uid_lido, id_rfid_produto, leitor)
                    VALUES (%s, %s, %s)
                    """,
                    (uid, produto["id_rfid_produto"] if produto else None, leitura.leitor),
                )
            finally:
                cursor.close()
        return {"encontrado": produto is not None, "produto": preparar_linha(produto)}
    except (mysql.connector.Error, ValueError) as exc:
        falha_banco(exc)


@app.post("/rfid/usuario/ler")
def ler_cartao_usuario(leitura: LeituraRFIDUsuario):
    """Identifica o usuario com cartao ativo e guarda o evento de leitura.

    Cartoes inativos tambem sao registrados, mas NAO identificam usuario.
    UID sozinho pode ser clonado e nao deve autenticar operacoes sensiveis.
    """
    uid = uid_limpo(leitura.uid)
    try:
        with conectar() as conn:
            cursor = conn.cursor(dictionary=True)
            try:
                # Procuramos o cartao mesmo se inativo para preservar referencia
                # no historico; so retornamos o usuario quando ambos estao ativos.
                cursor.execute(
                    """
                    SELECT c.id_rfid_cartao, c.ativo AS cartao_ativo,
                           u.id_usuario, u.nome, u.nivel_usuario,
                           u.ativo AS usuario_ativo
                    FROM rfid_cartao c
                    JOIN usuario u ON u.id_usuario = c.id_usuario
                    WHERE c.uid = %s
                    """,
                    (uid,),
                )
                cartao = cursor.fetchone()
                usuario = None
                if cartao and cartao["cartao_ativo"] and cartao["usuario_ativo"]:
                    usuario = {
                        "id_usuario": cartao["id_usuario"],
                        "nome": cartao["nome"],
                        "nivel_usuario": cartao["nivel_usuario"],
                    }

                cursor.execute(
                    """
                    INSERT INTO rfid_leitura (uid_lido, id_rfid_cartao, leitor)
                    VALUES (%s, %s, %s)
                    """,
                    (uid, cartao["id_rfid_cartao"] if cartao else None, leitura.leitor),
                )
            finally:
                cursor.close()
        return {"encontrado": usuario is not None, "usuario": usuario}
    except (mysql.connector.Error, ValueError) as exc:
        falha_banco(exc)
