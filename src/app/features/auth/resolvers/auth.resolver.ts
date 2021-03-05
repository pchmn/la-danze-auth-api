import { UseInterceptors } from '@nestjs/common/decorators';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessToken, ResetPasswordInput, SignInInput, SignUpInput, TokenInput } from 'src/generated/graphql.schema';
import { Cookies } from '../../../core/authorization/cookies.decorator';
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
  async signUp(@Args('input') input: SignUpInput) {
    return this.authService.signUp(input);
  }

  @Mutation(() => AccessToken)
  @UseInterceptors(RefreshTokenInterceptor)
  async signIn(@Args('input') input: SignInInput) {
    return this.authService.signIn(input);
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
