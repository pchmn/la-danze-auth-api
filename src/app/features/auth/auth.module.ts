import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountDocument, AccountSchema } from '../account/mongo-schemas/account.mongo.schema';
import { AccountService } from '../account/services/account.service';
import { EmailTokensDocument, EmailTokensSchema } from './mongo-schemas/email-tokens.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from './mongo-schemas/refresh-token.mongo.schema';
import { AuthResolver } from './resolvers/auth.resolver';
import { AuthService } from './services/auth.service';
import { EmailTokenService } from './services/email-token.service';
import { EmailService } from './services/email.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountDocument.name, schema: AccountSchema },
      { name: RefreshTokenDocument.name, schema: RefreshTokenSchema },
      { name: EmailTokensDocument.name, schema: EmailTokensSchema }
    ])
  ],
  providers: [AuthResolver, AuthService, RefreshTokenService, EmailTokenService, EmailService, AccountService],
  exports: [
    AuthService
  ]
})
export class AuthModule { }
