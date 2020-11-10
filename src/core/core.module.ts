import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { DateTimeResolver } from 'graphql-scalars';
import baseConfig from 'src/config/base.config';
import databaseConfig from 'src/config/database.config';
import jwtConfig from 'src/config/jwt.config';
import { InMemoryMongodb } from 'src/shared/testing/in-memory-mongodb';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [baseConfig, databaseConfig, jwtConfig]
    }),
    GraphQLModule.forRoot({
      typePaths: ['./src/**/*.graphql'],
      resolvers: { DateTime: DateTimeResolver }
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
    })
  ]
})
export class CoreModule { }
