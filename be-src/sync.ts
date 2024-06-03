import { Sequelize } from "sequelize-cockroachdb";
// Conexión a la DB
export const sequelize = new Sequelize(process.env.DB_POSTGRES_URL as any);
