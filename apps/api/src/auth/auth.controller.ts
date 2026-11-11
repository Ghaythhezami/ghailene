import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AdminIdentity } from "./jwt-auth.guard";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

@ApiTags("authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Sign in an existing administrator" })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(body.email, body.password);
    response.cookie("basmat_admin", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    return { admin: result.admin, expiresIn: result.expiresIn };
  }

  @Post("logout")
  @ApiOperation({ summary: "End the current administrator session" })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("basmat_admin", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return { loggedOut: true };
  }

  @Get("session")
  @UseGuards(JwtAuthGuard)
  session(@Req() request: Request & { user?: AdminIdentity }) {
    return { admin: request.user };
  }
}
