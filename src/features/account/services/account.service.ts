import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountRoleType, ChangeEmailAndUsernameInput, ChangePasswordInput, SignupInput } from 'src/generated/graphql.schema';
import { ErrorType, LaDanzeError } from 'src/shared/errors/la-danze-error';
import { MongooseValidationErrorMapper } from 'src/shared/errors/mongoose-validation-error-mapper';

@Injectable()
export class AccountService {

  constructor(@InjectModel(AccountDocument.name) private accountModel: Model<AccountDocument>) { }

  /**
 * Create an account
 * 
 * @param input the signup input
 * @returns the account created
 * 
 * @throws {LaDanzeError}
 * This exception is thrown if:
 *  - email or username already exist
 *  - email format is not valid 
 */
  async createAccount(input: SignupInput): Promise<AccountDocument> {
    // Init to wait mongoose to finish building index
    return this.accountModel.init()
      .then(() => new this.accountModel({
        email: { value: input.email },
        username: input.username,
        password: input.password,
        roles: [{ application: 'twitter', role: AccountRoleType.ADMIN }]
      }).save())
      // Map mongoose ValidationError to LaDanzeError
      .catch(err => { throw MongooseValidationErrorMapper.mapEmailAndUsernameErrors(err) });
  }

  /**
   * Find account by email or username
   * 
   * @param emailOrUsername the email or username
   * @returns the account found
   */
  async findByEmailOrUsername(emailOrUsername: string, checkNotFound = true): Promise<AccountDocument> {
    const account = await this.accountModel.findOne().or([{ 'email.value': emailOrUsername }, { username: emailOrUsername }]);
    // Check not found
    if (checkNotFound && !account) {
      throw LaDanzeError.create(ErrorType.AccountNotFound);
    }
    return account;
  }

  /**
   * Find account by account id
   * 
   * @param accountId the account id
   * @returns the account found
   */
  async findByAccountId(accountId: string, checkNotFound = true): Promise<AccountDocument> {
    const account = await this.accountModel.findOne({ accountId });
    // Check not found
    if (checkNotFound && !account) {
      throw LaDanzeError.create(ErrorType.AccountNotFound);
    }
    return account;
  }

  /**
   * Change account password
   * 
   * @param accountId the account id of the account to update
   * @param input the input containing old and new password
   * @returns the updated account
   * 
   * @throws {LaDanzeError}
   * This exception is thrown if:
   *  - account not found
   *  - wrong old password
   */
  async changePassword(accountId: string, input: ChangePasswordInput) {
    const account = await this.findByAccountId(accountId);
    // Check old password
    if (!(await account.validatePassword(input.oldPassword))) {
      throw LaDanzeError.create(ErrorType.WrongCredentials);
    }
    // Change password
    account.password = input.newPassword;
    // Save account
    return account.save()
      // Map mongoose ValidationError to LaDanzeError
      .catch(err => { throw MongooseValidationErrorMapper.mapEmailAndUsernameErrors(err) });
  }

  async changeEmailAndUsername(accountId: string, input: ChangeEmailAndUsernameInput): Promise<{ account: AccountDocument, emailHasChanged: boolean }> {
    let account = await this.findByAccountId(accountId);
    // Change email and username
    account.email.value = input.newEmail;
    account.username = input.newUsername;
    const emailHasChanged = account.isModified('email');
    // Save only if account has changed
    if (account.isModified()) {
      account = await account.save()
        // Map mongoose ValidationError to LaDanzeError
        .catch(err => { throw MongooseValidationErrorMapper.mapEmailAndUsernameErrors(err) });;
    }
    // Return res
    return { account, emailHasChanged };
  }

}
