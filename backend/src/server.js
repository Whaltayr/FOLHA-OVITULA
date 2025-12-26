// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // opcional, facilita cookies
const app = express();

app.use(express.json());

// CORS - configure explicitamente para o dev frontend
// app.use(cors({
//   origin: 'http://localhost:5173', // endereço do Vite
//   methods: ['GET','POST','PUT','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // se usar cookies HttpOnly; senão pode false
// }));

// Se quiser garantir preflight responses:
app.use( cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

//Cookies
app.use(cookieParser()); // se quiser ler cookies via req.cookies


// rotas
app.use('/auth', require('./routes/auth'));    // já tens
app.use('/admin', require('./routes/admin'));  // proteger
app.use('/posts', require('./routes/posts'));  // public + admin

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));





