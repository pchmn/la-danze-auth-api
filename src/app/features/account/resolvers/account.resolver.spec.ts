import { Test, TestingModule } from '@nestjs/testing';
import { ErrorType, LaDanzeError } from 'src/app/shared/errors/la-danze-error';
import { Account } from 'src/generated/graphql.schema';
import { AuthService } from '../../auth/services/auth.service';
import { AccountService } from '../services/account.service';
import { AccountResolver } from './account.resolver';


class AuthServiceMock {
  createAccessToken = jest.fn().mockResolvedValue(null);
  createEmailConfirmation = jest.fn().mockResolvedValue(null);
}

class AccountServiceMock {
  findByAccountId = jest.fn().mockResolvedValue(null);
  changePassword = jest.fn().mockResolvedValue(null);
  changeEmailAndUsername = jest.fn().mockResolvedValue(null);
}

describe('AccountResolver', () => {
  let resolver: AccountResolver;
  let accountService: AccountService;
  let authService: AuthService;

  beforeAll(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountResolver,
        {
          provide: AccountService,
          useValue: AccountServiceMock
        },
        {
          provide: AuthService,
          useValue: AuthServiceMock
        }
      ],
    }).compile();

    resolver = module.get<AccountResolver>(AccountResolver);
    accountService = module.get<AccountService>(AccountService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('[myAccount] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.AccountNotFound);
    accountService.findByAccountId = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.myAccount({ accountId: 'noAccount' }))
      .rejects.toEqual(error);
  });

  it('[myAccount] should return my account', async () => {
    const account: Account = { accountId: 'accountId', username: 'username' };
    accountService.findByAccountId = jest.fn().mockResolvedValueOnce(account);
    const myAccount = await resolver.myAccount({ accountId: 'accountId' });
    expect(myAccount).not.toBeNull();
    expect(myAccount).toEqual(account);
  });

  it('[changePassword] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.WrongCredentials);
    accountService.changePassword = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.changePassword({ accountId: 'accountId' }, { oldPassword: 'nopassword', newPassword: 'newpassword' }))
      .rejects.toEqual(error);
  });

  it('[changePassword] should change password', async () => {
    const account: Account = { accountId: 'accountId', username: 'username' };
    accountService.changePassword = jest.fn().mockResolvedValueOnce(account);
    const res = await resolver.changePassword({ accountId: 'accountId' }, { oldPassword: 'oldpassword', newPassword: 'newpassword' });
    expect(res).not.toBeNull();
    expect(res).toEqual('password updated');
  });

  it('[changeEmailAndUsername] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.InvalidEmail('email not valid'));
    accountService.changeEmailAndUsername = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.changeEmailAndUsername({ accountId: 'accountId' }, { newEmail: 'email@test.com', newUsername: 'newUsername' }))
      .rejects.toEqual(error);
  });

  it('[changeEmailAndUsername] should change email', async () => {
    const account: Account = { accountId: 'accountId', username: 'username' };
    accountService.changeEmailAndUsername = jest.fn().mockResolvedValueOnce({ account, emailHasChanged: true });
    authService.createEmailConfirmation = jest.fn().mockResolvedValueOnce({ accessToken: 'accessToken' });

    const authToken = await resolver.changeEmailAndUsername({ accountId: 'accountId' }, { newEmail: 'email@test.com', newUsername: 'newUsername' });

    expect(authToken.accessToken).toEqual('accessToken');
    expect(authService.createEmailConfirmation).toHaveBeenCalledWith(account);
  });

  it('[changeEmailAndUsername] should change username', async () => {
    const account: Account = { accountId: 'accountId', username: 'username' };
    accountService.changeEmailAndUsername = jest.fn().mockResolvedValueOnce({ account, emailHasChanged: false });
    authService.createAccessToken = jest.fn().mockResolvedValueOnce({ accessToken: 'accessToken' });

    const authToken = await resolver.changeEmailAndUsername({ accountId: 'accountId' }, { newEmail: 'email@test.com', newUsername: 'newUsername' });

    expect(authToken.accessToken).toEqual('accessToken');
    expect(authService.createAccessToken).toHaveBeenCalledWith(account);
  });
});
