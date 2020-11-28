import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { ErrorType, LaDanzeError } from 'src/app/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/app/shared/testing/in-memory-mongodb';
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
      .rejects.toEqual(LaDanzeError.create(ErrorType.InvalidEmail('"user1@test..com" is not a valid email')));
  });

  it('[createAccount] should throw an error (unique email)', () => {
    return expect(service.createAccount({ email: 'user1@test.com', username: 'uniqueUsername', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.EmailAlreadyExists('email "user1@test.com" already exists')));
  });

  it('[createAccount] should throw an error (unique username)', () => {
    return expect(service.createAccount({ email: 'unique@test.com', username: 'user1', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.UsernameAlreadyExists('username "user1" already exists')));
  });

  it('[createAccount] should throw an error (password < 8 characters)', () => {
    return expect(service.createAccount({ email: 'unique@test.com', username: 'unique', password: '1234567' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.PasswordMinLength));
  });

  it('[createAccount] should create a user and return tokens', async () => {
    await service.createAccount({ email: 'unique@test.com', username: 'unique', password: '12345678' });
    const createdUser = await accountModel.findOne({ 'email.value': 'unique@test.com' });
    // Check created user
    expect(createdUser).not.toBeNull();
    expect(createdUser.username).toEqual('unique');
    expect(createdUser.accountId.length).toEqual(32);
  });

  it('[findByEmailOrUsername] should throw an error (not found)', () => {
    return expect(service.findByEmailOrUsername('nouser@test.com'))
      .rejects.toEqual(LaDanzeError.create(ErrorType.AccountNotFound));
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

  it('[findByAccountId] should throw an error (not found)', () => {
    return expect(service.findByAccountId('noAccountId'))
      .rejects.toEqual(LaDanzeError.create(ErrorType.AccountNotFound));
  });

  it('[findByAccountId] should find by account id', async () => {
    const account = await service.findByAccountId('accountId1');
    expect(account).not.toBeNull();
    expect(account.email.value).toEqual('user1@test.com');
    expect(account.username).toEqual('user1');
  });

  it('[changePassword] should throw an error (wrong password)', () => {
    return expect(service.changePassword('accountId1', { oldPassword: 'nopassword', newPassword: 'password' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.WrongCredentials));
  });

  it('[changePassword] should throw an error (min length 8)', () => {
    return expect(service.changePassword('accountId1', { oldPassword: 'password1', newPassword: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.PasswordMinLength));
  });

  it('[changePassword] should change password', async () => {
    const account = await service.changePassword('accountId1', { oldPassword: 'password1', newPassword: 'newPassword' });
    expect(account.validate('newPassword')).toBeTruthy();
  });

  it('[changeEmailAndUsername] should throw an error (invalid email)', () => {
    return expect(service.changeEmailAndUsername('accountId1', { newEmail: 'test@test..com', newUsername: 'user1' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.InvalidEmail('"user1@test..com" is not a valid email')));
  });

  it('[changeEmailAndUsername] should throw an error (unique email)', () => {
    return expect(service.changeEmailAndUsername('accountId1', { newEmail: 'user2@test.com', newUsername: 'user1' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.EmailAlreadyExists('email "user2@test.com" already exists')));
  });

  it('[changeEmailAndUsername] should throw an error (unique username)', () => {
    return expect(service.changeEmailAndUsername('accountId1', { newEmail: 'user1@test.com', newUsername: 'user2' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.EmailAlreadyExists('username "user2" already exists')));
  });

  it('[changeEmailAndUsername] should change email and username (email not changed)', async () => {
    const res = await service.changeEmailAndUsername('accountId1', { newEmail: 'user1@test.com', newUsername: 'user1' });
    expect(res.emailHasChanged).toBeFalsy();
    expect(res.account.email.value).toEqual('user1@test.com');
    expect(res.account.username).toEqual('user1');
  });

  it('[changeEmailAndUsername] should change email and username (email changed)', async () => {
    const res = await service.changeEmailAndUsername('accountId1', { newEmail: 'user-update@test.com', newUsername: 'user1' });
    expect(res.emailHasChanged).toBeTruthy();
    expect(res.account.email.value).toEqual('user-update@test.com');
    expect(res.account.username).toEqual('user1');
  });

  it('[changeEmailAndUsername] should change email and username (username changed)', async () => {
    const res = await service.changeEmailAndUsername('accountId2', { newEmail: 'user2@test.com', newUsername: 'newUsername' });
    expect(res.emailHasChanged).toBeFalsy();
    expect(res.account.email.value).toEqual('user2@test.com');
    expect(res.account.username).toEqual('newUsername');
  });

  it('[changeEmailAndUsername] should change email and username (both changed)', async () => {
    const res = await service.changeEmailAndUsername('accountId3', { newEmail: 'user-update2@test.com', newUsername: 'newUsername2' });
    expect(res.emailHasChanged).toBeTruthy();
    expect(res.account.email.value).toEqual('user-update2@test.com');
    expect(res.account.username).toEqual('newUsername2');
  });

  it('[updateAccount] should not modify account id', async () => {
    const account = await service.findByAccountId('accountId1');
    account.accountId = 'updateAccountId';
    const accountUpdated = await account.save();

    expect(accountUpdated.accountId).toEqual('accountId1');
  });
});
