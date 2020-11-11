
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum UserRoleType {
    ADMIN = "ADMIN",
    USER = "USER"
}

export class SignupInput {
    email: string;
    username: string;
    password: string;
}

export class LoginInput {
    emailOrUsername: string;
    password: string;
}

export class TokenInput {
    token: string;
}

export class ResetPasswordInput {
    token: string;
    password: string;
}

export class ChangePasswordInput {
    oldPassword: string;
    newPassword: string;
}

export class EmailInput {
    email: string;
}

export class Email {
    value: string;
    isConfirmed: boolean;
}

export class Account {
    email: Email;
    username: string;
    roles: ApplicationRole[];
    createdAt: DateTime;
    isActive: boolean;
}

export class ApplicationRole {
    application: string;
    role: UserRoleType;
}

export abstract class IQuery {
    abstract hello(): string | Promise<string>;

    abstract users(): Account[] | Promise<Account[]>;

    abstract confirmEmailQuery(token: string): AuthTokens | Promise<AuthTokens>;
}

export class AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export abstract class IMutation {
    abstract signup(input: SignupInput): AuthTokens | Promise<AuthTokens>;

    abstract login(input: LoginInput): AuthTokens | Promise<AuthTokens>;

    abstract refreshToken(input?: TokenInput): AuthTokens | Promise<AuthTokens>;

    abstract confirmEmail(input?: TokenInput): AuthTokens | Promise<AuthTokens>;

    abstract resetPassword(input?: ResetPasswordInput): AuthTokens | Promise<AuthTokens>;

    abstract changePassword(input?: ChangePasswordInput): AuthTokens | Promise<AuthTokens>;

    abstract addEmail(input?: EmailInput): AuthTokens | Promise<AuthTokens>;

    abstract activeEmail(input?: EmailInput): AuthTokens | Promise<AuthTokens>;
}

export type DateTime = any;
