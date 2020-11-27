import { ConfigService } from '@nestjs/config';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { AccountDocument, AccountSchema } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { ErrorCode, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';
import { RandomStringUtils } from '../../../core/utils/random-string.utils';
import { EmailTokensDocument, EmailTokensSchema } from '../mongo-schemas/email-tokens.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from '../mongo-schemas/refresh-token.mongo.schema';
import { EmailTokenService } from './email-token.service';
import { RefreshTokenService } from './refresh-token.service';

describe('EmailTokenService', () => {
  let service: EmailTokenService;
  let connection: Connection;
  let userModel: Model<AccountDocument>;
  let emailTokenModel: Model<EmailTokensDocument>;

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
          { name: RefreshTokenDocument.name, schema: RefreshTokenSchema },
          { name: EmailTokensDocument.name, schema: EmailTokensSchema }
        ])
      ],
      providers: [
        ConfigService,
        RefreshTokenService,
        EmailTokenService
      ]
    }).compile();

    service = module.get<EmailTokenService>(EmailTokenService);
    userModel = module.get<Model<AccountDocument>>(`${AccountDocument.name}Model`);
    emailTokenModel = module.get<Model<EmailTokensDocument>>(`${EmailTokensDocument.name}Model`);
    connection = await module.get(getConnectionToken());

    // Insert test data
    await InMemoryMongodb.insertTestData(userModel, null, emailTokenModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[createEmailToken] should create a new email token', async () => {
    const user = new userModel();
    const emailtoken = await service.createEmailToken(user);
    // Check user
    expect(emailtoken.user).toEqual(user);
    // Check token length
    expect(emailtoken.confirmToken.value.length).toBe(64);
    // Check expiresAt (7 days)
    expect(emailtoken.getResetPasswordTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);
    // No reset token
    expect(emailtoken.resetPasswordToken.value).toBeUndefined();
    expect(emailtoken.resetPasswordToken.expiresAt).toBeUndefined();
  });

  it('[validateConfirmToken] should throw an error (token not found)', () => {
    return expect(service.validateConfirmToken('notoken')).rejects.toEqual(LaDanzeError.create('confirmToken not found', ErrorCode.NotFound));
  });

  it('[validateConfirmToken] should throw an error (token not valid)', () => {
    return expect(service.validateConfirmToken('token1')).rejects.toEqual(LaDanzeError.create('confirmToken not valid', ErrorCode.WrongInput));
  });

  it('[validateConfirmToken] should validate confirm token', async () => {
    const emailToken = await service.validateConfirmToken('token2');
    expect(emailToken.confirmToken.value).toEqual('token2');
    expect(emailToken.user.username).toEqual('user2');
  });

  it('[createNewConfirmToken] should create a new confirm token (email token exists)', async () => {
    const emailToken = await emailTokenModel.findOne({ 'confirmToken.value': 'token1' }).populate('user');

    const updatedEmailToken = await service.createNewConfirmToken(emailToken.user);
    // Compare user
    expect(emailToken.user._id).toEqual(updatedEmailToken.user._id);
    // Compare token
    expect(emailToken.confirmToken.value).not.toEqual(updatedEmailToken.confirmToken.value);
    // Compare dates
    expect(emailToken.getConfirmTokenExpiresAt()).toBeLessThan(updatedEmailToken.getConfirmTokenExpiresAt());

    // Check token length
    expect(updatedEmailToken.confirmToken.value.length).toBe(64);
    // Check expiresAt (7 days)
    expect(updatedEmailToken.getConfirmTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);
  });

  it('[createNewConfirmToken] should create a new email token (email token does not exist)', async () => {
    const user = await userModel.findOne({ username: 'user7' });
    const emailToken = await service.createNewConfirmToken(user);
    // Compare user
    expect(emailToken.user._id).toEqual(user._id);
    // Check confirm token length
    expect(emailToken.confirmToken.value).not.toBeUndefined();
    // Check confirm expiresAt (7 days)
    expect(emailToken.getConfirmTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);
  });

  it('[createNewResetPasswordToken] should create a new reset password token (email token exists)', async () => {
    const emailToken = await emailTokenModel.findOne({ 'confirmToken.value': 'token6' }).populate('user');

    const updatedEmailToken = await service.createNewResetPasswordToken(emailToken.user);
    // Compare user
    expect(updatedEmailToken.user._id).toEqual(updatedEmailToken.user._id);
    // Compare token
    expect(updatedEmailToken.confirmToken.value).not.toBeUndefined();

    // Check token length
    expect(updatedEmailToken.resetPasswordToken.value.length).toBe(64);
    // Check expiresAt (7 days)
    expect(updatedEmailToken.getResetPasswordTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);
  });

  it('[createNewResetPasswordToken] should create a new email token (email token does not exist)', async () => {
    const user = await userModel.findOne({ username: 'user8' });
    const emailToken = await service.createNewResetPasswordToken(user);
    // Compare user
    expect(emailToken.user._id).toEqual(user._id);
    // Check confirm token length
    expect(emailToken.confirmToken.value.length).toBe(64);
    // Check confirm expiresAt (7 days)
    expect(emailToken.getConfirmTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);

    // Check token length
    expect(emailToken.resetPasswordToken.value.length).toBe(64);
    // Check expiresAt (7 days)
    expect(emailToken.getResetPasswordTokenExpiresAt()).toBeLessThanOrEqual(Date.now() + RandomStringUtils.TOKEN_LIFE_TIME);
  });

  it('[validateResetPasswordToken] should throw an error (token not found)', () => {
    return expect(service.validateResetPasswordToken('notoken')).rejects.toEqual(LaDanzeError.create('resetPasswordToken not found', ErrorCode.NotFound));
  });

  it('[validateResetPasswordToken] should throw an error (token not valid)', () => {
    return expect(service.validateResetPasswordToken('token4')).rejects.toEqual(LaDanzeError.create('resetPasswordToken not valid', ErrorCode.WrongInput));
  });

  it('[validateResetPasswordToken] should validate reset password token', async () => {
    const emailToken = await service.validateResetPasswordToken('token5');
    expect(emailToken.resetPasswordToken.value).toEqual('token5');
    expect(emailToken.user.username).toEqual('user5');
  });
});
