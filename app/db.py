# -*- encoding: utf-8 -*-

import os

import mysql.connector
from mysql.connector import Error as MySQLError


class DatabaseUnavailable(Exception):
    pass


def database_config(include_database=True):
    config = {
        "host": os.getenv("CAREBRIDGE_DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("CAREBRIDGE_DB_PORT", "3306")),
        "user": os.getenv("CAREBRIDGE_DB_USER", "root"),
        "password": os.getenv("CAREBRIDGE_DB_PASSWORD", ""),
        "autocommit": False,
    }
    if include_database:
        config["database"] = os.getenv("CAREBRIDGE_DB_NAME", "carebridge")
    return config


def get_connection():
    try:
        return mysql.connector.connect(**database_config())
    except MySQLError as error:
        raise DatabaseUnavailable(str(error)) from error
