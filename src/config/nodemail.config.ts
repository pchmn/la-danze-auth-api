import { registerAs } from "@nestjs/config";

export default registerAs('nodemailer', () => ({
  transport: {
    port: 1025,
    ignoreTLS: true
  }
}));