import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { AccessToken, Account } from 'src/generated/graphql.schema';
import { RefreshTokenDocument } from '../mongo-schemas/refresh-token.mongo.schema';
import { RefreshTokenService } from '../services/refresh-token.service';


@Injectable()
export class RefreshTokenInterceptor<T> implements NestInterceptor<T, AccessToken> {

  constructor(private jwtService: JwtService, private refreshTokenService: RefreshTokenService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<AccessToken> {
    const ctxRes = GqlExecutionContext.create(context).getContext().res;
    return next.handle().pipe(
      mergeMap(data => {
        return this.createRefreshToken(data);
      }),
      map(res => {
        ctxRes.cookie('refreshToken', res.refreshToken.token, { httpOnly: true, signed: true });
        return res.data;
      })
    );
  }

  private createRefreshToken(data: AccessToken): Observable<{ data: AccessToken, refreshToken: RefreshTokenDocument }> {
    const accountId = (this.jwtService.decode(data.accessToken) as Account).accountId;
    return from(this.refreshTokenService.createRefreshTokenForAccount(accountId)).pipe(
      map(refreshToken => ({ data, refreshToken }))
    )
  }
}