

import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { EmailTokensDocument } from 'src/features/auth/mongo-schemas/email-tokens.mongo.schema';
import { RefreshTokenDocument } from 'src/features/auth/mongo-schemas/refresh-token.mongo.schema';

export class InMemoryMongodb {
  static mongod = new MongoMemoryServer();

  static mongooseTestModule() {
    return MongooseModule.forRootAsync({
      useFactory: async () => {
        return {
          uri: await InMemoryMongodb.mongod.getUri()
        }
      },
    })
  }

  static async disconnect() {
    await InMemoryMongodb.mongod.stop();
  }

  static async insertTestData(accountModel: Model<AccountDocument>, refreshTokenModel?: Model<RefreshTokenDocument>, emailTokenModel?: Model<EmailTokensDocument>) {
    // Insert users
    const users = [
      new accountModel({ accountId: 'accountId1', email: { value: 'user1@test.com' }, username: 'user1', password: bcrypt.hashSync('password1', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId2', email: { value: 'user2@test.com' }, username: 'user2', password: bcrypt.hashSync('password2', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId3', email: { value: 'user3@test.com' }, username: 'user3', password: bcrypt.hashSync('password3', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId4', email: { value: 'user4@test.com' }, username: 'user4', password: bcrypt.hashSync('password4', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId5', email: { value: 'user5@test.com' }, username: 'user5', password: bcrypt.hashSync('password5', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId6', email: { value: 'user6@test.com' }, username: 'user6', password: bcrypt.hashSync('password6', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId7', email: { value: 'user7@test.com' }, username: 'user7', password: bcrypt.hashSync('password7', bcrypt.genSaltSync(10)), roles: [] }),
      new accountModel({ accountId: 'accountId8', email: { value: 'user8@test.com' }, username: 'user8', password: bcrypt.hashSync('password8', bcrypt.genSaltSync(10)), roles: [] }),
    ];
    await accountModel.collection.insertMany(users);

    // Insert refresh tokens
    if (refreshTokenModel) {
      const refreshTokens = [
        new refreshTokenModel({ token: 'token1', account: users[0] }),
        // Will be expired at test time
        new refreshTokenModel({ token: 'token2', expiresAt: Date.now(), account: users[1] }),
        // Revoked
        new refreshTokenModel({ token: 'token3', revokedAt: Date.now(), account: users[2] }),
        // Token to revoke
        new refreshTokenModel({ token: 'token4', account: users[3] }),
        // Token to refresh
        new refreshTokenModel({ token: 'token5', account: users[4] }),
      ];
      await refreshTokenModel.collection.insertMany(refreshTokens);
    }

    // Insert email tokens
    if (emailTokenModel) {
      // We save each email token, si that pre save is fired, and expiresAt date will be set by default
      await new emailTokenModel({ account: users[0], confirmToken: { value: 'token1', expiresAt: Date.now() } }).save();
      await new emailTokenModel({ account: users[1], confirmToken: { value: 'token2' } }).save();
      await new emailTokenModel({ account: users[2], confirmToken: { value: 'token3' } }).save();
      await new emailTokenModel({ account: users[3], resetPasswordToken: { value: 'token4', expiresAt: Date.now() } }).save();
      await new emailTokenModel({ account: users[4], resetPasswordToken: { value: 'token5' } }).save();
      await new emailTokenModel({ account: users[5], confirmToken: { value: 'token6' } }).save();
    }
  }
}
