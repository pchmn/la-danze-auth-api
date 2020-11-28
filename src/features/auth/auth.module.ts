import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountDocument, AccountSchema } from '../account/mongo-schemas/account.mongo.schema';
import { AccountService } from '../account/services/account.service';
import { JwtStrategy } from './authorization/jwt.strategy';
import { EmailTokensDocument, EmailTokensSchema } from './mongo-schemas/email-tokens.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from './mongo-schemas/refresh-token.mongo.schema';
import { AuthResolver } from './resolvers/auth.resolver';
import { AuthService } from './services/auth.service';
import { EmailTokenService } from './services/email-token.service';
import { EmailService } from './services/email.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get('jwt.privateKey'),
        publicKey: configService.get('jwt.publicKey'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '180s'
        }
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: AccountDocument.name, schema: AccountSchema },
      { name: RefreshTokenDocument.name, schema: RefreshTokenSchema },
      { name: EmailTokensDocument.name, schema: EmailTokensSchema }
    ])
  ],
  providers: [AuthResolver, AuthService, RefreshTokenService, EmailTokenService, EmailService, AccountService, JwtStrategy],
  exports: [
    AuthService,

  ]
})
export class AuthModule { }
