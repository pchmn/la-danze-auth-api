import { Error } from 'mongoose';
import { ErrorType, LaDanzeError } from './la-danze-error';

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

    switch (true) {
      case !!uniqueEmailErrorMsg: return LaDanzeError.create(ErrorType.EmailAlreadyExists(uniqueEmailErrorMsg));
      case !!emailInvalidErrorMsg: return LaDanzeError.create(ErrorType.InvalidEmail(emailInvalidErrorMsg));
      case !!uniqueUsernameErrorMsg: return LaDanzeError.create(ErrorType.UsernameAlreadyExists(uniqueUsernameErrorMsg));
      case !!passwordErrorMsg: return LaDanzeError.create(ErrorType.PasswordMinLength);
      default: return LaDanzeError.unknownError();
    }
  }
}