import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from '../user.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from './mongo-schemas/refresh-token.mongo.schema';
import { AuthResolver } from './resolvers/auth.resolver';
import { AuthService } from './services/auth.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: RefreshTokenDocument.name, schema: RefreshTokenSchema }
    ])
  ],
  providers: [AuthResolver, AuthService, RefreshTokenService]
})
export class AuthModule { }
