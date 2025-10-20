// import { Module } from "@nestjs/common";
// import { BullModule } from "@nestjs/bullmq";
// import { ConfigModule, ConfigService, ConfigType } from "@nestjs/config";
// import appConfig from "./environment/types/app.config";

// @Module({
//   imports: [
//     BullModule.forRootAsync({
//       inject: [appConfig.KEY],
//       useFactory: async (configService: ConfigType<typeof appConfig>) => ({
//         connection: {
//           host: configService.redis.host,
//           port: configService.redis.port,
//         },
//         prefix: configService.redis.bullPrefix,
//       }),
//     }),
//   ],
// })
// export class InitialBullMQModule {}
