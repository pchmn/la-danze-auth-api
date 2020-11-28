import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorType, LaDanzeError } from 'src/app/shared/errors/la-danze-error';
import { AccessToken, Account, LoginInput, ResetPasswordInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { AccountDocument } from '../../account/mongo-schemas/account.mongo.schema';
import { AccountService } from '../../account/services/account.service';
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
  async signup(input: SignupInput): Promise<AccessToken> {
    // First create user
    const createdAccount = await this.accountService.createAccount(input);
    // Create email confirmation and access token
    return this.createEmailConfirmation(createdAccount);
  }

  async createEmailConfirmation(account: AccountDocument): Promise<AccessToken> {
    // Create email token
    const emailToken = await this.emailTokenService.createNewConfirmToken(account);
    // Send email (asynchron to not block sign up)
    this.emailService.sendEmail(emailToken);
    // Create access token
    return this.createAccessToken(account);
  }

  /**
   * Login a user
   * 
   * @param input the login input
   * @returns refresh and access tokens 
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - account is not found
   *  - password is wrong
   */
  async login(input: LoginInput): Promise<AccessToken> {
    // Get user
    const account = await this.accountService.findByEmailOrUsername(input.emailOrUsername);
    // Check password
    if (!(await account.validatePassword(input.password))) {
      throw LaDanzeError.create(ErrorType.WrongCredentials);
    }
    // Create refresh and access tokens
    return this.createAccessToken(account);
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
  async confirmEmailQuery(token: string): Promise<AccessToken> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateConfirmToken(token);
    // Create refresh and access tokens
    return this.createAccessToken(validatedEmailToken.account);
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
  async confirmEmail(input: TokenInput): Promise<AccessToken> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateConfirmToken(input.token);
    // Create refresh and access tokens
    return this.createAccessToken(validatedEmailToken.account);
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
  async resetPassword(input: ResetPasswordInput): Promise<AccessToken> {
    // Validate token
    const validatedEmailToken = await this.emailTokenService.validateResetPasswordToken(input.token);
    // Change password
    validatedEmailToken.account.password = input.password;
    const updatedUser = await validatedEmailToken.account.save();
    // Create refresh and access tokens
    return this.createAccessToken(updatedUser);
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
  async refreshToken(refreshToken: string): Promise<AccessToken> {
    // Refresh token
    const refreshTokenDoc = await this.refreshTokenService.revokeToken(refreshToken);
    // Create refresh and access tokens in parallel
    return this.createAccessToken(refreshTokenDoc.account);
  }

  /**
   * Create an access token (JWT)
   * 
   * @param account the user to authenticate with the access token
   * @returns an access token (JWT)
   * 
   * @throws {LaDanzeError} if access token can't be created
   */
  async createAccessToken(account: AccountDocument): Promise<AccessToken> {
    const accountPayload: Account = {
      accountId: account.accountId,
      email: account.email,
      username: account.username,
      roles: account.roles,
      createdAt: account.createdAt,
      // isActive: account.isActive
    }
    // Create token (180s lifetime)
    return this.jwtService.signAsync(accountPayload)
      .then(accessToken => { return { accessToken } })
      .catch((err) => {
        console.log(err)
        throw LaDanzeError.create(ErrorType.CantCreateAccessToken);
      });
  }
}
