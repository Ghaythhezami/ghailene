"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { ChevronLeft, LogOut, Palette, Save, Trash2, Upload, X } from "lucide-react";
import { AdminRequestError, adminRequest } from "@/lib/admin-api";

type Category = { id: string; name: string };
type Artwork = {
  id: string;
  title: string;
  categoryId: string;
  sortOrder: number | null;
  images: Array<{ url: string; publicId: string; alt: string | null; sortOrder: number }>;
};
type UploadResult = { url: string; publicId: string };

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [editing, setEditing] = useState<Artwork | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!photo) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function clearPhoto() {
    setPhoto(null);
    setUploadedPhoto(null);
  }

  async function uploadPhoto(file: File) {
    setUploading(true); setError(""); setNotice("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
        throw new Error("اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 10 ميغابايت.");
      }
      const upload = new FormData();
      upload.append("file", file);
      setUploadedPhoto(await adminRequest<UploadResult>("/admin/media/upload", { method: "POST", body: upload }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر رفع الصورة.");
    } finally { setUploading(false); }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedPhoto(null);
    setPhoto(file);
    void uploadPhoto(file);
  }

  const load = useCallback(async () => {
    try {
      const [nextCategories, nextArtworks] = await Promise.all([
        adminRequest<Category[]>("/admin/categories"),
        adminRequest<Artwork[]>("/admin/artworks"),
      ]);
      setCategories(nextCategories);
      setArtworks(nextArtworks);
    } catch (requestError) {
      if (requestError instanceof AdminRequestError && requestError.status === 401) setAuthenticated(false);
      else setError(requestError instanceof Error ? requestError.message : "تعذر تحميل بيانات لوحة الإدارة.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void adminRequest("/auth/session").then(() => {
      if (active) setAuthenticated(true);
    }).catch((requestError: unknown) => {
      if (active && !(requestError instanceof AdminRequestError && requestError.status === 401)) {
        setError(requestError instanceof Error ? requestError.message : "تعذر الاتصال بالخادم.");
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (authenticated) void load(); }, [authenticated, load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await adminRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setPassword(""); setAuthenticated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر تسجيل الدخول.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      await adminRequest("/auth/logout", { method: "POST" });
      setAuthenticated(false); setArtworks([]); setEditing(null); clearPhoto();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إنهاء الجلسة.");
    } finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      let images: Array<UploadResult & { alt: string; sortOrder: number }> | undefined;
      if (photo) {
        if (!uploadedPhoto) throw new Error("يجب رفع الصورة بنجاح قبل حفظ العمل.");
        images = [
          { ...uploadedPhoto, alt: String(data.get("title")), sortOrder: 0 },
          ...(editing?.images.slice(1).map((image) => ({
            ...image, alt: image.alt ?? "", sortOrder: image.sortOrder,
          })) ?? []),
        ];
      }
      const payload = {
        title: String(data.get("title")).trim(),
        categoryId: String(data.get("categoryId")),
        sortOrder: Number(data.get("sortOrder")),
        ...(editing ? {} : { status: "PUBLISHED" }),
        ...(images ? { images } : {}),
      };
      await adminRequest(`/admin/artworks${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST", body: JSON.stringify(payload),
      });
      setNotice(editing ? "تم تحديث العمل الفني." : "تمت إضافة العمل الفني.");
      setEditing(null); clearPhoto(); form.reset();
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر حفظ العمل الفني.");
    } finally { setBusy(false); }
  }

  async function remove(artwork: Artwork) {
    if (!window.confirm(`هل تريد حذف «${artwork.title}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest(`/admin/artworks/${artwork.id}`, { method: "DELETE" });
      if (editing?.id === artwork.id) { setEditing(null); clearPhoto(); }
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إكمال العملية.");
    } finally { setBusy(false); }
  }

  if (!authenticated) return (
    <main className="admin-login">
      <a className="admin-brand" href="/"><span className="admin-brand-icon"><Palette size={22} /></span><span><strong>بصمة فن</strong><small>إدارة المعرض</small></span></a>
      <form className="login-card" onSubmit={login}>
        <span className="admin-eyebrow">مساحة آمنة للمشرفين</span><h1>مرحباً بعودتك</h1><p>سجّل الدخول لإدارة المعرض وإبداعات الطلاب.</p>
        {error && <div className="admin-error" role="alert">{error}</div>}
        <label>البريد الإلكتروني<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>كلمة المرور<input type="password" autoComplete="current-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="admin-submit" type="submit" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"} <ChevronLeft size={17} /></button>
        <a className="back-home" href="/">العودة إلى المعرض</a>
      </form>
      <small className="login-footnote">لا يوجد تسجيل عام. يُنشأ حساب المدير من خلال إعداد الخادم.</small>
    </main>
  );

  return (
    <main className="simple-admin">
      <header className="simple-admin-header">
        <a href="/" className="simple-admin-brand"><Palette size={25} /> بصمة فن</a>
        <button type="button" onClick={logout} disabled={busy || uploading}><LogOut size={18} /> تسجيل الخروج</button>
      </header>
      <section className="simple-admin-content">
        <h1>الأعمال الفنية</h1>
        {error && <div className="admin-error" role="alert">{error}</div>}
        {notice && <div className="admin-success" role="status">{notice}</div>}
        <form key={editing?.id ?? "new"} className="admin-panel edit-form" onSubmit={save}>
          <div className="panel-title"><h2>{editing ? "تعديل العمل الفني" : "إضافة عمل فني"}</h2>{editing && <button type="button" className="icon-button" disabled={busy || uploading} onClick={() => { setEditing(null); clearPhoto(); }} aria-label="إلغاء التعديل"><X size={18} /></button>}</div>
          <div className="form-grid">
            <label>القسم<select name="categoryId" defaultValue={editing?.categoryId ?? ""} required><option value="" disabled>اختر القسم</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>عنوان العمل<input name="title" defaultValue={editing?.title ?? ""} required /></label>
            <label>ترتيب العرض<input type="number" name="sortOrder" min="0" step="1" defaultValue={editing?.sortOrder ?? 0} required /></label>
            <label className="upload-field"><Upload size={19} /><span>اختر صورة</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={busy || uploading} required={!editing?.images.length} /></label>
          </div>
          {(previewUrl || editing?.images[0]) && <div className="admin-photo-preview">
            <img src={previewUrl || editing?.images[0]?.url} alt="معاينة الصورة" />
            <div>
              <strong>معاينة الصورة</strong>
              <p role="status">{uploading ? "جارٍ رفع الصورة إلى Cloudinary..." : uploadedPhoto ? "تم رفع الصورة، يمكنك حفظ العمل." : photo ? "لم يتم رفع الصورة." : "الصورة الحالية"}</p>
              {photo && !uploadedPhoto && !uploading && <button type="button" disabled={busy} onClick={() => void uploadPhoto(photo)}>إعادة محاولة الرفع</button>}
            </div>
          </div>}
          <button type="submit" disabled={busy || uploading || Boolean(photo && !uploadedPhoto)} className="admin-submit"><Save size={16} />{busy ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة العمل"}</button>
        </form>
        <div className="simple-admin-list">
          {artworks.map((artwork) => <article key={artwork.id}>
            {artwork.images[0] && <img src={artwork.images[0].url} alt="" />}
            <div><strong>{artwork.title}</strong><small>{categories.find((category) => category.id === artwork.categoryId)?.name}</small></div>
            <button type="button" onClick={() => { clearPhoto(); setEditing(artwork); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={busy || uploading}>تعديل</button>
            <button type="button" onClick={() => void remove(artwork)} disabled={busy || uploading} aria-label={`حذف ${artwork.title}`}><Trash2 size={18} /></button>
          </article>)}
        </div>
      </section>
    </main>
  );
}
