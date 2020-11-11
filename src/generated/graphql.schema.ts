
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
    newPassword: string;
}

export class ChangePasswordInput {
    oldPassword: string;
    newPassword: string;
}

export class User {
    email: string;
    username: string;
    roles: ApplicationRole[];
    createdAt: DateTime;
}

export class ApplicationRole {
    application: string;
    role: UserRoleType;
}

export abstract class IQuery {
    abstract hello(): string | Promise<string>;

    abstract users(): User[] | Promise<User[]>;

    abstract confirmEmail(token: string): JwtToken | Promise<JwtToken>;
}

export class JwtToken {
    accessToken: string;
    refreshToken: string;
}

export abstract class IMutation {
    abstract signup(input: SignupInput): JwtToken | Promise<JwtToken>;

    abstract login(input: LoginInput): JwtToken | Promise<JwtToken>;

    abstract refreshToken(input?: TokenInput): JwtToken | Promise<JwtToken>;

    abstract confirmEmail(input?: TokenInput): JwtToken | Promise<JwtToken>;

    abstract resetPassword(input?: ResetPasswordInput): JwtToken | Promise<JwtToken>;

    abstract changePassword(input?: ChangePasswordInput): JwtToken | Promise<JwtToken>;
}

export type DateTime = any;
