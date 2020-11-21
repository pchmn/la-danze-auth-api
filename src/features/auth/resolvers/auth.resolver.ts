import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthTokens, LoginInput, ResetPasswordInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {

  constructor(private authService: AuthService) { }

  @Query(() => AuthTokens)
  async confirmEmailQuery(@Args('token') token: string) {
    return this.authService.confirmEmailQuery(token);
  }

  @Mutation(() => AuthTokens)
  async signup(@Args('input') input: SignupInput) {
    return this.authService.signup(input);
  }

  @Mutation(() => AuthTokens)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthTokens)
  async refreshToken(@Args('input') input: TokenInput) {
    return this.authService.refreshToken(input);
  }

  @Mutation(() => AuthTokens)
  async confirmEmail(@Args('input') input: TokenInput) {
    return this.authService.confirmEmail(input);
  }

  @Mutation(() => AuthTokens)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }
}
