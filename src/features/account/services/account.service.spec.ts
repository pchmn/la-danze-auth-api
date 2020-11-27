import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { ErrorCode, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';
import { AccountDocument, AccountSchema } from '../mongo-schemas/account.mongo.schema';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let accountModel: Model<AccountDocument>;
  let connection: Connection;

  afterAll(async () => {
    await connection.close();
    await InMemoryMongodb.disconnect();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        InMemoryMongodb.mongooseTestModule(),
        MongooseModule.forFeature([
          { name: AccountDocument.name, schema: AccountSchema }
        ]),
      ],
      providers: [AccountService],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountModel = module.get<Model<AccountDocument>>(`${AccountDocument.name}Model`);
    connection = await module.get(getConnectionToken());

    // Insert test data
    await InMemoryMongodb.insertTestData(accountModel, null, null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[createAccount] should throw an error (email not valid)', () => {
    return expect(service.createAccount({ email: 'user1@test..com', username: 'newUser', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.EmailInvalid, '"user1@test..com" is not a valid email'));
  });

  it('[createAccount] should throw an error (unique email and username and password < 8 characters)', () => {
    return expect(service.createAccount({ email: 'user1@test.com', username: 'user1', password: '1234567' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.EmailAndUsernameAlreadyExist, 'email "user1@test.com" already exists, username "user1" already exists, password must be 8 characters minimum'));
  });

  it('[createAccount] should throw an error (unique email and username)', () => {
    return expect(service.createAccount({ email: 'user1@test.com', username: 'user1', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.EmailAndUsernameAlreadyExist, 'email "user1@test.com" already exists, username "user1" already exists'));
  });

  it('[createAccount] should throw an error (unique email)', () => {
    return expect(service.createAccount({ email: 'user1@test.com', username: 'uniqueUsername', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.EmailAlreadyExists, 'email "user1@test.com" already exists'));
  });

  it('[createAccount] should throw an error (unique username)', () => {
    return expect(service.createAccount({ email: 'unique@test.com', username: 'user1', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.UsernameAlreadyExists, 'username "user1" already exists'));
  });

  it('[createAccount] should throw an error (password < 8 characters)', () => {
    return expect(service.createAccount({ email: 'unique@test.com', username: 'unique', password: '1234567' }))
      .rejects.toEqual(LaDanzeError.inputError(ErrorCode.UsernameAlreadyExists, 'password must be 8 characters minimum'));
  });

  it('[createAccount] should create a user and return tokens', async () => {
    await service.createAccount({ email: 'unique@test.com', username: 'unique', password: '12345678' });
    const createdUser = await accountModel.findOne({ 'email.value': 'unique@test.com' });
    // Check created user
    expect(createdUser).not.toBeNull();
    expect(createdUser.username).toEqual('unique');
    expect(createdUser.accountId.length).toEqual(32);
  });

  it('[findByEmailOrUsername] should find by email', async () => {
    const account = await service.findByEmailOrUsername('user1@test.com');
    expect(account).not.toBeNull();
    expect(account.username).toEqual('user1');
    expect(account.accountId).toEqual('accountId1');
  });

  it('[findByEmailOrUsername] should find by username', async () => {
    const account = await service.findByEmailOrUsername('user1');
    expect(account).not.toBeNull();
    expect(account.email.value).toEqual('user1@test.com');
    expect(account.accountId).toEqual('accountId1');
  });

  it('[findByAccountId] should find by account id', async () => {
    const account = await service.findByAccountId('accountId1');
    expect(account).not.toBeNull();
    expect(account.email.value).toEqual('user1@test.com');
    expect(account.username).toEqual('user1');
  });

  it('[updateAccount] should not modify account id', async () => {
    const account = await service.findByAccountId('accountId1');
    account.accountId = 'updateAccountId';
    const accountUpdated = await account.save();

    expect(accountUpdated.accountId).toEqual('accountId1');
  });
});
