import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtToken, LoginInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {

  constructor(private authService: AuthService) { }

  @Query(() => JwtToken)
  async confirmEmailQuery(@Args('token') token: string) {
    return this.authService.confirmEmailQuery(token);
  }

  @Mutation(() => JwtToken)
  async signup(@Args('input') input: SignupInput) {
    return this.authService.signup(input);
  }

  @Mutation(() => JwtToken)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => JwtToken)
  async refreshToken(@Args('input') input: TokenInput) {
    return this.authService.refreshToken(input);
  }

  @Mutation(() => Boolean)
  async confirmEmail(@Args('input') input: TokenInput) {
    return this.authService.confirmEmail(input);
  }
}
