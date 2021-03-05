import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { generateKeyPair } from 'crypto';
import { ErrorType, LaDanzeError } from 'src/app/shared/errors/la-danze-error';
import { AuthService } from '../services/auth.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { AuthResolver } from './auth.resolver';


class AuthServiceMock {
  signUp = jest.fn().mockResolvedValue(null);
  signIn = jest.fn().mockResolvedValue(null);
  refreshToken = jest.fn().mockResolvedValue(null);
}

class RefreshTokenServiceMock {
  createRefreshTokenForAccount = jest.fn().mockResolvedValue(null);
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

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService

  beforeAll(async () => {
    // Generate key pair
    const keyPair = await generateKeyPairPromise();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey
        })
      ],
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: AuthServiceMock
        },
        {
          provide: RefreshTokenService,
          useValue: RefreshTokenServiceMock
        }
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('[signUp] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.InvalidEmail('"user1@test..com" is not a valid email'));
    authService.signUp = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.signUp({ email: 'user1@test..com', username: 'user5', password: 'pwd' }))
      .rejects.toEqual(error);
  });

  it('[signUp] should return tokens', () => {
    const authToken = { accessToken: 'accessToken' };
    authService.signUp = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.signUp({ email: 'email', username: 'user', password: 'pwd' }))
      .resolves.toEqual(authToken);
  });

  it('[signIn] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.AccountNotFound);
    authService.signIn = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.signIn({ emailOrUsername: 'user', password: 'pwd' }))
      .rejects.toEqual(error);
  });

  it('[signIn] should return tokens', () => {
    const authToken = { accessToken: 'accessToken' };
    authService.signIn = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.signIn({ emailOrUsername: 'user', password: 'pwd' }))
      .resolves.toEqual(authToken);
  });

  it('[refreshToken] should throw an error', () => {
    const ctx = {
      req: {
        cookies: {
          refreshToken: 'refreshToken'
        }
      }
    }
    const error = LaDanzeError.create(ErrorType.InvalidRefreshToken);
    authService.refreshToken = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.refreshToken(ctx))
      .rejects.toEqual(error);
  });

  it('[refreshToken] should return tokens', () => {
    const ctx = {
      req: {
        cookies: {
          refreshToken: 'refreshToken'
        }
      }
    };
    const authToken = { accessToken: 'accessToken' };
    authService.refreshToken = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.refreshToken(ctx))
      .resolves.toEqual(authToken);
  });

  it('[confirmEmail] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.InvalidRefreshToken);
    authService.confirmEmail = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.confirmEmail({ token: 'token' }))
      .rejects.toEqual(error);
  });

  it('[confirmEmail] should return tokens', () => {
    const authToken = { accessToken: 'accessToken' };
    authService.confirmEmail = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.confirmEmail({ token: 'token' }))
      .resolves.toEqual(authToken);
  });

  it('[confirmEmailQuery] should return tokens', () => {
    const authToken = { accessToken: 'accessToken' };
    authService.confirmEmailQuery = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.confirmEmailQuery('token'))
      .resolves.toEqual(authToken);
  });

  it('[resetPassword] should throw an error', () => {
    const error = LaDanzeError.create(ErrorType.InvalidRefreshToken);
    authService.resetPassword = jest.fn().mockRejectedValueOnce(error);
    return expect(resolver.resetPassword({ token: 'token', password: 'pwd' }))
      .rejects.toEqual(error);
  });

  it('[resetPassword] should return tokens', () => {
    const authToken = { accessToken: 'accessToken' };
    authService.resetPassword = jest.fn().mockResolvedValueOnce(authToken);
    return expect(resolver.resetPassword({ token: 'token', password: 'pwd' }))
      .resolves.toEqual(authToken);
  });
});
