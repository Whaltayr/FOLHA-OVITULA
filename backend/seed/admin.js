require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function seedAdmin() {
  // 1️⃣ Conexão direta com o MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  // 2️⃣ Dados do admin (podes mudar depois)
  const email = 'admin@folhaovitula.com';
  const plainPassword = 'Admin@123';
  const name = 'System Admin';

  // 3️⃣ Criptografar a senha
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 4️⃣ Inserir no banco
  await connection.execute(
    `
    INSERT INTO users (email, password, name, role)
    VALUES (?, ?, ?, 'admin')
    `,
    [email, hashedPassword, name]
  );

  console.log('✅ Admin criado com sucesso');
  console.log('📧 Email:', email);
  console.log('🔑 Senha:', plainPassword);

  await connection.end();
}

seedAdmin().catch(err => {
  console.error('❌ Erro ao criar admin:', err.message);
});
