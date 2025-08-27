import mongoose from "mongoose";
mongoose.Promise = global.Promise;
import { config } from "dotenv";
config();

connect()
  .then(() => console.log("Conexão com o MongoDB estabelecida com sucesso!"))
  .catch((error) => console.error("Erro ao conectar ao MongoDB:", error))
  ;

export async function connect(): Promise<void> {
  await mongoose.connect(`${process.env.MONGO_URL}`);
}
