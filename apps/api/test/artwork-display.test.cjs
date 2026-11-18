const test = require("node:test");
const assert = require("node:assert/strict");
const { ContentController, PublicContentController } = require("../dist/content/content.controller");

test("public gallery orders assigned positions first and accepts works without students", async () => {
  let artworkQuery;
  const row = {
    id: "art", title: "Art", slug: "art", description: null, student: null,
    category: { id: "cat", name: "Category", slug: "category", sortOrder: 0 },
    project: null, videoUrl: null, createdOn: null, createdAt: new Date("2026-01-01"),
    materials: [], images: [], featured: false,
  };
  const prisma = {
    artwork: {
      findMany: (query) => { artworkQuery = query; return [row]; },
      count: () => 1,
    },
    category: { findMany: () => [] },
    websiteSettings: { findUnique: () => null },
    grade: { findMany: () => [] },
    schoolClass: { findMany: () => [] },
    project: { findMany: () => [] },
    galleryEvent: { findMany: () => [] },
    $transaction: async (operations) => operations,
  };
  const result = await new PublicContentController(prisma).gallery();
  assert.deepEqual(artworkQuery.orderBy[0], { sortOrder: { sort: "asc", nulls: "last" } });
  assert.equal(result.artworks[0].studentDisplayName, "");
  assert.equal(result.artworks[0].gradeName, null);
});

test("replacing a photo deletes only media that is no longer referenced", async () => {
  const deleted = [];
  const prisma = {
    artworkImage: { findMany: async () => [{ publicId: "old" }, { publicId: "keep" }] },
    artwork: { update: async () => ({ id: "art" }) },
  };
  const controller = new ContentController(prisma, { delete: async (id) => deleted.push(id) });
  await controller.updateArtwork("art", { images: [{ url: "https://example.com/keep", publicId: "keep" }] });
  assert.deepEqual(deleted, ["old"]);
});
