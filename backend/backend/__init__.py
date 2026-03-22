"""Load PyMySQL as MySQLdb when available (helps on Windows without mysqlclient)."""

try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:
    pass
