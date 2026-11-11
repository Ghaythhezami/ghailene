import {
  BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminRoleGuard } from "../auth/admin-role.guard";
import { CloudinaryService } from "./cloudinary.service";

const allowedTypes = new Map([
  ["image/jpeg", "image"], ["image/png", "image"], ["image/webp", "image"],
  ["video/mp4", "video"], ["video/webm", "video"],
]);

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@Controller("admin/media")
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!allowedTypes.has(file.mimetype)) {
        callback(new BadRequestException("Only JPEG, PNG, WebP, MP4, and WebM files are allowed."), false);
        return;
      }
      callback(null, true);
    },
  }))
  async upload(@UploadedFile() file: { mimetype: string; buffer: Buffer; size: number }) {
    if (!file) throw new BadRequestException("Choose a supported file to upload.");
    if (file.size > (file.mimetype.startsWith("image/") ? 10 : 50) * 1024 * 1024) {
      throw new BadRequestException(file.mimetype.startsWith("image/") ? "Images must be 10 MB or smaller." : "Videos must be 50 MB or smaller.");
    }
    const resourceType = allowedTypes.get(file.mimetype);
    if (!resourceType) throw new BadRequestException("Unsupported media type.");
    if (!hasValidSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException("The file contents do not match the selected image or video type.");
    }
    return this.cloudinary.upload(file.buffer, resourceType as "image" | "video");
  }
}

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (mimeType === "video/mp4") return buffer.toString("ascii", 4, 8) === "ftyp";
  if (mimeType === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}
