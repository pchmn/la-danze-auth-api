import { JwtModule, JwtService } from '@nestjs/jwt';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { generateKeyPair } from 'crypto';
import { Connection, Model } from 'mongoose';
import { AccountDocument, AccountSchema } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountService } from 'src/features/account/services/account.service';
import { ErrorType, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';
import { EmailTokensDocument, EmailTokensSchema } from '../mongo-schemas/email-tokens.mongo.schema';
import { RefreshTokenDocument, RefreshTokenSchema } from '../mongo-schemas/refresh-token.mongo.schema';
import { AuthService } from './auth.service';
import { EmailTokenService } from './email-token.service';
import { EmailService } from './email.service';
import { RefreshTokenService } from './refresh-token.service';


class EmailServiceMock {
  sendEmail(emailToken: EmailTokensDocument) { };
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
  let emailService: EmailService;
  let jwtService: JwtService;
  let connection: Connection;
  let refreshTokenModel: Model<RefreshTokenDocument>;
  let accountModel: Model<AccountDocument>;
  let emailTokenModel: Model<EmailTokensDocument>;

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
          { name: AccountDocument.name, schema: AccountSchema },
          { name: RefreshTokenDocument.name, schema: RefreshTokenSchema },
          { name: EmailTokensDocument.name, schema: EmailTokensSchema }
        ]),
        JwtModule.register({
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey
        })
      ],
      providers: [
        RefreshTokenService,
        AuthService,
        EmailTokenService,
        AccountService,
        {
          provide: EmailService,
          useClass: EmailServiceMock
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenModel = module.get<Model<RefreshTokenDocument>>(`${RefreshTokenDocument.name}Model`);
    accountModel = module.get<Model<AccountDocument>>(`${AccountDocument.name}Model`);
    emailTokenModel = module.get<Model<EmailTokensDocument>>(`${EmailTokensDocument.name}Model`);
    connection = await module.get(getConnectionToken());

    // Insert test data
    await InMemoryMongodb.insertTestData(accountModel, refreshTokenModel, emailTokenModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[signup] should throw an error (email not valid)', () => {
    return expect(service.signup({ email: 'user1@test..com', username: 'newUser', password: '12345678' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.InvalidEmail('"user1@test..com" is not a valid email')));
  });

  it('[signup] should create a user and return tokens', async () => {
    const spy = spyOn(emailService, 'sendEmail');
    const authToken = await service.signup({ email: 'unique@test.com', username: 'unique', password: '12345678' });
    const createdUser = await accountModel.findOne({ 'email.value': 'unique@test.com' });
    const emailToken = await emailTokenModel.findOne({ account: createdUser });
    // Check created user
    expect(createdUser).not.toBeNull();
    expect(createdUser.username).toEqual('unique');
    // Check email token
    expect(emailToken.confirmToken.value.length).toEqual(64);
    // Check email sent
    expect(spy).toHaveBeenCalled();
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('unique');
    });
  });

  it('[login] should throw an error (user not found)', () => {
    return expect(service.login({ emailOrUsername: 'nouser', password: 'pwd1' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.AccountNotFound('nouser')));
  });

  it('[login] should throw an error (wrong password)', () => {
    return expect(service.login({ emailOrUsername: 'user1', password: 'pwd' }))
      .rejects.toEqual(LaDanzeError.create(ErrorType.WrongCredentials));
  });

  it('[login] should return tokens (username login)', async () => {
    const authToken = await service.login({ emailOrUsername: 'user1', password: 'pwd1' });
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('user1');
    });
  });

  it('[login] should return tokens (email login)', async () => {
    const authToken = await service.login({ emailOrUsername: 'user1@test.com', password: 'pwd1' });
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('user1');
    });
  });

  it('[confirmEmail] should throw an error (email token not found)', () => {
    return expect(service.confirmEmail({ token: 'notoken' })).rejects.toEqual(LaDanzeError.create(ErrorType.ConfirmTokenNotFound))
  });

  it('[confirmEmail] should throw an error (email token not valid)', () => {
    return expect(service.confirmEmail({ token: 'token1' })).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidConfirmtoken))
  });

  it('[confirmEmail] should return token', async () => {
    const authToken = await service.confirmEmail({ token: 'token2' });
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('user2');
    });
  });

  it('[resetPassword] should throw an error (email token not found)', () => {
    return expect(service.resetPassword({ token: 'notoken', password: '12345678' })).rejects.toEqual(LaDanzeError.create(ErrorType.ResetPasswordTokenNotFound))
  });

  it('[resetPassword] shTokenould throw an error (email token not valid)', () => {
    return expect(service.resetPassword({ token: 'token4', password: '12345678' })).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidResetPasswordtoken))
  });

  it('[resetPassword] should return token', async () => {
    const oldUser = await accountModel.findOne({ username: 'user5' });
    const authToken = await service.resetPassword({ token: 'token5', password: '12345678' });
    const newUser = await accountModel.findOne({ username: 'user5' });
    // Verify password has changed
    expect(oldUser.password).not.toEqual(newUser.password);
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('user5');
    });
  });


  it('[refreshToken] should throw an error (token not valid)', () => {
    return expect(service.refreshToken('token2')).rejects.toEqual(LaDanzeError.create(ErrorType.InvalidRefreshToken));
  });

  it('[refreshToken] should return tokens', async () => {
    const authToken = await service.refreshToken('token5');
    // Check access token
    jwtService.verifyAsync(authToken.accessToken).then(decoded => {
      expect(decoded.username).toEqual('user5');
    });
  });
});
