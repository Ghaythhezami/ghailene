import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";
import { AdminIdentity } from "./jwt-auth.guard";

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AdminIdentity }>();
    if (request.user?.role !== "ADMIN") throw new ForbiddenException("Administrator role is required");
    return true;
  }
}
