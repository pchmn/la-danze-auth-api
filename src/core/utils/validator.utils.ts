import { string } from 'yup';

export class ValidatorUtils {

  private static readonly emailValidator = string().email();

  static isEmailValid(email: string): boolean {
    return this.emailValidator.isValidSync(email);
  }
}