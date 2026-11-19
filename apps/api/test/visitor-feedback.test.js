require("reflect-metadata");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const { CreateFeedbackDto } = require("../dist/content/dto");
const { PublicContentController, ContentController } = require("../dist/content/content.controller");

test("feedback is trimmed and rejects blank or oversized submissions", async () => {
  const valid = plainToInstance(CreateFeedbackDto, { name: "  زائر  ", message: "  جميل  " });
  assert.equal((await validate(valid)).length, 0);
  assert.equal(valid.name, "زائر");
  assert.equal(valid.message, "جميل");
  const invalid = plainToInstance(CreateFeedbackDto, { name: "   ", message: "x".repeat(501) });
  assert.equal((await validate(invalid)).length, 2);
});

test("public feedback is published immediately and paginated while rejected entries stay hidden", async () => {
  let query;
  let created;
  const prisma = { visitorFeedback: {
    findMany: (options) => { query = options; return []; },
    count: () => 11,
    create: (options) => { created = options; return Promise.resolve({ id: "new", name: "زائر", message: "جميل" }); },
  }, $transaction: (operations) => Promise.all(operations) };
  const publicController = new PublicContentController(prisma);
  const result = await publicController.feedback("2");
  assert.deepEqual(query.where, { approved: true });
  assert.equal(query.take, 10);
  assert.equal(query.skip, 10);
  assert.deepEqual(result.pagination, { page: 2, pageSize: 10, total: 11, pages: 2 });
  assert.equal((await publicController.submitFeedback({ name: "زائر", message: "جميل" })).id, "new");
  assert.deepEqual(created.data, { name: "زائر", message: "جميل", approved: true });
  let update;
  prisma.visitorFeedback.update = (options) => { update = options; return options; };
  const adminController = new ContentController(prisma, {});
  await adminController.moderateFeedback("feedback-id", { approved: false });
  assert.deepEqual(update, { where: { id: "feedback-id" }, data: { approved: false } });
});
