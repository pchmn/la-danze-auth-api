import { ConfigService } from '@nestjs/config';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { AccountDocument, AccountSchema } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountService } from 'src/features/account/services/account.service';
import { ErrorType, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';
import { RefreshTokenDocument, RefreshTokenSchema } from '../mongo-schemas/refresh-token.mongo.schema';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let connection: Connection;
  let refreshTokenModel: Model<RefreshTokenDocument>;
  let accountModel: Model<AccountDocument>;

  afterAll(async () => {
    await connection.close();
    await InMemoryMongodb.disconnect();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        InMemoryMongodb.mongooseTestModule(),
        MongooseModule.forFeature([
          { name: AccountDocument.name, schema: AccountSchema },
          { name: RefreshTokenDocument.name, schema: RefreshTokenSchema }
        ])
      ],
      providers: [
        ConfigService,
        RefreshTokenService,
        AccountService
      ]
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    refreshTokenModel = module.get<Model<RefreshTokenDocument>>(`${RefreshTokenDocument.name}Model`);
    accountModel = module.get<Model<AccountDocument>>(`${AccountDocument.name}Model`);
    connection = await module.get(getConnectionToken());

    // Insert test data
    await InMemoryMongodb.insertTestData(accountModel, refreshTokenModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[createRefreshToken] should create refresh token', async () => {
    const user = new accountModel();
    const refreshTokenSaved = await service.createRefreshToken(user);
    // Check user
    expect(refreshTokenSaved.account).toEqual(user);
    // Check token length
    expect(refreshTokenSaved.token.length).toBe(64);
    // Check expiresAt (7 days)
    expect(refreshTokenSaved.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });

  it('[createRefreshTokenForAccount] should create refresh token', async () => {
    const account = await accountModel.findOne({ accountId: 'accountId1' });
    const refreshTokenSaved = await service.createRefreshTokenForAccount(account.accountId);
    // Check account
    expect(refreshTokenSaved.account.accountId).toEqual(account.accountId);
    // Check token length
    expect(refreshTokenSaved.token.length).toBe(64);
    // Check expiresAt (7 days)
    expect(refreshTokenSaved.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });

  it('[getRefreshToken] should throw an error (token expired)', () => {
    return expect(service.getRefreshToken('token2')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[getRefreshToken] should throw an error (token expired)', () => {
    return expect(service.getRefreshToken('token3')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[getRefreshToken] should throw an error (token does not exist)', () => {
    return expect(service.getRefreshToken('token6')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[getRefreshToken] should get refresh token', async () => {
    const document = await service.getRefreshToken('token1');
    expect(document.token).toEqual('token1');
    expect(document.account.username).toEqual('user1');
  });

  it('[revokeToken] should throw an error (token not valid)', () => {
    return expect(service.revokeToken('token2')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[revokeToken] should revoke token', async () => {
    const document = await service.revokeToken('token4');
    expect(document.revokedAt).not.toBeNull();
  });

  it('[refreshToken] should throw an error (token not valid)', () => {
    return expect(service.refreshToken('token2')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[refreshToken] should refresh token', async () => {
    let document = await service.refreshToken('token5');
    // Check user
    expect(document.account.username).toEqual('user5');
    // Check token length
    expect(document.token.length).toBe(64);
    // Check expiresAt (7 days)
    expect(document.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Check if token5 has been revoked
    document = await refreshTokenModel.findOne({ token: 'token5' });
    expect(document.revokedAt).not.toBeNull();
  });
});
