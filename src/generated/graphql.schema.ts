
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

export class ChangeEmailAndUsernameInput {
    newEmail: string;
    newUsername: string;
}

export class SignUpInput {
    email: string;
    username: string;
    password: string;
}

export class SignInInput {
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
    application?: string;
    role?: AccountRoleType;
}

export class Email {
    value?: string;
    isConfirmed?: boolean;
}

export class Account {
    accountId?: string;
    email?: Email;
    username?: string;
    roles?: ApplicationRole[];
    createdAt?: DateTime;
}

export abstract class IQuery {
    abstract myAccount(): Account | Promise<Account>;

    abstract hello(): string | Promise<string>;

    abstract users(): Account[] | Promise<Account[]>;

    abstract confirmEmailQuery(token: string): AccessToken | Promise<AccessToken>;
}

export abstract class IMutation {
    abstract changePassword(input?: ChangePasswordInput): string | Promise<string>;

    abstract changeEmailAndUsername(input?: ChangeEmailAndUsernameInput): AccessToken | Promise<AccessToken>;

    abstract signUp(input: SignUpInput): AccessToken | Promise<AccessToken>;

    abstract signIn(input: SignInInput): AccessToken | Promise<AccessToken>;

    abstract refreshToken(): AccessToken | Promise<AccessToken>;

    abstract confirmEmail(input?: TokenInput): AccessToken | Promise<AccessToken>;

    abstract resetPassword(input?: ResetPasswordInput): AccessToken | Promise<AccessToken>;
}

export class AccessToken {
    accessToken: string;
}

export type DateTime = any;
