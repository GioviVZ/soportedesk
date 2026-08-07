# -*- coding: utf-8 -*-
"""SUPERADO (31-jul-2026): este backfill manual ya no hace falta correrlo a
mano -- EquipoAsignacionSyncService.sincronizarCatalogoCompleto() hace lo
mismo automaticamente todos los dias a las 3am (equipos.sync-glpi-cron en
application.yml). Se deja como herramienta de emergencia/diagnostico.

Backfill idempotente GLPI -> dbo.equipo_asignacion.

Por seguridad funciona en modo simulacion. Solo escribe con ``--apply``.
Lee las mismas variables de entorno que Spring Boot:
SSTI_DB_URL, SSTI_DB_USERNAME, SSTI_DB_PASSWORD,
GLPI_DB_URL, GLPI_DB_USERNAME y GLPI_DB_PASSWORD.
"""

import argparse
import os
import re
from urllib.parse import urlparse

import pymysql
import pyodbc


def required_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno obligatoria {name}")
    return value


def mysql_config():
    raw_url = required_env("GLPI_DB_URL").removeprefix("jdbc:")
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"mysql", "mariadb"} or not parsed.hostname:
        raise RuntimeError("GLPI_DB_URL debe ser una URL JDBC de MySQL/MariaDB")
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": required_env("GLPI_DB_USERNAME"),
        "password": required_env("GLPI_DB_PASSWORD"),
        "database": parsed.path.lstrip("/"),
        "connect_timeout": 15,
    }


def sqlserver_connection_string():
    raw_url = required_env("SSTI_DB_URL").removeprefix("jdbc:sqlserver://")
    server_part, _, properties_part = raw_url.partition(";")
    properties = {}
    for item in properties_part.split(";"):
        if "=" in item:
            key, value = item.split("=", 1)
            properties[key.lower()] = value

    server_match = re.fullmatch(r"([^:]+)(?::(\d+))?", server_part)
    if not server_match:
        raise RuntimeError("SSTI_DB_URL debe ser una URL JDBC valida de SQL Server")
    host, port = server_match.groups()
    database = properties.get("databasename") or properties.get("database")
    if not database:
        raise RuntimeError("SSTI_DB_URL debe incluir databaseName")

    return (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={host},{port or '1433'};DATABASE={database};"
        f"UID={required_env('SSTI_DB_USERNAME')};"
        f"PWD={required_env('SSTI_DB_PASSWORD')};"
        "TrustServerCertificate=yes;Encrypt=no;"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Inserta los equipos faltantes. Sin esta opcion solo informa.",
    )
    args = parser.parse_args()

    glpi = pymysql.connect(**mysql_config())
    try:
        with glpi.cursor() as cursor:
            cursor.execute(
                "SELECT ComputerID FROM vw_inv_computers_full WHERE Eliminado = 0"
            )
            glpi_ids = {row[0] for row in cursor.fetchall()}
    finally:
        glpi.close()

    conn = pyodbc.connect(sqlserver_connection_string(), timeout=30)
    conn.autocommit = False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT glpi_computer_id FROM dbo.equipo_asignacion")
        existing_ids = {row[0] for row in cursor.fetchall()}
        missing_ids = sorted(glpi_ids - existing_ids)

        print("equipos activos en GLPI:", len(glpi_ids))
        print("ya en equipo_asignacion:", len(existing_ids))
        print("faltantes:", len(missing_ids))

        if not args.apply:
            print("SIMULACION: use --apply para insertar")
            return

        if missing_ids:
            rows = [(glpi_id,) for glpi_id in missing_ids]
            cursor.executemany(
                "INSERT INTO dbo.equipo_asignacion "
                "(equipo_asignacion_id, glpi_computer_id, persona_id, sede_id, "
                "dependencia_id, subdependencia_id, codigo_patrimonial, "
                "codigo_inventario, fecha_asignacion, estado) "
                "VALUES (NEXT VALUE FOR dbo.seq_equipo_asignacion_id, ?, NULL, "
                "NULL, NULL, NULL, NULL, NULL, NULL, 'PENDIENTE')",
                rows,
            )
        conn.commit()
        print("insertados:", len(missing_ids))
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
