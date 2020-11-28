import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { LaDanzeError } from 'src/app/shared/errors/la-danze-error';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw LaDanzeError.unauthenticated();
    }
    return user;
  }
}
