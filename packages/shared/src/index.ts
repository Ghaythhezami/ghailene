export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  sortOrder: number;
}

export interface PublicArtwork {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  studentDisplayName: string;
  gradeName?: string | null;
  category: PublicCategory;
  projectName?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  materials: string[];
  images: Array<{ url: string; alt?: string | null }>;
  featured: boolean;
}

export interface PublicSettings {
  platformName: string;
  subtitle: string;
  slogan: string;
  secondarySlogan?: string;
  description: string;
  teacherName: string;
  teacherTitle: string;
  teacherPhotoUrl?: string | null;
  academicSupervisor: string;
  principal: string;
  schoolLogoUrl?: string | null;
  organizationLogoUrl?: string | null;
}

export interface PublicFilterOptions {
  grades: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; gradeId: string }>;
  projects: Array<{ id: string; name: string }>;
}

export interface PublicGalleryEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  coverUrl?: string | null;
}
