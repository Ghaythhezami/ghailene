CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Grade" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolClass" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gradeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "anonymous" BOOLEAN NOT NULL DEFAULT false,
  "profileUrl" TEXT,
  "profilePublicId" TEXT,
  "gradeId" TEXT NOT NULL,
  "schoolClassId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "coverUrl" TEXT,
  "coverPublicId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "coverUrl" TEXT,
  "coverPublicId" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Artwork" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "materials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdOn" TIMESTAMP(3),
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "videoUrl" TEXT,
  "videoPublicId" TEXT,
  "studentId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtworkImage" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "artworkId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GalleryEvent" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "coverUrl" TEXT,
  "coverPublicId" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GalleryEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebsiteSettings" (
  "id" TEXT NOT NULL DEFAULT 'main',
  "platformName" TEXT NOT NULL DEFAULT 'بصمة فن',
  "subtitle" TEXT NOT NULL DEFAULT 'الابتكارية ٢',
  "slogan" TEXT NOT NULL DEFAULT 'كل طالب فنان.. وكل إبداع له بصمة.',
  "secondarySlogan" TEXT NOT NULL DEFAULT 'من أنامل صغيرة تنطلق إبداعات كبيرة.. هنا نرسم أحلامنا ونترك بصمتنا.',
  "description" TEXT NOT NULL DEFAULT 'معرض الإبداع الفني الرقمي',
  "teacherName" TEXT NOT NULL DEFAULT 'الأستاذ غيلان الخزامي',
  "teacherTitle" TEXT NOT NULL DEFAULT 'أستاذ التربية الفنية',
  "teacherPhotoUrl" TEXT,
  "teacherPhotoPublicId" TEXT,
  "academicSupervisor" TEXT NOT NULL DEFAULT 'الأستاذ رفيق عباس',
  "principal" TEXT NOT NULL DEFAULT 'الأستاذ محمد العتيبي',
  "schoolLogoUrl" TEXT,
  "schoolLogoPublicId" TEXT,
  "organizationLogoUrl" TEXT,
  "organizationLogoPublicId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX "Grade_name_key" ON "Grade"("name");
CREATE UNIQUE INDEX "SchoolClass_name_gradeId_key" ON "SchoolClass"("name", "gradeId");
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");
CREATE INDEX "Student_gradeId_schoolClassId_idx" ON "Student"("gradeId", "schoolClassId");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE UNIQUE INDEX "Artwork_slug_key" ON "Artwork"("slug");
CREATE INDEX "Artwork_status_createdAt_idx" ON "Artwork"("status", "createdAt");
CREATE INDEX "Artwork_categoryId_status_idx" ON "Artwork"("categoryId", "status");
CREATE INDEX "Artwork_studentId_idx" ON "Artwork"("studentId");
CREATE INDEX "Artwork_projectId_idx" ON "Artwork"("projectId");
CREATE INDEX "Artwork_featured_status_idx" ON "Artwork"("featured", "status");
CREATE INDEX "Artwork_title_trgm_idx" ON "Artwork" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Artwork_description_trgm_idx" ON "Artwork" USING GIN ("description" gin_trgm_ops);
CREATE INDEX "Student_fullName_trgm_idx" ON "Student" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Project_name_trgm_idx" ON "Project" USING GIN ("name" gin_trgm_ops);
CREATE UNIQUE INDEX "ArtworkImage_publicId_key" ON "ArtworkImage"("publicId");
CREATE INDEX "ArtworkImage_artworkId_sortOrder_idx" ON "ArtworkImage"("artworkId", "sortOrder");
CREATE UNIQUE INDEX "GalleryEvent_slug_key" ON "GalleryEvent"("slug");

ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_gradeId_fkey"
  FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_gradeId_fkey"
  FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolClassId_fkey"
  FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey"
  FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
