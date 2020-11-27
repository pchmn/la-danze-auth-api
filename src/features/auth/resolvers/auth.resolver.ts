import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessToken, LoginInput, ResetPasswordInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {

  constructor(private authService: AuthService) { }

  @Query(() => AccessToken)
  async confirmEmailQuery(@Context() context: any, @Args('token') token: string) {
    return this.authService.confirmEmailQuery(token);
  }

  @Mutation(() => AccessToken)
  async signup(@Context() context: any, @Args('input') input: SignupInput) {
    const response = await this.authService.signup(input);
    this.setRefreshTokenCookie(context, response[0]);
    return response[1];
  }

  @Mutation(() => AccessToken)
  async login(@Context() context: any, @Args('input') input: LoginInput) {
    const response = await this.authService.login(input);
    this.setRefreshTokenCookie(context, response[0]);
    return response[1];
  }

  @Mutation(() => AccessToken)
  async refreshToken(@Context() context: any) {
    const response = await this.authService.refreshToken(context.req.cookies['refreshToken']);
    this.setRefreshTokenCookie(context, response[0]);
    return response[1];
  }

  @Mutation(() => AccessToken)
  async confirmEmail(@Context() context: any, @Args('input') input: TokenInput) {
    const response = await this.authService.confirmEmail(input);
    this.setRefreshTokenCookie(context, response[0]);
    return response[1];
  }

  @Mutation(() => AccessToken)
  async resetPassword(@Context() context: any, @Args('input') input: ResetPasswordInput) {
    const response = await this.authService.resetPassword(input);
    this.setRefreshTokenCookie(context, response[0]);
    return response[1];
  }

  private setRefreshTokenCookie(context: any, token: string) {
    // Add refresh token in httpOnly cookie
    context.res.cookie('refreshToken', token, { httpOnly: true });
  }
}
