
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

export class JwtToken {
    accessToken: string;
    refreshToken: string;
}

export abstract class IMutation {
    abstract signup(input: SignupInput): JwtToken | Promise<JwtToken>;

    abstract login(input: LoginInput): JwtToken | Promise<JwtToken>;

    abstract refreshToken(input?: TokenInput): JwtToken | Promise<JwtToken>;
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
}

export type DateTime = any;
