import { nanoid } from "nanoid";

export class RandomStringUtils {

  static readonly TOKEN_SIZE = 64;
  static readonly TOKEN_LIFE_TIME: number = 60 * 60 * 24 * 7 * 1000;
  static readonly ID_SIZE = 32;

  /**
   * Create a random (unique) token
   *
   * @param [size=64] the size of the token
   * @returns the token value
   */
  static createToken(size = RandomStringUtils.TOKEN_SIZE): string {
    return nanoid(size);
  }

  static tokenExpiresAt(): number {
    return Date.now() + RandomStringUtils.TOKEN_LIFE_TIME;
  }

  static createId(size = RandomStringUtils.ID_SIZE): string {
    return nanoid(size);
  }
}