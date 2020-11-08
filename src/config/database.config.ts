import { registerAs } from "@nestjs/config";

export default registerAs('mongodb', () => ({
  host: process.env.MONGODB_HOST,
  port: parseInt(process.env.MONGODB_PORT, 10) || 27017,
  user: process.env.MONGODB_USER,
  pwd: process.env.MONGODB_PWD,
  db: process.env.MONGODB_DB_NAME
}));