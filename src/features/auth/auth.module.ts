import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from '../user.mongo.schema';
import { EmailTokenDocument, EmailTokenSchema } from './mongo-schemas/email-token.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from './mongo-schemas/refresh-token.mongo.schema';
import { AuthResolver } from './resolvers/auth.resolver';
import { AuthService } from './services/auth.service';
import { EmailTokenService } from './services/email-token.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: RefreshTokenDocument.name, schema: RefreshTokenSchema },
      { name: EmailTokenDocument.name, schema: EmailTokenSchema }
    ])
  ],
  providers: [AuthResolver, AuthService, RefreshTokenService, EmailTokenService]
})
export class AuthModule { }
