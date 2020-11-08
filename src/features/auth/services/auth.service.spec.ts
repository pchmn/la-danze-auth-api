import { ConfigService } from '@nestjs/config';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { generateKeyPair } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Connection, Model } from 'mongoose';
import { UserDocument, UserSchema } from 'src/features/user.mongo.schema';
import { ErrorCode, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';
import { RefreshTokenDocument, RefreshTokenSchema } from '../mongo-schemas/refresh-token.mongo.schema';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';

class ConfigServiceMock {
  constructor(private privateRsaKey: string, private publicRsaKey: string) { }

  get(key: string) {
    switch (key) {
      case 'jwt.privateKey': return this.privateRsaKey;
      case 'jwt.publicKey': return this.publicRsaKey;
    }
  }
}


const generateKeyPairPromise = (): Promise<{ privateKey: string, publicKey: string }> => {
  return new Promise((resolve, reject) => {
    generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) return reject(err);
      return resolve({ privateKey, publicKey })
    });
  })
}

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  let connection: Connection;
  let refreshTokenModel: Model<RefreshTokenDocument>;
  let userModel: Model<UserDocument>;

  afterAll(async () => {
    await connection.close();
    await InMemoryMongodb.disconnect();
  });

  beforeAll(async () => {

    // Generate key pair
    const keyPair = await generateKeyPairPromise();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        InMemoryMongodb.mongooseTestModule(),
        MongooseModule.forFeature([
          { name: UserDocument.name, schema: UserSchema },
          { name: RefreshTokenDocument.name, schema: RefreshTokenSchema }
        ])
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigServiceMock(keyPair.privateKey, keyPair.publicKey)
        },
        RefreshTokenService,
        AuthService
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    refreshTokenModel = module.get<Model<RefreshTokenDocument>>(`${RefreshTokenDocument.name}Model`);
    userModel = module.get<Model<UserDocument>>(`${UserDocument.name}Model`);
    connection = await module.get(getConnectionToken());

    // Insert test data
    await InMemoryMongodb.insertTestData(userModel, refreshTokenModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[signup] should throw an error (email not valid)', () => {
    return expect(service.signup({ email: 'user1@test..com', username: 'user5', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create('"user1@test..com" is not a valid email', ErrorCode.WrongInput));
  });

  it('[signup] should throw an error (unique email and username)', () => {
    return expect(service.signup({ email: 'user1@test.com', username: 'user1', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create('email "user1@test.com" already exists, username "user1" already exists', ErrorCode.WrongInput));
  });

  it('[signup] should throw an error (unique email)', () => {
    return expect(service.signup({ email: 'user1@test.com', username: 'uniqueUsername', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create('email "user1@test.com" already exists', ErrorCode.WrongInput));
  });

  it('[signup] should throw an error (unique username)', () => {
    return expect(service.signup({ email: 'unique@test.com', username: 'user1', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create('username "user1" already exists', ErrorCode.WrongInput));
  });

  it('[signup] should create a user and return tokens', async () => {
    const tokens = await service.signup({ email: 'unique@test.com', username: 'unique', password: 'pwd' });
    const createdUser = await userModel.findOne({ email: 'unique@test.com' });
    // Check created user
    expect(createdUser).not.toBeNull();
    expect(createdUser.username).toEqual('unique');
    // Check refresh token
    expect(tokens.refreshToken.length).toEqual(64);
    // Check access token
    jwt.verify(tokens.accessToken, configService.get('jwt.publicKey'), (err, decoded) => {
      expect(decoded.username).toEqual('unique');
    });
  });

  it('[login] should throw an error (user not found)', () => {
    return expect(service.login({ emailOrUsername: 'user5', password: 'pwd1' }))
      .rejects.toEqual(LaDanzeError.userNotFound('user5'));
  });

  it('[login] should throw an error (wrong password)', () => {
    return expect(service.login({ emailOrUsername: 'user1', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.wrongCredentials());
  });

  it('[login] should return tokens (username login)', async () => {
    const tokens = await service.login({ emailOrUsername: 'user1', password: 'pwd1' });
    // Check refresh token
    expect(tokens.refreshToken.length).toEqual(64);
    // Check access token
    jwt.verify(tokens.accessToken, configService.get('jwt.publicKey'), (err, decoded) => {
      expect(decoded.username).toEqual('user1');
    });
  });

  it('[login] should return tokens (email login)', async () => {
    const tokens = await service.login({ emailOrUsername: 'user1@test.com', password: 'pwd1' });
    // Check refresh token
    expect(tokens.refreshToken.length).toEqual(64);
    // Check access token
    jwt.verify(tokens.accessToken, configService.get('jwt.publicKey'), (err, decoded) => {
      expect(decoded.username).toEqual('user1');
    });
  });

  it('[refreshToken] should throw an error (token not valid)', () => {
    return expect(service.refreshToken({ token: 'token2' })).rejects.toEqual(LaDanzeError.invalidToken());
  });

  it('[refreshToken] should return tokens', async () => {
    const tokens = await service.refreshToken({ token: 'token5' });
    // Check refresh token
    expect(tokens.refreshToken.length).toEqual(64);
    // Check access token
    jwt.verify(tokens.accessToken, configService.get('jwt.publicKey'), (err, decoded) => {
      expect(decoded.username).toEqual('user1');
    });
  });
});
