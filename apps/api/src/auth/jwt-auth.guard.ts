import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "../prisma.service";

export interface AdminIdentity {
  sub: string;
  email: string;
  role: "ADMIN" | "EDITOR";
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AdminIdentity }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : (request as typeof request & { cookies?: Record<string, string> }).cookies?.basmat_admin ?? "";
    if (!token) throw new UnauthorizedException("Administrator authentication is required");

    let identity: AdminIdentity;
    try {
      identity = await this.jwt.verifyAsync<AdminIdentity>(token);
    } catch {
      throw new UnauthorizedException("Administrator token is invalid or expired");
    }
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: identity.sub },
      select: { id: true, email: true, role: true, active: true },
    });
    if (!admin?.active) throw new UnauthorizedException("Administrator access has been revoked");
    request.user = { sub: admin.id, email: admin.email, role: admin.role };
    return true;
  }
}
