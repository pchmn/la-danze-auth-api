import { UseGuards } from '@nestjs/common/decorators';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentAccount } from 'src/features/auth/authorization/current-account.decorator';
import { JwtAuthGuard } from 'src/features/auth/authorization/jwt-auth.guard';
import { AuthService } from 'src/features/auth/services/auth.service';
import { AccessToken, Account, ChangeEmailAndUsernameInput, ChangePasswordInput } from 'src/generated/graphql.schema';
import { AccountService } from '../services/account.service';

@Resolver()
export class AccountResolver {

  constructor(private accountService: AccountService, private authService: AuthService) { }

  @Query(() => Account)
  @UseGuards(JwtAuthGuard)
  async myAccount(@CurrentAccount() account: Account) {
    return this.accountService.findByAccountId(account.accountId);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentAccount() account: Account, @Args('input') input: ChangePasswordInput) {
    await this.accountService.changePassword(account.accountId, input);
    return 'password updated';
  }

  @Mutation(() => AccessToken)
  @UseGuards(JwtAuthGuard)
  async changeEmailAndUsername(@CurrentAccount() account: Account, @Args('input') input: ChangeEmailAndUsernameInput) {
    const res = await this.accountService.changeEmailAndUsername(account.accountId, input);
    // Create new email confirmation (with access token) if email has changed
    if (res.emailHasChanged) {
      return this.authService.createEmailConfirmation(res.account);
    }
    // Email has not changed, juste return access token
    return this.authService.createAccessToken(res.account);
  }
}
