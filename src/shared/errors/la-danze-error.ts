import { ApolloError, AuthenticationError, UserInputError } from "apollo-server-express";

export class LaDanzeError {

  static create(error: Error, additionalMessage?: string) {
    switch (error.systemErrorCode) {
      case SystemErrorCode.BadUserInput: return LaDanzeError.badInput(error, additionalMessage);
      case SystemErrorCode.Forbidden: return LaDanzeError.forbidden(error, additionalMessage);
      case SystemErrorCode.NotFound: return LaDanzeError.notFound(error, additionalMessage);
      case SystemErrorCode.ServerError: return LaDanzeError.serverError(error, additionalMessage);
      default: return LaDanzeError.unknownError();
    }
  }

  static unknownError(): ApolloError {
    return LaDanzeError.serverError(ErrorType.UnknowError);
  }

  static badInput(error: Error, additionalMessage?: string) {
    return new UserInputError('can\'t validate user input', { code: error.code, message: error.message, additionalMessage });
  }

  static unauthenticated() {
    return new AuthenticationError('unauthenticated');
  }

  static serverError(error: Error, additionalMessage?: string) {
    return new ApolloError('server error', SystemErrorCode.ServerError, { code: error.code, message: error.message, additionalMessage });
  }

  static forbidden(error: Error, additionalMessage?: string) {
    return new ApolloError('forbidden', SystemErrorCode.Forbidden, { code: error.code, message: error.message, additionalMessage });
  }

  static notFound(error: Error, additionalMessage?: string) {
    return new ApolloError('not found', SystemErrorCode.NotFound, { code: error.code, message: error.message, additionalMessage })
  }
}

export enum SystemErrorCode {
  NotFound = 'NOT_FOUND',
  ServerError = 'SERVER_ERROR',
  Forbidden = 'FORBIDDEN',
  BadUserInput = 'BAD_USER_INPUT'
}

export interface Error {
  systemErrorCode: SystemErrorCode;
  code: number;
  message: string;
}

export class ErrorType {
  static readonly UnknowError = ({ systemErrorCode: SystemErrorCode.ServerError, code: 99, message: 'unknowError' });
  static readonly EmailAlreadyExists = (message: string) => ({ systemErrorCode: SystemErrorCode.BadUserInput, code: 100, message });
  static readonly UsernameAlreadyExists = (message: string) => ({ systemErrorCode: SystemErrorCode.BadUserInput, code: 101, message });
  static readonly InvalidEmail = (message: string) => ({ systemErrorCode: SystemErrorCode.BadUserInput, code: 102, message });
  static readonly PasswordMinLength = ({ systemErrorCode: SystemErrorCode.BadUserInput, code: 103, message: 'password ust have 8 chracters minimum' });
  static readonly AccountNotFound = (value: string) => ({ systemErrorCode: SystemErrorCode.NotFound, code: 104, message: `${value} does not exist` });
  static readonly WrongCredentials = { systemErrorCode: SystemErrorCode.BadUserInput, code: 105, message: 'wrong credentials' };
  static readonly InvalidConfirmtoken = { systemErrorCode: SystemErrorCode.BadUserInput, code: 107, message: 'invalid confirm token' };
  static readonly InvalidResetPasswordtoken = { systemErrorCode: SystemErrorCode.BadUserInput, code: 109, message: 'invalid reset password token' };
  static readonly CantCreateAccessToken = { systemErrorCode: SystemErrorCode.ServerError, code: 110, message: 'can\'t create access token' };
  static readonly InvalidRefreshToken = { systemErrorCode: SystemErrorCode.BadUserInput, code: 111, message: 'invalid refresh token' };
}
