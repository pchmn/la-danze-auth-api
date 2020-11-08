

import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { RefreshTokenDocument } from 'src/features/auth/mongo-schemas/refresh-token.mongo.schema';
import { UserDocument } from 'src/features/user.mongo.schema';

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

  static async insertTestData(userModel: Model<UserDocument>, refreshTokenModel: Model<RefreshTokenDocument>) {
    const users = [
      new userModel({ email: 'user1@test.com', username: 'user1', password: bcrypt.hashSync('pwd1', bcrypt.genSaltSync(10)), roles: [] }),
      new userModel({ email: 'user2@test.com', username: 'user2', password: bcrypt.hashSync('pwd2', bcrypt.genSaltSync(10)), roles: [] }),
      new userModel({ email: 'user3@test.com', username: 'user3', password: bcrypt.hashSync('pwd3', bcrypt.genSaltSync(10)), roles: [] }),
    ];
    const refreshTokens = [
      new refreshTokenModel({ token: 'token1', expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000, user: users[0] }),
      // Will be expired at test time
      new refreshTokenModel({ token: 'token2', expiresAt: Date.now(), user: users[1] }),
      // Revoked
      new refreshTokenModel({ token: 'token3', expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000, revokedAt: Date.now(), user: users[2] }),
      // Token to revoke
      new refreshTokenModel({ token: 'token4', expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000, user: users[0] }),
      // Token to refresh
      new refreshTokenModel({ token: 'token5', expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000, user: users[0] }),
    ];

    // Insert users
    await userModel.collection.insertMany(users);
    // Insert refresh tokens
    await refreshTokenModel.collection.insertMany(refreshTokens);
  }
}
