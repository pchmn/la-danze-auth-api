import { Error } from 'mongoose';
import { ErrorCode, LaDanzeError } from './la-danze-error';

export class MongooseValidationErrorMapper {
  static mapEmailAndUsernameErrors(validationError: Error.ValidationError): LaDanzeError {
    const validatorErrors: { [path: string]: Error.ValidatorError | Error.CastError } = validationError.errors;

    if (!validatorErrors) {
      return LaDanzeError.unknownError();
    }

    const emailInvalidErrorMsg = validatorErrors['email.value'] && validatorErrors['email.value'].kind === 'invalid' ? validatorErrors['email.value'].message.replace('email.value', 'email') : null;
    const uniqueEmailErrorMsg = validatorErrors['email.value'] && validatorErrors['email.value'].kind === 'unique' ? validatorErrors['email.value'].message.replace('email.value', 'email') : null;
    const uniqueUsernameErrorMsg = validatorErrors.username && validatorErrors.username.kind === 'unique' ? validatorErrors.username.message : null;

    if (!emailInvalidErrorMsg && !uniqueEmailErrorMsg && !uniqueUsernameErrorMsg) {
      return LaDanzeError.unknownError();
    }

    if (uniqueEmailErrorMsg && uniqueUsernameErrorMsg) {
      return LaDanzeError.create(`${uniqueEmailErrorMsg}, ${uniqueUsernameErrorMsg}`, ErrorCode.WrongInput);
    } else if (uniqueEmailErrorMsg) {
      return LaDanzeError.create(uniqueEmailErrorMsg, ErrorCode.WrongInput);
    } else if (uniqueUsernameErrorMsg) {
      return LaDanzeError.create(uniqueUsernameErrorMsg, ErrorCode.WrongInput);
    } else {
      return LaDanzeError.create(emailInvalidErrorMsg, ErrorCode.WrongInput);
    }
  }
}