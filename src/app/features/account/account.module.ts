import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccountDocument, AccountSchema } from './mongo-schemas/account.mongo.schema';
import { AccountResolver } from './resolvers/account.resolver';
import { AccountService } from './services/account.service';


@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: AccountDocument.name, schema: AccountSchema }
    ])
  ],
  providers: [AccountResolver, AccountService]
})
export class AccountModule { }
