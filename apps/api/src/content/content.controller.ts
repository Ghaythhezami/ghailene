import {
  BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Prisma, PublicationStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminRoleGuard } from "../auth/admin-role.guard";
import { PrismaService } from "../prisma.service";
import { CloudinaryService } from "../media/cloudinary.service";
import {
  CreateArtworkDto, CreateCategoryDto, CreateProjectDto, CreateStudentDto, UpdateArtworkDto,
  UpdateCategoryDto, UpdateProjectDto, UpdateStudentDto, UpdateWebsiteSettingsDto, CreateGradeDto,
  UpdateGradeDto, CreateSchoolClassDto, UpdateSchoolClassDto, CreateGalleryEventDto, UpdateGalleryEventDto,
} from "./dto";

const publicArtworkInclude = {
  student: { include: { grade: true, schoolClass: true } },
  category: true,
  project: true,
  images: { orderBy: { sortOrder: "asc" as const } },
};

function makeSlug(input: string) {
  return input.normalize("NFKC").trim().toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || `item-${Date.now()}`;
}

function makeUniqueSlug(input: string) {
  return `${makeSlug(input)}-${randomUUID().slice(0, 8)}`;
}

@ApiTags("public gallery")
@Controller("public")
export class PublicContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("gallery")
  async gallery(
    @Query("q") query = "",
    @Query("category") category = "",
    @Query("grade") gradeId = "",
    @Query("class") classId = "",
    @Query("project") projectId = "",
    @Query("year") requestedYear = "",
    @Query("page") requestedPage = "1",
    @Query("pageSize") requestedPageSize = "12",
  ) {
    const page = Math.max(1, Number.parseInt(requestedPage, 10) || 1);
    const pageSize = Math.min(48, Math.max(1, Number.parseInt(requestedPageSize, 10) || 12));
    const search = query.trim().slice(0, 100);
    const year = Number.parseInt(requestedYear, 10);
    const conditions: Prisma.ArtworkWhereInput[] = [];
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { student: { anonymous: false, fullName: { contains: search, mode: "insensitive" } } },
          { project: { name: { contains: search, mode: "insensitive" } } },
          { category: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (gradeId) conditions.push({ student: { gradeId } });
    if (classId) conditions.push({ student: { schoolClassId: classId } });
    if (projectId) conditions.push({ projectId });
    if (Number.isInteger(year) && year >= 1900 && year <= 2200) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      conditions.push({
        OR: [
          { createdOn: { gte: start, lt: end } },
          { createdOn: null, createdAt: { gte: start, lt: end } },
        ],
      });
    }
    const where: Prisma.ArtworkWhereInput = {
      status: PublicationStatus.PUBLISHED,
      ...(category ? { category: { slug: category } } : {}),
      ...(conditions.length ? { AND: conditions } : {}),
    };
    const [rows, total, categories, settings, grades, classes, projects, events] = await this.prisma.$transaction([
      this.prisma.artwork.findMany({
        where, include: publicArtworkInclude, orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.artwork.count({ where }),
      this.prisma.category.findMany({
        select: { id: true, name: true, slug: true, description: true, coverUrl: true, sortOrder: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      this.prisma.websiteSettings.findUnique({
        where: { id: "main" },
        select: {
          platformName: true, subtitle: true, slogan: true, secondarySlogan: true, description: true,
          teacherName: true, teacherTitle: true, teacherPhotoUrl: true, academicSupervisor: true,
          principal: true, schoolLogoUrl: true, organizationLogoUrl: true,
        },
      }),
      this.prisma.grade.findMany({
        where: { students: { some: { artworks: { some: { status: "PUBLISHED" } } } } },
        select: { id: true, name: true }, orderBy: { sortOrder: "asc" },
      }),
      this.prisma.schoolClass.findMany({
        where: { students: { some: { artworks: { some: { status: "PUBLISHED" } } } } },
        select: { id: true, name: true, gradeId: true }, orderBy: { name: "asc" },
      }),
      this.prisma.project.findMany({ where: { artworks: { some: { status: "PUBLISHED" } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.prisma.galleryEvent.findMany({
        where: { published: true }, orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, slug: true, description: true, startsAt: true, endsAt: true, coverUrl: true },
      }),
    ]);

    return {
      artworks: rows.map((artwork) => ({
        id: artwork.id,
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        studentDisplayName: artwork.student.anonymous ? "فنان من الابتكارية" : artwork.student.fullName,
        gradeName: artwork.student.grade.name,
        category: {
          id: artwork.category.id, name: artwork.category.name, slug: artwork.category.slug,
          description: artwork.category.description, coverUrl: artwork.category.coverUrl,
          sortOrder: artwork.category.sortOrder,
        },
        projectName: artwork.project?.name ?? null,
        videoUrl: artwork.videoUrl,
        createdAt: (artwork.createdOn ?? artwork.createdAt).toISOString(),
        materials: artwork.materials,
        images: artwork.images.map(({ url, alt }) => ({ url, alt })),
        featured: artwork.featured,
      })),
      categories,
      settings,
      filters: { grades, classes, projects },
      events,
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    };
  }

  @Get("events")
  events() {
    return this.prisma.galleryEvent.findMany({
      where: { published: true },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, slug: true, description: true, startsAt: true, endsAt: true, coverUrl: true },
    });
  }
}

@ApiTags("admin content")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@Controller("admin")
export class ContentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get("overview")
  async overview() {
    const [artworks, students, categories, pending, published, recentUploads] = await this.prisma.$transaction([
      this.prisma.artwork.count(),
      this.prisma.student.count(),
      this.prisma.category.count(),
      this.prisma.artwork.count({ where: { status: "DRAFT" } }),
      this.prisma.artwork.count({ where: { status: "PUBLISHED" } }),
      this.prisma.artwork.findMany({
        take: 6, orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true, status: true, images: { take: 1, select: { url: true } } },
      }),
    ]);
    return { artworks, students, categories, pending, published, recentUploads };
  }

  @Get("artworks")
  listArtworks() {
    return this.prisma.artwork.findMany({ include: publicArtworkInclude, orderBy: { createdAt: "desc" } });
  }

  @Post("artworks")
  createArtwork(@Body() body: CreateArtworkDto) {
    const { images, createdOn, ...artwork } = body;
    return this.prisma.artwork.create({
      data: {
        ...artwork,
        slug: artwork.slug ? makeSlug(artwork.slug) : makeUniqueSlug(artwork.title),
        createdOn: createdOn ? new Date(createdOn) : undefined,
        images: images ? { create: images } : undefined,
      },
      include: publicArtworkInclude,
    });
  }

  @Put("artworks/:id")
  async updateArtwork(@Param("id") id: string, @Body() body: UpdateArtworkDto) {
    const { images, createdOn, ...artwork } = body;
    const oldImages = images ? await this.prisma.artworkImage.findMany({ where: { artworkId: id } }) : [];
    let oldVideoId: string | null = null;
    if (body.videoPublicId !== undefined || body.videoUrl === null) {
      const current = await this.prisma.artwork.findUnique({ where: { id }, select: { videoPublicId: true } });
      oldVideoId = current?.videoPublicId ?? null;
    }
    const updated = await this.prisma.artwork.update({
      where: { id },
      data: {
        ...artwork,
        ...(artwork.slug ? { slug: makeSlug(artwork.slug) } : {}),
        ...(body.videoUrl === null ? { videoPublicId: null } : {}),
        createdOn: createdOn === null ? null : createdOn ? new Date(createdOn) : undefined,
        ...(images ? { images: { deleteMany: {}, create: images } } : {}),
      },
      include: publicArtworkInclude,
    });
    for (const image of oldImages) await this.cloudinary.delete(image.publicId);
    if (oldVideoId && oldVideoId !== body.videoPublicId) await this.cloudinary.delete(oldVideoId, "video");
    return updated;
  }

  @Delete("artworks/:id")
  async deleteArtwork(@Param("id") id: string) {
    const images = await this.prisma.artworkImage.findMany({ where: { artworkId: id } });
    for (const image of images) await this.cloudinary.delete(image.publicId);
    const artwork = await this.prisma.artwork.findUnique({ where: { id }, select: { videoPublicId: true } });
    if (artwork?.videoPublicId) await this.cloudinary.delete(artwork.videoPublicId, "video");
    await this.prisma.artwork.delete({ where: { id } });
    return { deleted: true };
  }

  @Get("categories")
  listCategories() {
    return this.prisma.category.findMany({ include: { _count: { select: { artworks: true } } }, orderBy: { sortOrder: "asc" } });
  }

  @Post("categories")
  createCategory(@Body() body: CreateCategoryDto) {
    return this.prisma.category.create({ data: { ...body, slug: body.slug ? makeSlug(body.slug) : makeUniqueSlug(body.name) } });
  }

  @Patch("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() body: UpdateCategoryDto) {
    const current = await this.prisma.category.findUnique({ where: { id }, select: { coverPublicId: true } });
    const updated = await this.prisma.category.update({ where: { id }, data: { ...body, ...(body.slug ? { slug: makeSlug(body.slug) } : {}) } });
    if (current?.coverPublicId && body.coverPublicId !== undefined && current.coverPublicId !== body.coverPublicId) {
      await this.cloudinary.delete(current.coverPublicId);
    }
    return updated;
  }

  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { artworks: true } } } });
    if (category?._count.artworks) throw new ConflictException("Move or delete artworks in this category before deleting it.");
    if (category?.coverPublicId) await this.cloudinary.delete(category.coverPublicId);
    return this.prisma.category.delete({ where: { id } });
  }

  @Get("projects")
  listProjects() {
    return this.prisma.project.findMany({ include: { _count: { select: { artworks: true } } }, orderBy: { createdAt: "desc" } });
  }

  @Get("events")
  listEvents() {
    return this.prisma.galleryEvent.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Post("events")
  createEvent(@Body() body: CreateGalleryEventDto) {
    const { startsAt, endsAt, ...event } = body;
    return this.prisma.galleryEvent.create({
      data: {
        ...event,
        slug: event.slug ? makeSlug(event.slug) : makeUniqueSlug(event.title),
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
      },
    });
  }

  @Patch("events/:id")
  async updateEvent(@Param("id") id: string, @Body() body: UpdateGalleryEventDto) {
    const { startsAt, endsAt, ...event } = body;
    const current = await this.prisma.galleryEvent.findUnique({ where: { id }, select: { coverPublicId: true } });
    const updated = await this.prisma.galleryEvent.update({
      where: { id },
      data: {
        ...event,
        ...(event.slug ? { slug: makeSlug(event.slug) } : {}),
        startsAt: startsAt === null ? null : startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt === null ? null : endsAt ? new Date(endsAt) : undefined,
      },
    });
    if (current?.coverPublicId && event.coverPublicId !== undefined && current.coverPublicId !== event.coverPublicId) {
      await this.cloudinary.delete(current.coverPublicId);
    }
    return updated;
  }

  @Delete("events/:id")
  async deleteEvent(@Param("id") id: string) {
    const event = await this.prisma.galleryEvent.findUnique({ where: { id }, select: { coverPublicId: true } });
    if (event?.coverPublicId) await this.cloudinary.delete(event.coverPublicId);
    return this.prisma.galleryEvent.delete({ where: { id } });
  }

  @Post("projects")
  createProject(@Body() body: CreateProjectDto) {
    const { startsAt, endsAt, ...project } = body;
    return this.prisma.project.create({
      data: {
        ...project, slug: project.slug ? makeSlug(project.slug) : makeUniqueSlug(project.name),
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
      },
    });
  }

  @Patch("projects/:id")
  async updateProject(@Param("id") id: string, @Body() body: UpdateProjectDto) {
    const { startsAt, endsAt, ...project } = body;
    const current = await this.prisma.project.findUnique({ where: { id }, select: { coverPublicId: true } });
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...project, ...(project.slug ? { slug: makeSlug(project.slug) } : {}),
        startsAt: startsAt === null ? null : startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt === null ? null : endsAt ? new Date(endsAt) : undefined,
      },
    });
    if (current?.coverPublicId && project.coverPublicId !== undefined && current.coverPublicId !== project.coverPublicId) {
      await this.cloudinary.delete(current.coverPublicId);
    }
    return updated;
  }

  @Delete("projects/:id")
  async deleteProject(@Param("id") id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id }, include: { _count: { select: { artworks: true } } },
    });
    if (project?._count.artworks) throw new ConflictException("Remove artworks from this project before deleting it.");
    if (project?.coverPublicId) await this.cloudinary.delete(project.coverPublicId);
    return this.prisma.project.delete({ where: { id } });
  }

  @Get("students")
  listStudents() {
    return this.prisma.student.findMany({
      include: { grade: true, schoolClass: true, _count: { select: { artworks: true } } },
      orderBy: { fullName: "asc" },
    });
  }

  @Post("students")
  createStudent(@Body() body: CreateStudentDto) {
    return this.prisma.student.create({ data: body, include: { grade: true, schoolClass: true } });
  }

  @Patch("students/:id")
  async updateStudent(@Param("id") id: string, @Body() body: UpdateStudentDto) {
    const current = await this.prisma.student.findUnique({ where: { id }, select: { profilePublicId: true } });
    const updated = await this.prisma.student.update({ where: { id }, data: body, include: { grade: true, schoolClass: true } });
    if (current?.profilePublicId && body.profilePublicId !== undefined && current.profilePublicId !== body.profilePublicId) {
      await this.cloudinary.delete(current.profilePublicId);
    }
    return updated;
  }

  @Delete("students/:id")
  async deleteStudent(@Param("id") id: string) {
    const student = await this.prisma.student.findUnique({ where: { id }, include: { _count: { select: { artworks: true } } } });
    if (student?._count.artworks) throw new ConflictException("Reassign or delete this student's artworks before deleting the student.");
    if (!student) throw new NotFoundException("Student not found.");
    if (student?.profilePublicId) await this.cloudinary.delete(student.profilePublicId);
    return this.prisma.student.delete({ where: { id } });
  }

  @Get("grades")
  listGrades() {
    return this.prisma.grade.findMany({ include: { classes: true }, orderBy: { sortOrder: "asc" } });
  }

  @Post("grades")
  createGrade(@Body() body: CreateGradeDto) {
    return this.prisma.grade.create({ data: body });
  }

  @Patch("grades/:id")
  updateGrade(@Param("id") id: string, @Body() body: UpdateGradeDto) {
    return this.prisma.grade.update({ where: { id }, data: body });
  }

  @Delete("grades/:id")
  deleteGrade(@Param("id") id: string) {
    return this.prisma.grade.delete({ where: { id } });
  }

  @Get("classes")
  listClasses() {
    return this.prisma.schoolClass.findMany({ include: { grade: true }, orderBy: [{ grade: { sortOrder: "asc" } }, { name: "asc" }] });
  }

  @Post("classes")
  createClass(@Body() body: CreateSchoolClassDto) {
    return this.prisma.schoolClass.create({ data: body, include: { grade: true } });
  }

  @Patch("classes/:id")
  updateClass(@Param("id") id: string, @Body() body: UpdateSchoolClassDto) {
    return this.prisma.schoolClass.update({ where: { id }, data: body, include: { grade: true } });
  }

  @Delete("classes/:id")
  deleteClass(@Param("id") id: string) {
    return this.prisma.schoolClass.delete({ where: { id } });
  }

  @Get("website-settings")
  getWebsiteSettings() {
    return this.prisma.websiteSettings.findUnique({ where: { id: "main" } });
  }

  @Put("website-settings")
  async updateWebsiteSettings(@Body() body: UpdateWebsiteSettingsDto) {
    const current = await this.prisma.websiteSettings.findUnique({ where: { id: "main" } });
    const previousMedia = [
      [current?.teacherPhotoPublicId, body.teacherPhotoPublicId],
      [current?.schoolLogoPublicId, body.schoolLogoPublicId],
      [current?.organizationLogoPublicId, body.organizationLogoPublicId],
    ] as const;
    for (const [publicId, url] of [
      [body.teacherPhotoPublicId, body.teacherPhotoUrl],
      [body.schoolLogoPublicId, body.schoolLogoUrl],
      [body.organizationLogoPublicId, body.organizationLogoUrl],
    ] as const) {
      if (publicId && !url) throw new BadRequestException("A media public ID requires its corresponding URL.");
    }
    const updated = await this.prisma.websiteSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...body },
      update: body,
    });
    for (const [oldPublicId, nextPublicId] of previousMedia) {
      if (oldPublicId && nextPublicId !== undefined && oldPublicId !== nextPublicId) await this.cloudinary.delete(oldPublicId);
    }
    return updated;
  }
}
