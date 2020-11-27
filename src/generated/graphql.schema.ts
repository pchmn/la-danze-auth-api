
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum AccountRoleType {
    ADMIN = "ADMIN",
    USER = "USER"
}

export class ChangePasswordInput {
    oldPassword: string;
    newPassword: string;
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

export class EmailInput {
    email: string;
}

export class ApplicationRole {
    application: string;
    role: AccountRoleType;
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

export abstract class IMutation {
    abstract changePassword(input?: ChangePasswordInput): AccessToken | Promise<AccessToken>;

    abstract signup(input: SignupInput): AccessToken | Promise<AccessToken>;

    abstract login(input: LoginInput): AccessToken | Promise<AccessToken>;

    abstract refreshToken(): AccessToken | Promise<AccessToken>;

    abstract confirmEmail(input?: TokenInput): AccessToken | Promise<AccessToken>;

    abstract resetPassword(input?: ResetPasswordInput): AccessToken | Promise<AccessToken>;
}

export abstract class IQuery {
    abstract hello(): string | Promise<string>;

    abstract users(): Account[] | Promise<Account[]>;

    abstract confirmEmailQuery(token: string): AccessToken | Promise<AccessToken>;
}

export class AccessToken {
    accessToken: string;
}

export type DateTime = any;
