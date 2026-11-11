import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminRoleGuard } from "../auth/admin-role.guard";
import { ContentController, PublicContentController } from "./content.controller";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [PublicContentController, ContentController],
  providers: [AdminRoleGuard],
})
export class ContentModule {}
