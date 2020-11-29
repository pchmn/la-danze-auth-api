import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Account } from 'src/generated/graphql.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(protected configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.publicKey')
    });
  }

  async validate(payload: Account) {
    return payload;
  }
}