import { ApolloError } from "apollo-server-express";

export class LaDanzeError {

  static unknownError(): ApolloError {
    return new ApolloError("unknown error", ErrorCode.ServerError);
  }

  static wrongCredentials(): ApolloError {
    return new ApolloError("wrong credentials", ErrorCode.WrongInput);
  }

  static userNotFound(emailOrUsername: string): ApolloError {
    return new ApolloError(`"${emailOrUsername}" does not exist`, ErrorCode.NotFound);
  }

  static cantCreateToken(): ApolloError {
    return new ApolloError("error creating token", ErrorCode.ServerError);
  }

  static cantVerifyToken(): ApolloError {
    return new ApolloError("error verifying token", ErrorCode.WrongInput);
  }

  static cantRefreshToken(): ApolloError {
    return new ApolloError("error refresh token", ErrorCode.WrongInput);
  }

  static invalidToken(): ApolloError {
    return new ApolloError("invalid token", ErrorCode.WrongInput);
  }

  static usernameAlreadyExists(username: string): ApolloError {
    return new ApolloError(`username "${username}" already exists`, ErrorCode.WrongInput);
  }

  static emailAlreadyExists(email: string): ApolloError {
    return new ApolloError(`email "${email}" already exists`, ErrorCode.WrongInput);
  }

  static emailAndUsernameAlreadyExist(email: string, username: string): ApolloError {
    return new ApolloError(`email "${email}" and username "${username}" already exist`, ErrorCode.WrongInput);
  }

  static alreadyRevoked(): ApolloError {
    return new ApolloError("token already revoked", ErrorCode.WrongInput);
  }

  static create(message: string, code: ErrorCode) {
    return new ApolloError(message, code);
  }
}

export enum ErrorCode {
  Unhautorized = 'UNHAUTORIZED',
  NotFound = 'NOT_FOUND',
  Forbidden = 'FORBIDDEN',
  WrongInput = 'WRONG_INPUT',
  ServerError = 'SERVER_ERROR'
}
