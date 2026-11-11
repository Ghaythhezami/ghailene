import { PublicationStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min, MinLength,
  ValidateNested,
} from "class-validator";

export class ArtworkImageDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  @MinLength(1)
  publicId!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateArtworkDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsString() @MinLength(1) studentId!: string;
  @IsString() @MinLength(1) categoryId!: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) materials?: string[];
  @IsOptional() @IsDateString() createdOn?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsUrl({ require_tld: false }) videoUrl?: string;
  @IsOptional() @IsString() videoPublicId?: string;
  @IsOptional() @IsEnum(PublicationStatus) status?: PublicationStatus;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ArtworkImageDto)
  images?: ArtworkImageDto[];
}

export class UpdateArtworkDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() projectId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) materials?: string[];
  @IsOptional() @IsDateString() createdOn?: string | null;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsUrl({ require_tld: false }) videoUrl?: string | null;
  @IsOptional() @IsString() videoPublicId?: string | null;
  @IsOptional() @IsEnum(PublicationStatus) status?: PublicationStatus;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ArtworkImageDto)
  images?: ArtworkImageDto[];
}

export class CreateCategoryDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string;
  @IsOptional() @IsString() coverPublicId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string | null;
  @IsOptional() @IsString() coverPublicId?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class CreateProjectDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string;
  @IsOptional() @IsString() coverPublicId?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string | null;
  @IsOptional() @IsString() coverPublicId?: string | null;
  @IsOptional() @IsDateString() startsAt?: string | null;
  @IsOptional() @IsDateString() endsAt?: string | null;
}

export class CreateStudentDto {
  @IsString() @MinLength(1) fullName!: string;
  @IsString() @MinLength(1) gradeId!: string;
  @IsOptional() @IsString() schoolClassId?: string;
  @IsOptional() @IsBoolean() anonymous?: boolean;
  @IsOptional() @IsUrl({ require_tld: false }) profileUrl?: string;
  @IsOptional() @IsString() profilePublicId?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() @MinLength(1) fullName?: string;
  @IsOptional() @IsString() gradeId?: string;
  @IsOptional() @IsString() schoolClassId?: string | null;
  @IsOptional() @IsBoolean() anonymous?: boolean;
  @IsOptional() @IsUrl({ require_tld: false }) profileUrl?: string | null;
  @IsOptional() @IsString() profilePublicId?: string | null;
}

export class UpdateWebsiteSettingsDto {
  @IsOptional() @IsString() platformName?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() slogan?: string;
  @IsOptional() @IsString() secondarySlogan?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() teacherName?: string;
  @IsOptional() @IsString() teacherTitle?: string;
  @IsOptional() @IsUrl({ require_tld: false }) teacherPhotoUrl?: string | null;
  @IsOptional() @IsString() teacherPhotoPublicId?: string | null;
  @IsOptional() @IsString() academicSupervisor?: string;
  @IsOptional() @IsString() principal?: string;
  @IsOptional() @IsUrl({ require_tld: false }) schoolLogoUrl?: string | null;
  @IsOptional() @IsString() schoolLogoPublicId?: string | null;
  @IsOptional() @IsUrl({ require_tld: false }) organizationLogoUrl?: string | null;
  @IsOptional() @IsString() organizationLogoPublicId?: string | null;
}

export class CreateGradeDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class UpdateGradeDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class CreateSchoolClassDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) gradeId!: string;
}

export class UpdateSchoolClassDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() gradeId?: string;
}

export class CreateGalleryEventDto {
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string;
  @IsOptional() @IsString() coverPublicId?: string;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateGalleryEventDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startsAt?: string | null;
  @IsOptional() @IsDateString() endsAt?: string | null;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string | null;
  @IsOptional() @IsString() coverPublicId?: string | null;
  @IsOptional() @IsBoolean() published?: boolean;
}
