const { testConnection } = require("./config/db");

async function main() {
  console.log("Backend Folha Ovitula iniciando testando DB...");
  try {
    await testConnection();
    console.log("Conexão com MySQL Ok");
  } catch (error) {
    console.error("Erro - Falha na concexão", err.message || err);
    console.error(err);
    process.exit(1);
  }
}
main();
