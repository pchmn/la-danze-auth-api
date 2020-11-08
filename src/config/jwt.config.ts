import { registerAs } from "@nestjs/config";
import * as fs from 'fs';

export default registerAs('jwt', () => ({
  privateKey: fs.readFileSync('rsa_keys/la-danze_private.pem'),
  publicKey: fs.readFileSync('rsa_keys/la-danze_public.pem'),
}));