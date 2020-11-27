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
    const passwordErrorMsg = validatorErrors.password && validatorErrors.password.kind === 'minlength' ? validatorErrors.password.message : null;

    if (!emailInvalidErrorMsg && !uniqueEmailErrorMsg && !uniqueUsernameErrorMsg && !passwordErrorMsg) {
      return LaDanzeError.unknownError();
    }

    if (uniqueEmailErrorMsg && uniqueUsernameErrorMsg && passwordErrorMsg) {
      return LaDanzeError.inputError(ErrorCode.EmailAndUsernameAlreadyExist, `${uniqueEmailErrorMsg}, ${uniqueUsernameErrorMsg}, ${passwordErrorMsg}`);
    } else if (uniqueEmailErrorMsg && uniqueUsernameErrorMsg) {
      return LaDanzeError.inputError(ErrorCode.EmailAndUsernameAlreadyExist, `${uniqueEmailErrorMsg}, ${uniqueUsernameErrorMsg}`);
    } else if (uniqueEmailErrorMsg) {
      return LaDanzeError.inputError(ErrorCode.EmailAlreadyExists, uniqueEmailErrorMsg);
    } else if (uniqueUsernameErrorMsg) {
      return LaDanzeError.inputError(ErrorCode.UsernameAlreadyExists, uniqueUsernameErrorMsg);
    } else if (passwordErrorMsg) {
      return LaDanzeError.inputError(ErrorCode.UsernameAlreadyExists, passwordErrorMsg);
    } else {
      return LaDanzeError.inputError(ErrorCode.EmailInvalid, emailInvalidErrorMsg);
    }
  }
}