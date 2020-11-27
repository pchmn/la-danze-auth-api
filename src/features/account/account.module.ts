import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountLocalStrategy } from './authorization/account.local.strategy';
import { AccountDocument, AccountSchema } from './mongo-schemas/account.mongo.schema';
import { AccountService } from './services/account.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountDocument.name, schema: AccountSchema }
    ])
  ],
  providers: [AccountService, AccountLocalStrategy]
})
export class AccountModule { }
