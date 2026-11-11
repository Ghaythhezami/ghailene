import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { z } from "zod";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { HealthController } from "./health.controller";
import { MediaModule } from "./media/media.module";
import { PrismaModule } from "./prisma.module";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validate: (environment) => environmentSchema.parse(environment),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 90 }]),
    PrismaModule,
    AuthModule,
    ContentModule,
    MediaModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
