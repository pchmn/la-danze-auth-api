import { UseInterceptors } from '@nestjs/common/decorators';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessToken, LoginInput, ResetPasswordInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { Cookies } from '../authorization/cookies.decorator';
import { AuthService } from '../services/auth.service';
import { RefreshTokenInterceptor } from './refresh-token.interceptor';

@Resolver()
export class AuthResolver {

  constructor(private authService: AuthService) { }

  @Query(() => AccessToken)
  async confirmEmailQuery(@Args('token') token: string) {
    return this.authService.confirmEmailQuery(token);
  }

  @Mutation(() => AccessToken)
  @UseInterceptors(RefreshTokenInterceptor)
  async signup(@Args('input') input: SignupInput) {
    return this.authService.signup(input);
  }

  @Mutation(() => AccessToken)
  @UseInterceptors(RefreshTokenInterceptor)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AccessToken)
  @UseInterceptors(RefreshTokenInterceptor)
  async refreshToken(@Cookies() cookies: any) {
    return this.authService.refreshToken(cookies.refreshToken);
  }

  @Mutation(() => AccessToken)
  async confirmEmail(@Args('input') input: TokenInput) {
    return this.authService.confirmEmail(input);
  }

  @Mutation(() => AccessToken)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }
}
