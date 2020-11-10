import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { AuthService } from '../services/auth.service';
import { AuthResolver } from './auth.resolver';


class AuthServiceMock {
  signup = jest.fn().mockResolvedValue(null);
  login = jest.fn().mockResolvedValue(null);
  refreshToken = jest.fn().mockResolvedValue(null);
}

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: AuthServiceMock
        }
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('[signup] should throw an error', () => {
    const error = LaDanzeError.create('"user1@test..com" is not a valid email', ErrorCode.WrongInput);
    authService.signup = jest.fn().mockRejectedValueOnce(error);
    expect(resolver.signup({ email: 'user1@test..com', username: 'user5', password: 'pwd' }))
      .rejects.toEqual(error);
  });

  it('[signup] should return tokens', () => {
    const tokens = { refreshToken: 'refreshToken', accessToken: 'accessToken' };
    authService.signup = jest.fn().mockResolvedValueOnce(tokens);
    expect(resolver.signup({ email: 'email', username: 'user', password: 'pwd' }))
      .resolves.toEqual(tokens);
  });

  it('[login] should throw an error', () => {
    const error = LaDanzeError.userNotFound('user5');
    authService.login = jest.fn().mockRejectedValueOnce(error);
    expect(resolver.login({ emailOrUsername: 'user', password: 'pwd' }))
      .rejects.toEqual(error);
  });

  it('[login] should return tokens', () => {
    const tokens = { refreshToken: 'refreshToken', accessToken: 'accessToken' };
    authService.login = jest.fn().mockResolvedValueOnce(tokens);
    expect(resolver.login({ emailOrUsername: 'user', password: 'pwd' }))
      .resolves.toEqual(tokens);
  });

  it('[refreshToken] should throw an error', () => {
    const error = LaDanzeError.invalidToken();
    authService.refreshToken = jest.fn().mockRejectedValueOnce(error);
    expect(resolver.refreshToken({ token: 'token' }))
      .rejects.toEqual(error);
  });

  it('[refreshToken] should return tokens', () => {
    const tokens = { refreshToken: 'refreshToken', accessToken: 'accessToken' };
    authService.refreshToken = jest.fn().mockResolvedValueOnce(tokens);
    expect(resolver.refreshToken({ token: 'token' }))
      .resolves.toEqual(tokens);
  });

  it('[confirmEmail] should throw an error', () => {
    const error = LaDanzeError.invalidToken();
    authService.confirmEmail = jest.fn().mockRejectedValueOnce(error);
    expect(resolver.confirmEmail({ token: 'token' }))
      .rejects.toEqual(error);
  });

  it('[confirmEmail] should return tokens', () => {
    const tokens = { refreshToken: 'refreshToken', accessToken: 'accessToken' };
    authService.confirmEmail = jest.fn().mockResolvedValueOnce(tokens);
    expect(resolver.confirmEmail({ token: 'token' }))
      .resolves.toEqual(tokens);
  });

  it('[confirmEmailQuery] should return tokens', () => {
    const tokens = { refreshToken: 'refreshToken', accessToken: 'accessToken' };
    authService.confirmEmail = jest.fn().mockResolvedValueOnce(tokens);
    expect(resolver.confirmEmailQuery('token'))
      .resolves.toEqual(tokens);
  });
});
