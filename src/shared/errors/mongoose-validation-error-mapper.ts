import { Error } from 'mongoose';
import { ErrorCode, LaDanzeError } from './la-danze-error';

export class MongooseValidationErrorMapper {
  static mapEmailAndUsernameErrors(validationError: Error.ValidationError): LaDanzeError {
    const validatorErrors: { [path: string]: Error.ValidatorError | Error.CastError } = validationError.errors;

    if (!validatorErrors) {
      return LaDanzeError.unknownError();
    }

    const emailInvalidErrorMsg = validatorErrors.email && validatorErrors.email.kind === 'invalid' ? validatorErrors.email.message : null;
    const uniqueEmailErrorMsg = validatorErrors.email && validatorErrors.email.kind === 'unique' ? validatorErrors.email.message : null;
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