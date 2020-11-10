import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/features/user.mongo.schema';
import { ErrorCode, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { EmailTokenDocument } from '../mongo-schemas/email-token.mongo.schema';
import { RandomToken } from '../utils/random-token';

@Injectable()
export class EmailTokenService {

  constructor(@InjectModel(EmailTokenDocument.name) private emailTokenModel: Model<EmailTokenDocument>) { }

  /**
   * Create a new email token
   *
   * @param user the user associated with the email token
   * @returns the created email token 
   */
  async createEmailToken(user: UserDocument) {
    return new this.emailTokenModel({
      user: user
    }).save();
  }

  /**
   * Create a new email confirm token
   * 
   * @param user the user associated with the confirm token
   * @returns the updated email token
   * 
   */
  async createNewConfirmToken(user: UserDocument): Promise<EmailTokenDocument> {
    // Get original email token
    const emailToken = await this.emailTokenModel.findOne({ user });
    // If email token does not exist, create it
    if (!emailToken) {
      return new this.emailTokenModel({
        user: user
      }).save();
    }
    // Create new confirm token
    emailToken.confirmToken = { value: RandomToken.create() };
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
  async validateConfirmToken(confirmToken: string): Promise<EmailTokenDocument> {
    // Get email token
    const emailToken = await this.emailTokenModel.findOne({ 'confirmToken.value': confirmToken }).populate('user');
    // Token not found
    if (!emailToken) {
      throw LaDanzeError.create('confirmToken not found', ErrorCode.NotFound);
    }
    // Token not valid (expired)
    if (!emailToken.isConfirmTokenValid) {
      throw LaDanzeError.create('confirmToken not valid', ErrorCode.WrongInput);
    }
    // Token valid
    return emailToken;
  }

  // /**
  //  * Create a new email change password token
  //  * 
  //  * @param user the user associated with the change password token
  //  * @returns the updated email token
  //  * 
  //  */
  // async createNewResetPasswordToken(user: UserDocument) {
  //   // Get original email token
  //   const emailToken = await this.emailTokenModel.findOne({ user });
  //   // If email token does not exist, create it
  //   if (!emailToken) {
  //     return new this.emailTokenModel({
  //       user: user,
  //       changePasswordToken: { value: RandomToken.create() }
  //     }).save();
  //   }
  //   // Create new change password token
  //   emailToken.resetPasswordToken = { value: RandomToken.create() };
  //   return emailToken.save();
  // }

  // /**
  //  * Validate a reset password token
  //  * 
  //  * @param resetPasswordToken the reset password token
  //  * @returns the email token
  //  * 
  //  * @throws {LaDanzeError}
  //  * This exception is thrown if:
  //  *  - token is not found
  //  *  - token is not valid (expired)
  //  */
  // async validateResetPasswordToken(resetPasswordToken: string): Promise<EmailTokenDocument> {
  //   // Get email token
  //   const emailToken = await this.emailTokenModel.findOne({ 'resetPasswordToken.value': resetPasswordToken }).populate('user');
  //   // Token not found
  //   if (!emailToken) {
  //     throw LaDanzeError.create('changePasswordToken not found', ErrorCode.NotFound);
  //   }
  //   // Token not valid (expired)
  //   if (!emailToken.isResetPasswordTokenValid) {
  //     throw LaDanzeError.create('changePasswordToken not valid', ErrorCode.WrongInput);
  //   }
  //   // Token valid
  //   return emailToken;
  // }
}