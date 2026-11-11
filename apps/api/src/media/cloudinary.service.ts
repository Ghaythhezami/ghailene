import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  private client() {
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    }
    return cloudinary;
  }

  async upload(buffer: Buffer, resourceType: "image" | "video", folder = "basmat-fan") {
    const client = this.client();
    client.config({
      cloud_name: this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      api_secret: this.config.getOrThrow<string>("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = client.uploader.upload_stream(
        { folder, resource_type: resourceType, ...(resourceType === "image" ? { quality: "auto", fetch_format: "auto" } : {}) },
        (error, response) => {
          if (error) reject(error);
          else if (response) resolve(response);
          else reject(new Error("Cloudinary returned an empty upload response."));
        },
      );
      Readable.from([buffer]).pipe(upload);
    });
    return { url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type, format: result.format, bytes: result.bytes };
  }

  async delete(publicId: string, resourceType: "image" | "video" = "image") {
    this.client().config({
      cloud_name: this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      api_secret: this.config.getOrThrow<string>("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    const result = await this.client().uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary could not delete media "${publicId}".`);
    }
  }
}
