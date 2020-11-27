import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountService } from 'src/features/account/services/account.service';
import { ErrorType, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { RefreshTokenDocument } from '../mongo-schemas/refresh-token.mongo.schema';

@Injectable()
export class RefreshTokenService {

  constructor(
    @InjectModel(RefreshTokenDocument.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private accountService: AccountService) { }

  /**
   * Create a refresh token and save it in db
   *
   * @param account the user associated to the refresh token
   */
  async createRefreshToken(account: AccountDocument): Promise<RefreshTokenDocument> {
    return new this.refreshTokenModel({
      account: account
    }).save();
  }

  /**
   * Create a refresh token and save it in db
   *
   * @param user the user associated to the refresh token
   */
  async createRefreshTokenForAccount(accountId: string): Promise<RefreshTokenDocument> {
    const account = await this.accountService.findByAccountId(accountId);
    return new this.refreshTokenModel({ account }).save();
  }

  /**
   * Get a refresh token from db
   * 
   * @param token the value of the token to retrieve
   * @returns the retrieved refresh token
   * 
   * @throws {LaDanzeError} if token is expired or revoked
   */
  async getRefreshToken(token: string): Promise<RefreshTokenDocument> {
    // Get token
    const document: RefreshTokenDocument = await this.refreshTokenModel.findOne({ token }).populate('account');
    // Check token validity
    if (!document || !document.isActive) {
      throw LaDanzeError.create(ErrorType.InvalidRefreshToken);
    }
    return document;
  }

  /**
   * Revoke a token
   * 
   * @param token the value of the token to revoke
   * @returns the updated (revoked) token
   * 
   * @throws {LaDanzeError} if token is expired or revoked
   */
  async revokeToken(token: string): Promise<RefreshTokenDocument> {
    // Get token
    const document = await this.getRefreshToken(token);
    // Revoke token
    document.revokedAt = Date.now();
    return document.save();
  }

  /**
   * Refresh a token
   * 
   * It will revoke the token passed in param and create a new refresh token
   * 
   * @param token the value of the token to refresh
   * @returns the new refresh token 
   * 
   * @throws {LaDanzeError} if token is expired or revoked
   */
  async refreshToken(token: string): Promise<RefreshTokenDocument> {
    // Rirst revoke token
    const document = await this.revokeToken(token);
    // Then create a new one
    return this.createRefreshToken(document.account);
  }
}
