import { nanoid } from "nanoid";

export class RandomToken {

  static readonly TOKEN_SIZE = 64;
  static readonly TOKEN_LIFE_TIME: number = 60 * 60 * 24 * 7 * 1000;

  /**
   * Create a random (unique) token
   *
   * @param [size=64] the size of the token
   * @returns the token value
   */
  static create(size = RandomToken.TOKEN_SIZE): string {
    return nanoid(size);
  }

  static expiresAt(): number {
    return Date.now() + RandomToken.TOKEN_LIFE_TIME;
  }
}