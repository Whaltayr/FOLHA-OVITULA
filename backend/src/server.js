// src/server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); // opcional, facilita cookies
const app = express();

app.use(express.json());
app.use(cookieParser()); // se quiser ler cookies via req.cookies

// rotas
app.use('/auth', require('./routes/auth'));    // já tens
app.use('/admin', require('./routes/admin'));  // proteger
app.use('/posts', require('./routes/posts'));  // public + admin

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));


const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // frontend dev server
  credentials: true,               // permite enviar cookies HttpOnly
}));
