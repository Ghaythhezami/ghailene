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

test("public feedback only lists approved entries and submission remains pending", async () => {
  let query;
  let created;
  const prisma = { visitorFeedback: {
    findMany: (options) => { query = options; return []; },
    create: (options) => { created = options; return Promise.resolve({}); },
  } };
  const publicController = new PublicContentController(prisma);
  await publicController.feedback();
  assert.deepEqual(query.where, { approved: true });
  assert.deepEqual(await publicController.submitFeedback({ name: "زائر", message: "جميل" }), { submitted: true });
  assert.deepEqual(created.data, { name: "زائر", message: "جميل" });
  let update;
  prisma.visitorFeedback.update = (options) => { update = options; return options; };
  const adminController = new ContentController(prisma, {});
  await adminController.moderateFeedback("feedback-id", { approved: true });
  assert.deepEqual(update, { where: { id: "feedback-id" }, data: { approved: true } });
});
