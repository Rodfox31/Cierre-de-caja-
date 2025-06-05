import sqlite3
import os

# Usando una cadena raw para el path de Windows
db_path = r"C:\Users\Mil\Desktop\Cierre de caja App 2.0\client\db.js.db"

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
