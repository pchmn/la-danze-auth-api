import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { ErrorType, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { RandomStringUtils } from '../../../core/utils/random-string.utils';
import { EmailTokensDocument } from '../mongo-schemas/email-tokens.mongo.schema';

@Injectable()
export class EmailTokenService {

  constructor(@InjectModel(EmailTokensDocument.name) private emailTokenModel: Model<EmailTokensDocument>) { }

  /**
   * Create a new email token
   *
   * @param account the user associated with the email token
   * @returns the created email token 
   */
  async createEmailToken(account: AccountDocument): Promise<EmailTokensDocument> {
    return new this.emailTokenModel({ account }).save();
  }

  /**
   * Create a new email confirm token
   * 
   * @param account the user associated with the confirm token
   * @returns the updated email token
   * 
   */
  async createNewConfirmToken(account: AccountDocument): Promise<EmailTokensDocument> {
    // Get original email token
    const emailToken = await this.emailTokenModel.findOne({ account });
    // If email token does not exist, create it
    if (!emailToken) {
      return new this.emailTokenModel({
        account
      }).save();
    }
    // Create new confirm token
    emailToken.confirmToken = { value: RandomStringUtils.createToken() };
    return emailToken.save();
  }

  /**
   * Validate a confirm token
   * 
   * @param confirmToken the confirm token
   * @returns the email token
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is not found
   *  - token is not valid (expired)
   */
  async validateConfirmToken(confirmToken: string): Promise<EmailTokensDocument> {
    // Get email token
    const emailToken = await this.emailTokenModel.findOne({ 'confirmToken.value': confirmToken }).populate('account');
    // Token not valid
    if (!emailToken || !emailToken.isConfirmTokenValid) {
      throw LaDanzeError.create(ErrorType.InvalidConfirmtoken);
    }
    // Token valid
    return emailToken;
  }

  /**
   * Create a new email change password token
   * 
   * @param account the user associated with the change password token
   * @returns the updated email token
   * 
   */
  async createNewResetPasswordToken(account: AccountDocument) {
    // Get original email token
    const emailToken = await this.emailTokenModel.findOne({ account });
    // If email token does not exist, create it
    if (!emailToken) {
      return new this.emailTokenModel({
        account,
        resetPasswordToken: { value: RandomStringUtils.createToken() }
      }).save();
    }
    // Create new reset password token
    emailToken.resetPasswordToken = { value: RandomStringUtils.createToken() };
    return emailToken.save();
  }

  /**
   * Validate a reset password token
   * 
   * @param resetPasswordToken the reset password token
   * @returns the email token
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - token is not found
   *  - token is not valid (expired)
   */
  async validateResetPasswordToken(resetPasswordToken: string): Promise<EmailTokensDocument> {
    // Get email token
    const emailToken = await this.emailTokenModel.findOne({ 'resetPasswordToken.value': resetPasswordToken }).populate('account');
    // Token not valid
    if (!emailToken || !emailToken.isResetPasswordTokenValid) {
      throw LaDanzeError.create(ErrorType.InvalidResetPasswordtoken);
    }
    // Token valid
    return emailToken;
  }
}