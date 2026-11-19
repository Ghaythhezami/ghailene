export async function compressImage(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("تعذر قراءة الصورة. اختر ملف صورة صالحاً.");
    }

    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذر تجهيز الصورة للرفع.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("تعذر ضغط الصورة.")), "image/webp", 0.82);
    });
    if (compressed.size >= file.size) return file;
    const extension = compressed.type === "image/webp" ? "webp" : "png";
    return new File([compressed], `artwork.${extension}`, { type: compressed.type });
  } finally {
    URL.revokeObjectURL(url);
  }
}
