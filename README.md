# Cierre de Caja

Este proyecto es una aplicación React con un servidor Express que gestiona cierres de caja.

## Requisitos

- Node.js y npm instalados.

## Instalación

1. Clona el repositorio.
2. Ejecuta `npm install --include=dev` en la raíz para descargar todas las dependencias, incluidas las de desarrollo.
   Si encuentras problemas de dependencias, puedes usar `npm install --legacy-peer-deps`.
3. Inicia el frontend con `npm start`.
   Si las dependencias de desarrollo faltan, este comando fallará con "webpack: not found".
4. En otra terminal puedes iniciar el servidor backend con `npm run server`.

El servidor responde en `http://localhost:4000` y el frontend se sirve en `http://localhost:3000` por defecto.

Los datos se almacenan en `db.js.db` mediante SQLite. Existen scripts adicionales como `python migracion.py` para modificar la base de datos si es necesario.
