import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { JwtToken, LoginInput, SignupInput, TokenInput } from 'src/generated/graphql.schema';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {

  constructor(private authService: AuthService) { }

  @Mutation(() => JwtToken)
  async signup(@Args('input') input: SignupInput) {
    return this.authService.signup(input);
  }

  @Mutation(() => JwtToken)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => Boolean)
  async refreshToken(@Args('input') input: TokenInput) {
    return this.authService.refreshToken(input);
  }
}
