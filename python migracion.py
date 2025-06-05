import sqlite3
import os

# Construye la ruta a la base de datos de forma relativa al directorio del script
db_path = os.path.join(os.path.dirname(__file__), "db.js.db")

# Verifica que el archivo de la base de datos exista
if not os.path.exists(db_path):
    print("La base de datos no existe.")
else:
    # Conecta a la base de datos
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Ejecuta los comandos ALTER TABLE para agregar las columnas
        cursor.execute("ALTER TABLE cierres ADD COLUMN balance_sin_justificar REAL;")
        cursor.execute("ALTER TABLE cierres ADD COLUMN responsable TEXT;")
        cursor.execute("ALTER TABLE cierres ADD COLUMN comentarios TEXT;")
        conn.commit()
        print("Columnas agregadas exitosamente.")
    except sqlite3.OperationalError as e:
        print("Error al ejecutar ALTER TABLE:", e)
    finally:
        conn.close()
