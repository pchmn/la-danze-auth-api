import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ApolloError } from 'apollo-server-express';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account.mongo.schema';
import { AuthTokens, LoginInput, ResetPasswordInput, SignupInput, TokenInput, UserRoleType } from 'src/generated/graphql.schema';
import { LaDanzeError } from 'src/shared/errors/la-danze-error';
import { MongooseValidationErrorMapper } from 'src/shared/errors/mongoose-validation-error-mapper';
import { RefreshTokenDocument } from '../mongo-schemas/refresh-token.mongo.schema';
import { EmailTokenService } from './email-token.service';
import { EmailService } from './email.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(AccountDocument.name) private userModel: Model<AccountDocument>,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private emailTokenService: EmailTokenService,
    private emailService: EmailService) { }

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
  async signup(input: SignupInput): Promise<AuthTokens> {
    // First create user
    const createdUser = await this.createUser(input);
    // Create email token
    const emailToken = await this.emailTokenService.createEmailToken(createdUser);
    // Send email (asynchron to not block sign up)
    this.emailService.sendEmail(emailToken);
    // Then create tokens
    return this.createTokens(createdUser);
  }

  /**
   * Create a user
   * 
   * @param input the signup input
   * @returns the user created
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - email or username already exist
   *  - email format is not valid 
   */
  private async createUser(input: SignupInput): Promise<AccountDocument> {
    // Init to wait mongoose to finish building index
    return this.userModel.init()
      .then(() => new this.userModel({
        email: { value: input.email },
        username: input.username,
        password: input.password,
        roles: [{ application: 'twitter', role: UserRoleType.ADMIN }]
      }).save())
      // Map mongoose ValidationError to LaDanzeError
      .catch(err => { throw MongooseValidationErrorMapper.mapEmailAndUsernameErrors(err) });
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
  async login(input: LoginInput): Promise<AuthTokens> {
    // Get user
    const user = await this.userModel.findOne().or([{ 'email.value': input.emailOrUsername }, { username: input.emailOrUsername }]);
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
  async confirmEmailQuery(token: string): Promise<AuthTokens> {
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
  async confirmEmail(input: TokenInput): Promise<AuthTokens> {
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
  async resetPassword(input: ResetPasswordInput): Promise<AuthTokens> {
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
  async refreshToken(input: TokenInput) {
    // Refresh token
    const refreshToken = await this.refreshTokenService.refreshToken(input.token);
    // Create refresh and access tokens in parallel
    return this.createTokens(refreshToken.user, refreshToken);
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
  private async createTokens(user: AccountDocument, refreshToken?: RefreshTokenDocument): Promise<AuthTokens> {
    // If refresh token is already created, use it directly
    const refreshToken$ = refreshToken ? refreshToken : this.refreshTokenService.createRefreshToken(user)
    // Create refresh and access tokens in parallel
    return Promise.all([refreshToken$, this.createAccessToken(user)])
      .then(([newRefreshToken, accessToken]) => {
        // Return refresh and access tokens
        return { refreshToken: newRefreshToken.token, accessToken };
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
    return new Promise((resolve, reject) => {
      // Create token (180s lifetime)
      jwt.sign({ username: user.username, roles: user.roles, createdAt: user.createdAt }, this.configService.get('jwt.privateKey'), { algorithm: 'RS256', expiresIn: '180s' }, (err, token) => {
        if (err) {
          return reject(LaDanzeError.cantCreateToken());
        }
        return resolve(token);
      });
    })
  }
}
