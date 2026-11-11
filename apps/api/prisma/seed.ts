import dotenv from "dotenv";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: process.env.ENV_FILE || "../../.env" });
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters before seeding.");
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, active: true },
    create: { email: email.toLowerCase(), passwordHash, role: "ADMIN" },
  });

  const initialCategories = [
    ["إبداعات عن بُعد", "remote"],
    ["إبداعات حضورية", "onsite"],
    ["مشاريع فنية", "projects"],
    ["يوم التأسيس", "founding-day"],
    ["يوم الوطن", "national-day"],
    ["عالم المجسمات", "models"],
    ["لحظات فنية", "moments"],
    ["نجوم بصمة فن", "featured"],
    ["معارضنا الفنية", "exhibitions"],
  ];
  for (const [index, [name, slug]] of initialCategories.entries()) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, sortOrder: index },
      create: { name, slug, sortOrder: index },
    });
  }
  await prisma.websiteSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
