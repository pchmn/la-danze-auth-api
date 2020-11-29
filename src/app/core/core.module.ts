import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { DateTimeResolver } from 'graphql-scalars';
import baseConfig from 'src/config/base.config';
import cookieConfig from 'src/config/cookie.config';
import databaseConfig from 'src/config/database.config';
import jwtConfig from 'src/config/jwt.config';
import nodemailConfig from 'src/config/nodemail.config';
import { InMemoryMongodb } from '../shared/testing/in-memory-mongodb';
import { JwtStrategy } from './authorization/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [baseConfig, databaseConfig, jwtConfig, nodemailConfig, cookieConfig]
    }),
    GraphQLModule.forRoot({
      typePaths: ['./src/**/*.graphql'],
      resolvers: { DateTime: DateTimeResolver },
      context: ({ req, res }) => ({ req, res }),
      cors: {
        credentials: true,
        origin: true
      }
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const uri = await InMemoryMongodb.mongod.getUri();
        console.log(uri)
        return {
          uri: uri
        }
      },
      // imports: [ConfigModule],
      // useFactory: async (configService: ConfigService) => ({
      //   uri: `mongodb://${configService.get('mongodb.user')}:${configService.get('mongodb.pwd')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/${configService.get('mongodb.db')}?authSource=${configService.get('mongodb.db')}`,
      // }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get('jwt.privateKey'),
        publicKey: configService.get('jwt.publicKey'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '180s'
        }
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy]
})
export class CoreModule { }
