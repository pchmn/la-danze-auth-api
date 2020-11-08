import { Transport } from "@nestjs/microservices";

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3010,
  microServiceTransport: Transport.TCP,
  microservicePort: parseInt(process.env.PORT, 10) || 3020
});