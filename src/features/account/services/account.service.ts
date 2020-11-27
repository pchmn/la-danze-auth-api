import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountDocument } from 'src/features/account/mongo-schemas/account.mongo.schema';
import { AccountRoleType, SignupInput } from 'src/generated/graphql.schema';
import { MongooseValidationErrorMapper } from 'src/shared/errors/mongoose-validation-error-mapper';

@Injectable()
export class AccountService {

  constructor(@InjectModel(AccountDocument.name) private accountModel: Model<AccountDocument>) { }

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

  async findByEmailOrUsername(emailOrUsername: string): Promise<AccountDocument> {
    return this.accountModel.findOne().or([{ 'email.value': emailOrUsername }, { username: emailOrUsername }]);
  }

  async findByAccountId(accountId: string): Promise<AccountDocument> {
    return this.accountModel.findOne({ accountId });
  }

}
