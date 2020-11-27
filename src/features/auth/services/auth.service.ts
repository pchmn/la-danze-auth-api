import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApolloError } from 'apollo-server-express';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountService } from 'src/features/account/services/account.service';
import { AccessToken, LoginInput, ResetPasswordInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { LaDanzeError } from 'src/shared/errors/la-danze-error';
import { RefreshTokenDocument } from '../mongo-schemas/refresh-token.mongo.schema';
import { EmailTokenService } from './email-token.service';
import { EmailService } from './email.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {

  constructor(
    private refreshTokenService: RefreshTokenService,
    private emailTokenService: EmailTokenService,
    private emailService: EmailService,
    private accountService: AccountService,
    private jwtService: JwtService) { }

  /**
   * Signup new user
   * 
   * @param input the signup input
   * @returns refresh and access tokens
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - email or username already exist
   *  - email format is not valid 
   */
  async signup(input: SignupInput): Promise<[string, AccessToken]> {
    // First create user
    const createdUser = await this.accountService.createAccount(input);
    // Create email token
    const emailToken = await this.emailTokenService.createEmailToken(createdUser);
    // Send email (asynchron to not block sign up)
    this.emailService.sendEmail(emailToken);
    // Then create tokens
    return this.createTokens(createdUser);
  }

  /**
   * Login a user
   * 
   * @param input the login input
   * @returns refresh and access tokens 
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - user is not found
   *  - password is wrong
   */
  async login(input: LoginInput): Promise<[string, AccessToken]> {
    // Get user
    const user = await this.accountService.findByEmailOrUsername(input.emailOrUsername);
    // Check if user exists
    if (!user) {
      throw LaDanzeError.userNotFound(input.emailOrUsername);
    }
    // Check password
    if (!(await user.validatePassword(input.password))) {
      throw LaDanzeError.wrongCredentials();
    }
    // Create refresh and access tokens
    return this.createTokens(user);
  }

  /**
   * Confirm email
   * 
   * @param input the token input
   * @returns refresh and access tokens
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is not found
   *  - token is not valid (expired)
   */
  async confirmEmailQuery(token: string): Promise<[string, AccessToken]> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateConfirmToken(token);
    // Create refresh and access tokens
    return this.createTokens(validatedEmailToken.user);
  }

  /**
   * Confirm email
   * 
   * @param input the token input
   * @returns refresh and access tokens
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is not found
   *  - token is not valid (expired)
   */
  async confirmEmail(input: TokenInput): Promise<[string, AccessToken]> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateConfirmToken(input.token);
    // Create refresh and access tokens
    return this.createTokens(validatedEmailToken.user);
  }

  /**
   * Reset password
   * 
   * @param input the reset password input (token, new password)
   * @returns refresh and access tokens
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is not found
   *  - token is not valid (expired)
   */
  async resetPassword(input: ResetPasswordInput): Promise<[string, AccessToken]> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateResetPasswordToken(input.token);
    // Change password
    validatedEmailToken.user.password = input.password;
    const updatedUser = await validatedEmailToken.user.save();
    // Create refresh and access tokens
    return this.createTokens(updatedUser);
  }

  /**
   * Refresh a token
   *
   * @param input the token input
   * @returns new refresh and access tokens
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is expired
   *  - token is revoked
   *  - token is not found
   */
  async refreshToken(refreshToken: string) {
    // Refresh token
    const refreshTokenDoc = await this.refreshTokenService.refreshToken(refreshToken);
    // Create refresh and access tokens in parallel
    return this.createTokens(refreshTokenDoc.user, refreshTokenDoc);
  }

  /**
   * Create refresh and access tokens
   * 
   * @param user the user to authenticate with the tokens
   * @param [refreshToken] the refresh token already created
   * @returns refresh and access tokens 
   * 
   * @throws {LaDanzeError} if access token can't be created
   */
  private async createTokens(user: AccountDocument, refreshToken?: RefreshTokenDocument): Promise<[string, AccessToken]> {
    // If refresh token is already created, use it directly
    const refreshToken$ = refreshToken ? refreshToken : this.refreshTokenService.createRefreshToken(user)
    // Create refresh and access tokens in parallel
    return Promise.all([refreshToken$, this.createAccessToken(user)])
      .then(([newRefreshToken, accessToken]) => {
        // Return refresh and access tokens
        return [newRefreshToken.token, { accessToken }] as [string, AccessToken];
      })
      .catch((err: ApolloError) => { throw err; });
  }

  /**
   * Create an access token (JWT)
   * 
   * @param user the user to authenticate with the access token
   * @returns an access token (JWT)
   * 
   * @throws {LaDanzeError} if access token can't be created
   */
  private async createAccessToken(user: AccountDocument): Promise<string> {
    // Create token (180s lifetime)
    return this.jwtService.signAsync({ username: user.username, roles: user.roles, createdAt: user.createdAt }, { algorithm: 'RS256', expiresIn: '180s' })
      .catch((err) => {
        console.log(err)
        throw LaDanzeError.cantCreateToken();
      });
  }
}
