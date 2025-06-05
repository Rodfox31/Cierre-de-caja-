const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

app.post('/api/cierre-caja', (req, res) => {
  const { tienda, fecha, efectivo, tarjeta } = req.body;

  if (!tienda || !fecha || efectivo === undefined || tarjeta === undefined) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  const total = efectivo + tarjeta;

  res.json({
    mensaje: 'Cierre de caja exitoso',
    total
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
