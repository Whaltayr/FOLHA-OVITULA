const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Servidor está vivo');
});

app.listen(3001, () => {
  console.log('Servidor teste rodando na porta 3001');
});
