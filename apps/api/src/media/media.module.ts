import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminRoleGuard } from "../auth/admin-role.guard";
import { MediaController } from "./media.controller";
import { CloudinaryService } from "./cloudinary.service";

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [CloudinaryService, AdminRoleGuard],
  exports: [CloudinaryService],
})
export class MediaModule {}
