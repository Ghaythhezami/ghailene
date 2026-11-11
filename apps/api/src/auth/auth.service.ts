import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { verify } from "argon2";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active || !(await verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
      admin: { id: user.id, email: user.email, role: user.role },
    };
  }
}
