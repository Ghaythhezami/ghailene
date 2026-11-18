const test = require("node:test");
const assert = require("node:assert/strict");
const { Writable } = require("node:stream");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryService } = require("../dist/media/cloudinary.service");

test("invalid Cloudinary signatures return actionable errors without exposing the signature", async () => {
  const originalConfig = cloudinary.config;
  const originalUpload = cloudinary.uploader.upload_stream;
  cloudinary.config = () => ({});
  cloudinary.uploader.upload_stream = (_options, callback) => new Writable({
    write(_chunk, _encoding, done) { done(); },
    final(done) { callback({ message: "Invalid Signature sensitive-signature" }); done(); },
  });
  const config = {
    get: () => "configured",
    getOrThrow: () => "configured",
  };
  try {
    await assert.rejects(new CloudinaryService(config).upload(Buffer.from("image"), "image"), (error) => {
      assert.equal(error.getStatus(), 503);
      assert.match(error.message, /Cloudinary/);
      assert.doesNotMatch(error.message, /sensitive-signature/);
      return true;
    });
  } finally {
    cloudinary.config = originalConfig;
    cloudinary.uploader.upload_stream = originalUpload;
  }
});
