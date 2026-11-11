import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = (config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());

  app.use((request: Request, response: Response, next: NextFunction) => {
    const origin = request.headers.origin;
    const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const carriesAdminCookie = request.headers.cookie?.split(";").some((cookie) => cookie.trim().startsWith("basmat_admin="));
    if (unsafe && ((origin && !allowedOrigins.includes(origin)) || (carriesAdminCookie && !origin))) {
      response.status(403).json({ statusCode: 403, message: "Request origin is not allowed" });
      return;
    }
    next();
  });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Basmat Fan API")
    .setDescription("Public gallery and protected content management API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.get<number>("PORT") ?? config.get<number>("API_PORT") ?? 4000, "0.0.0.0");
}

void bootstrap();
