"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Activity, BookOpen, Check, ChevronLeft, CircleUserRound, Eye, FolderKanban, Image as ImageIcon,
  LayoutDashboard, LogOut, Palette, Plus, Save, Settings, Trash2, Upload, Users, X,
} from "lucide-react";
import { AdminRequestError, adminRequest } from "@/lib/admin-api";

type Tab = "overview" | "artworks" | "categories" | "projects" | "events" | "students" | "grades" | "classes" | "settings";
type RecordRow = Record<string, unknown> & { id: string; name?: string; title?: string; slug?: string; status?: string };
type Overview = { artworks: number; students: number; categories: number; pending: number; published: number; recentUploads: RecordRow[] };
type UploadResult = { url: string; publicId: string };

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "artworks", label: "الأعمال الفنية", icon: Palette },
  { id: "categories", label: "الأقسام", icon: ImageIcon },
  { id: "projects", label: "المشاريع", icon: FolderKanban },
  { id: "events", label: "المعارض والفعاليات", icon: ImageIcon },
  { id: "students", label: "الطلاب", icon: Users },
  { id: "grades", label: "الصفوف والفصول", icon: BookOpen },
  { id: "classes", label: "إدارة الفصول", icon: BookOpen },
  { id: "settings", label: "إعدادات الموقع", icon: Settings },
];

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [related, setRelated] = useState<Record<string, RecordRow[]>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void adminRequest("/auth/session")
      .then(() => { if (active) setAuthenticated(true); })
      .catch((requestError: unknown) => {
        const message = requestError instanceof Error ? requestError.message : "";
        if (active && !(requestError instanceof AdminRequestError && requestError.status === 401)) setError(message || "تعذر الاتصال بالخادم.");
      });
    return () => { active = false; };
  }, []);

  const loadTab = useCallback(async (activeTab: Tab) => {
    setError("");
    try {
      if (activeTab === "overview") {
        setOverview(await adminRequest<Overview>("/admin/overview"));
      } else if (activeTab === "settings") {
        const values = await adminRequest<Record<string, unknown> | null>("/admin/website-settings");
        setSettings(Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [key, String(value ?? "")])));
      } else if (activeTab === "artworks") {
        const [artworks, students, categories, projects] = await Promise.all([
          adminRequest<RecordRow[]>("/admin/artworks"),
          adminRequest<RecordRow[]>("/admin/students"),
          adminRequest<RecordRow[]>("/admin/categories"),
          adminRequest<RecordRow[]>("/admin/projects"),
        ]);
        setRows(artworks);
        setRelated({ students, categories, projects });
      } else if (activeTab === "students") {
        const [students, grades, classes] = await Promise.all([
          adminRequest<RecordRow[]>("/admin/students"),
          adminRequest<RecordRow[]>("/admin/grades"),
          adminRequest<RecordRow[]>("/admin/classes"),
        ]);
        setRows(students);
        setRelated({ grades, classes });
      } else if (activeTab === "grades") {
        const [grades, classes] = await Promise.all([
          adminRequest<RecordRow[]>("/admin/grades"),
          adminRequest<RecordRow[]>("/admin/classes"),
        ]);
        setRows(grades);
        setRelated({ classes });
      } else if (activeTab === "classes") {
        const [classes, grades] = await Promise.all([
          adminRequest<RecordRow[]>("/admin/classes"),
          adminRequest<RecordRow[]>("/admin/grades"),
        ]);
        setRows(classes);
        setRelated({ grades });
      } else {
        const endpoint = activeTab === "categories" ? "/admin/categories" : activeTab === "events" ? "/admin/events" : "/admin/projects";
        setRows(await adminRequest<RecordRow[]>(endpoint));
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "تعذر تحميل بيانات لوحة الإدارة.";
      if (requestError instanceof AdminRequestError && requestError.status === 401) {
        setAuthenticated(false);
      } else setError(message);
    }
  }, []);

  useEffect(() => {
    if (authenticated) void loadTab(tab);
  }, [authenticated, tab, loadTab]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setAuthenticated(true);
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await adminRequest("/auth/logout", { method: "POST" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إنهاء الجلسة.");
    } finally {
      setAuthenticated(false);
      setOverview(null);
      setRows([]);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await perform(async () => {
      const editable = [
        "platformName", "subtitle", "slogan", "secondarySlogan", "description", "teacherName",
        "teacherTitle", "teacherPhotoUrl", "teacherPhotoPublicId", "academicSupervisor", "principal",
        "schoolLogoUrl", "schoolLogoPublicId", "organizationLogoUrl", "organizationLogoPublicId",
      ];
      const nullable = new Set(["teacherPhotoUrl", "teacherPhotoPublicId", "schoolLogoUrl", "schoolLogoPublicId", "organizationLogoUrl", "organizationLogoPublicId"]);
      const payload = Object.fromEntries(editable.map((key) => [key, nullable.has(key) ? settings[key] || null : settings[key] || ""]));
      await adminRequest("/admin/website-settings", { method: "PUT", body: JSON.stringify(payload) });
      setNotice("تم حفظ إعدادات الموقع.");
    });
  }

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await loadTab(tab);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إكمال العملية.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(tabName: Tab, id: string, label: string) {
    if (!window.confirm(`هل تريد حذف «${label}»؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    const endpoint = tabName === "artworks" ? "artworks" : tabName === "categories" ? "categories" : tabName === "projects" ? "projects" : tabName === "events" ? "events" : tabName === "students" ? "students" : tabName === "classes" ? "classes" : "grades";
    await perform(async () => { await adminRequest(`/admin/${endpoint}/${id}`, { method: "DELETE" }); });
  }

  if (!authenticated) {
    return (
      <main className="admin-login">
        <a className="admin-brand" href="/"><span className="admin-brand-icon"><Palette size={22} /></span><span><strong>بصمة فن</strong><small>إدارة المعرض</small></span></a>
        <form className="login-card" onSubmit={login}>
          <span className="admin-eyebrow">مساحة آمنة للمشرفين</span>
          <h1>مرحباً بعودتك</h1>
          <p>سجّل الدخول لإدارة المعرض وإبداعات الطلاب.</p>
          {error && <div className="admin-error" role="alert">{error}</div>}
          <label>البريد الإلكتروني<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>كلمة المرور<input type="password" autoComplete="current-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="admin-submit" type="submit" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"} <ChevronLeft size={17} /></button>
          <a className="back-home" href="/">العودة إلى المعرض</a>
        </form>
        <small className="login-footnote">لا يوجد تسجيل عام. يُنشأ حساب المدير من خلال إعداد الخادم.</small>
      </main>
    );
  }

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand"><span className="admin-brand-icon"><Palette size={22} /></span><span><strong>بصمة فن</strong><small>لوحة الإدارة</small></span></a>
        <div className="sidebar-caption">إدارة المعرض</div>
        <nav className="admin-nav" aria-label="قائمة الإدارة">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}><Icon size={17} />{label}</button>)}
        </nav>
        <div className="sidebar-footer"><a href="/" target="_blank" rel="noreferrer"><ExternalLinkIcon /> عرض الموقع</a><button onClick={logout}><LogOut size={16} /> تسجيل الخروج</button></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div><span className="admin-eyebrow">بصمة فن · الابتكارية ٢</span><h1>{tabs.find((item) => item.id === tab)?.label}</h1></div><span className="admin-profile"><CircleUserRound size={20} /> مدير المعرض</span></header>
        <div className="admin-content">
          {error && <div className="admin-error" role="alert">{error}</div>}
          {notice && <div className="admin-success" role="status"><Check size={17} />{notice}</div>}
          {tab === "overview" && overview && <OverviewPanel overview={overview} onNavigate={setTab} />}
          {tab === "artworks" && <ArtworkManagement rows={rows} related={related} onRefresh={() => loadTab(tab)} onError={setError} onSuccess={setNotice} onDelete={remove} busy={busy} setBusy={setBusy} />}
          {["categories", "projects", "events", "students", "grades", "classes"].includes(tab) && <EntityManagement tab={tab} rows={rows} related={related} onSubmit={(action) => perform(action)} onDelete={remove} />}
          {tab === "settings" && <SettingsForm settings={settings} setSettings={setSettings} onSubmit={saveSettings} busy={busy} onError={setError} />}
        </div>
      </section>
    </main>
  );
}

function ExternalLinkIcon() { return <Activity size={16} />; }

function OverviewPanel({ overview, onNavigate }: { overview: Overview; onNavigate: (tab: Tab) => void }) {
  const stats = [
    { label: "إجمالي الأعمال", count: overview.artworks, icon: Palette, color: "turquoise" },
    { label: "الطلاب المشاركون", count: overview.students, icon: Users, color: "coral" },
    { label: "أقسام المعرض", count: overview.categories, icon: ImageIcon, color: "gold" },
    { label: "بانتظار النشر", count: overview.pending, icon: Activity, color: "plum" },
  ];
  return (
    <div className="overview-content">
      <div className="welcome-strip"><div><span>مساء الإبداع</span><h2>المعرض يكبر ببصماتكم.</h2><p>إليك لمحة عمّا يحدث في معرضك الفني.</p></div><button onClick={() => onNavigate("artworks")}><Plus size={17} /> إضافة عمل فني</button></div>
      <div className="stats-grid">{stats.map(({ label, count, icon: Icon, color }) => <article className={`stat-card stat-${color}`} key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{count}</strong></div></article>)}</div>
      <div className="overview-lower"><article className="admin-panel"><div className="panel-title"><h2>أضيفت مؤخراً</h2><button onClick={() => onNavigate("artworks")}>كل الأعمال <ChevronLeft size={15} /></button></div>{overview.recentUploads.length ? <div className="recent-list">{overview.recentUploads.map((row) => <div key={row.id}><span className="recent-thumb"><ImageIcon size={17} /></span><span><strong>{String(row.title)}</strong><small>{new Date(String(row.createdAt)).toLocaleDateString("ar-SA")}</small></span><i className={`status-chip ${row.status === "PUBLISHED" ? "published" : "draft"}`}>{row.status === "PUBLISHED" ? "منشور" : "مسودة"}</i></div>)}</div> : <p className="admin-empty">ستظهر الأعمال هنا عند إضافتها.</p>}</article><article className="admin-panel publication-panel"><span className="publication-icon"><Check size={21} /></span><h2>أعمال منشورة</h2><strong>{overview.published}</strong><p>عمل فني يشارك إبداع طلابنا مع العالم.</p><button onClick={() => onNavigate("artworks")}>إدارة المنشورات <ChevronLeft size={15} /></button></article></div>
    </div>
  );
}

function ArtworkManagement({
  rows, related, onRefresh, onError, onSuccess, onDelete, busy, setBusy,
}: {
  rows: RecordRow[]; related: Record<string, RecordRow[]>; onRefresh: () => Promise<void>;
  onError: (message: string) => void; onSuccess: (message: string) => void;
  onDelete: (tab: Tab, id: string, label: string) => Promise<void>;
  busy: boolean; setBusy: (busy: boolean) => void;
}) {
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [preview, setPreview] = useState<{
    title: string; description: string; student: string; category: string; mediaUrl?: string; isVideo: boolean;
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => () => {
    if (preview?.mediaUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.mediaUrl);
  }, [preview?.mediaUrl]);

  function showPreview() {
    const form = document.getElementById("artwork-form") as HTMLFormElement | null;
    if (!form?.reportValidity()) return;
    const data = new FormData(form);
    const media = data.getAll("media").find((file): file is File => file instanceof File && file.size > 0);
    const existingImage = (editing?.images as Array<{ url: string }> | undefined)?.[0];
    const existingVideo = editing?.videoUrl as string | undefined;
    const student = (related.students || []).find((item) => item.id === data.get("studentId"));
    const category = (related.categories || []).find((item) => item.id === data.get("categoryId"));
    setPreview({
      title: String(data.get("title") || ""),
      description: String(data.get("description") || ""),
      student: String(student?.fullName || ""),
      category: String(category?.name || ""),
      mediaUrl: media ? URL.createObjectURL(media) : existingVideo || existingImage?.url,
      isVideo: media ? media.type.startsWith("video/") : Boolean(existingVideo),
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = String(data.get("id") || "");
    setBusy(true); onError(""); onSuccess("");
    try {
      const selectedFiles = data.getAll("media").filter((file): file is File => file instanceof File && file.size > 0);
      const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
      const videoFiles = selectedFiles.filter((file) => file.type.startsWith("video/"));
      if (imageFiles.length > 12 || videoFiles.length > 1 || selectedFiles.length !== imageFiles.length + videoFiles.length) {
        throw new Error("يمكن رفع ١٢ صورة وفيديو واحد كحد أقصى.");
      }
      let images: Array<{ url: string; publicId: string; alt: string; sortOrder: number }> | undefined;
      let videoUrl: string | undefined;
      let videoPublicId: string | undefined;
      for (const [index, media] of selectedFiles.entries()) {
        const uploadData = new FormData(); uploadData.append("file", media);
        setUploadStatus(`جارٍ رفع الملف ${index + 1} من ${selectedFiles.length}`);
        const uploaded = await adminRequest<UploadResult>("/admin/media/upload", { method: "POST", body: uploadData });
        if (media.type.startsWith("video/")) {
          videoUrl = uploaded.url; videoPublicId = uploaded.publicId;
        } else {
          images ||= [];
          images.push({ ...uploaded, alt: String(data.get("title")), sortOrder: index });
        }
      }
      const payload = {
        title: String(data.get("title")), description: String(data.get("description")),
        studentId: String(data.get("studentId")), categoryId: String(data.get("categoryId")),
        projectId: String(data.get("projectId") || "") || undefined,
        materials: String(data.get("materials") || "").split(/[,،]/).map((part) => part.trim()).filter(Boolean),
        createdOn: String(data.get("createdOn") || "") || undefined,
        featured: data.get("featured") === "on",
        status: String(data.get("status")),
        ...(images ? { images } : {}),
        ...(videoUrl ? { videoUrl, videoPublicId } : {}),
      };
      await adminRequest(`/admin/artworks${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST", body: JSON.stringify(payload),
      });
      setUploadStatus("");
      setEditing(null); form.reset(); onSuccess(id ? "تم تحديث العمل الفني." : "تمت إضافة العمل الفني.");
      await onRefresh();
    } catch (requestError) {
      setUploadStatus("");
      onError(requestError instanceof Error ? requestError.message : "تعذر حفظ العمل الفني.");
    } finally { setBusy(false); }
  }
  function edit(row: RecordRow) {
    setEditing(row);
    const form = document.getElementById("artwork-form") as HTMLFormElement | null;
    if (!form) return;
    const set = (name: string, value: unknown) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (field && value != null) {
        if (field instanceof HTMLInputElement && field.type === "checkbox") field.checked = Boolean(value);
        else field.value = String(value);
      }
    };
    set("id", row.id); set("title", row.title);
    set("description", row.description);
    set("studentId", row.studentId); set("categoryId", row.categoryId);
    set("projectId", row.projectId); set("featured", row.featured); set("status", row.status);
    set("materials", Array.isArray(row.materials) ? row.materials.join("، ") : "");
    const createdOn = row.createdOn ? new Date(String(row.createdOn)).toISOString().slice(0, 10) : "";
    set("createdOn", createdOn);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="management-grid">
      <form className="admin-panel edit-form" id="artwork-form" onSubmit={save}>
        <div className="panel-title"><h2>{editing ? "تعديل العمل الفني" : "إضافة عمل فني"}</h2>{editing && <button type="button" className="icon-button" onClick={() => { setEditing(null); (document.getElementById("artwork-form") as HTMLFormElement).reset(); }} aria-label="إلغاء التعديل"><X size={17} /></button>}</div>
        <input type="hidden" name="id" />
        <div className="form-grid">
          <label>عنوان العمل<input name="title" required /></label>
          <label>الطالب<select name="studentId" required defaultValue=""><option value="" disabled>اختر الطالب</option>{(related.students || []).map((student) => <option value={student.id} key={student.id}>{String(student.fullName)}</option>)}</select></label>
          <label>القسم<select name="categoryId" required defaultValue=""><option value="" disabled>اختر القسم</option>{(related.categories || []).map((category) => <option value={category.id} key={category.id}>{String(category.name)}</option>)}</select></label>
          <label>المشروع<select name="projectId" defaultValue=""><option value="">بدون مشروع</option>{(related.projects || []).map((project) => <option value={project.id} key={project.id}>{String(project.name)}</option>)}</select></label>
          <label>تاريخ العمل<input type="date" name="createdOn" /></label>
          <label>حالة النشر<select name="status" defaultValue="DRAFT"><option value="DRAFT">مسودة</option><option value="PUBLISHED">منشور</option><option value="ARCHIVED">مؤرشف</option></select></label>
          <label className="span-two">وصف العمل<textarea name="description" rows={3} /></label>
          <label className="span-two">الخامات المستخدمة<input name="materials" placeholder="ألوان مائية، ورق..." /></label>
          <label className="upload-field span-two" onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add("is-dragging"); }} onDragLeave={(event) => event.currentTarget.classList.remove("is-dragging")} onDrop={(event) => {
            event.preventDefault();
            event.currentTarget.classList.remove("is-dragging");
            const input = event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input && event.dataTransfer.files.length) {
              const transfer = new DataTransfer();
              for (const file of Array.from(event.dataTransfer.files)) transfer.items.add(file);
              input.files = transfer.files;
            }
          }}><Upload size={19} /><span>{uploadStatus || "أفلت الصور هنا أو اختر ملفات" }<small>حتى ١٢ صورة، وفيديو واحد · JPG، PNG، WebP، MP4، WebM</small></span><input type="file" name="media" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" /></label>
          <label className="check-label span-two"><input type="checkbox" name="featured" /> تمييز هذا العمل في المعرض</label>
        </div>
        <div className="form-actions"><button type="button" className="preview-button" onClick={showPreview}><Eye size={16} /> معاينة قبل النشر</button><button type="submit" disabled={busy} className="admin-submit"><Save size={16} />{busy ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة العمل"}</button></div>
      </form>
      <RecordsTable title="الأعمال الفنية" rows={rows} columns={["title", "student", "category", "status"]} onEdit={edit} onDelete={(row) => onDelete("artworks", row.id, String(row.title))} />
      {preview && <div className="admin-preview-backdrop" role="presentation" onClick={() => setPreview(null)}><article className="admin-preview" role="dialog" aria-modal="true" aria-labelledby="admin-preview-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button" onClick={() => setPreview(null)} aria-label="إغلاق المعاينة"><X size={17} /></button>
        {preview.mediaUrl && (preview.isVideo ? <video src={preview.mediaUrl} controls /> : <img src={preview.mediaUrl} alt={preview.title} />)}
        {!preview.mediaUrl && <div className="admin-preview-placeholder"><ImageIcon size={34} /></div>}
        <small>{preview.category}</small><h2 id="admin-preview-title">{preview.title}</h2><p>{preview.description || "عمل فني من إبداع طلابنا."}</p><span>{preview.student}</span>
      </article></div>}
    </div>
  );
}

function EntityManagement({
  tab, rows, related, onSubmit, onDelete,
}: {
  tab: Tab; rows: RecordRow[]; related: Record<string, RecordRow[]>;
  onSubmit: (action: () => Promise<void>) => Promise<void>;
  onDelete: (tab: Tab, id: string, label: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const settings: Record<string, { title: string; endpoint: string; name: string; fields: string[] }> = {
    categories: { title: "الأقسام", endpoint: "categories", name: "name", fields: ["name", "description", "coverUrl", "sortOrder"] },
    projects: { title: "المشاريع", endpoint: "projects", name: "name", fields: ["name", "description", "coverUrl", "startsAt", "endsAt"] },
    events: { title: "المعارض والفعاليات", endpoint: "events", name: "title", fields: ["title", "description", "coverUrl", "startsAt", "endsAt", "published"] },
    students: { title: "الطلاب", endpoint: "students", name: "fullName", fields: ["fullName", "gradeId", "schoolClassId", "profileUrl"] },
    grades: { title: "الصفوف والفصول", endpoint: "grades", name: "name", fields: ["name", "sortOrder"] },
    classes: { title: "الفصول", endpoint: "classes", name: "name", fields: ["name", "gradeId"] },
  };
  const config = settings[tab];
  if (!config) return null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const values: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = String(formData.get(field) || "");
      if (field === "published") values[field] = formData.get(field) === "on";
      else if (value) values[field] = field === "sortOrder" ? Number(value) : value;
    }
    if (tab === "students") values.anonymous = formData.get("anonymous") === "on";
    await onSubmit(async () => {
      const file = formData.get("coverFile") instanceof File ? formData.get("coverFile") as File
        : formData.get("profileFile") instanceof File ? formData.get("profileFile") as File : null;
      if (file?.size) {
        const upload = new FormData(); upload.append("file", file);
        const media = await adminRequest<UploadResult>("/admin/media/upload", { method: "POST", body: upload });
        if (tab === "students") {
          values.profileUrl = media.url;
          values.profilePublicId = media.publicId;
        } else {
          values.coverUrl = media.url;
          values.coverPublicId = media.publicId;
        }
      }
      await adminRequest(`/admin/${config.endpoint}${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      setEditing(null); form.reset();
    });
  }

  function edit(row: RecordRow) {
    setEditing(row);
    const form = document.getElementById("entity-form") as HTMLFormElement;
    form.reset();
    form.elements.namedItem("id") && ((form.elements.namedItem("id") as HTMLInputElement).value = row.id);
    if (tab === "students") {
      const anonymous = form.elements.namedItem("anonymous") as HTMLInputElement | null;
      if (anonymous) anonymous.checked = Boolean(row.anonymous);
    }
    for (const field of config.fields) {
      const element = form.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement | null;
      if (element && row[field] != null) {
        if (element instanceof HTMLInputElement && element.type === "checkbox") element.checked = Boolean(row[field]);
        else if (element instanceof HTMLInputElement && element.type === "date") element.value = new Date(String(row[field])).toISOString().slice(0, 10);
        else element.value = String(row[field]);
      }
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const fieldLabels: Record<string, string> = { name: "الاسم", fullName: "اسم الطالب", title: "عنوان المعرض", description: "الوصف", startsAt: "تاريخ البداية", endsAt: "تاريخ النهاية", gradeId: "الصف", schoolClassId: "الفصل", sortOrder: "ترتيب العرض", coverUrl: "رابط صورة الغلاف", profileUrl: "رابط صورة الطالب", published: "نشر الفعالية" };
  return (
    <div className="management-grid">
      <form className="admin-panel edit-form" id="entity-form" onSubmit={save}>
        <div className="panel-title"><h2>{editing ? `تعديل ${config.title.slice(0, -1)}` : `إضافة ${config.title.slice(0, -1)}`}</h2>{editing && <button type="button" className="icon-button" onClick={() => { setEditing(null); (document.getElementById("entity-form") as HTMLFormElement).reset(); }} aria-label="إلغاء التعديل"><X size={17} /></button>}</div>
        <input type="hidden" name="id" />
        {config.fields.map((field) => <label key={field}>{fieldLabels[field] || field}{(field === "gradeId" || field === "schoolClassId") ? <select name={field} required={field === "gradeId"} defaultValue=""><option value="">اختر</option>{(related[field === "gradeId" ? "grades" : "classes"] || []).map((item) => <option key={item.id} value={item.id}>{String(item.name)}</option>)}</select> : field === "description" ? <textarea name={field} rows={3} /> : field === "published" ? <span className="check-label"><input name={field} type="checkbox" /> نشر الفعالية في الموقع العام</span> : <input name={field} type={field.includes("At") ? "date" : field === "sortOrder" ? "number" : field.endsWith("Url") ? "url" : "text"} required={field === "name" || field === "title" || field === "fullName"} />}</label>)}
        {(tab === "categories" || tab === "projects" || tab === "events" || tab === "students") && <label className="upload-field"><Upload size={19} /><span>{tab === "students" ? "صورة ملف الطالب (اختياري)" : "صورة الغلاف (اختياري)"}<small>JPEG، PNG، WebP · حتى 10 MB</small></span><input type="file" name={tab === "students" ? "profileFile" : "coverFile"} accept="image/jpeg,image/png,image/webp" /></label>}
        {tab === "students" && <label className="check-label"><input type="checkbox" name="anonymous" /> عرض العمل باسم مستعار</label>}
        <button className="admin-submit" type="submit"><Plus size={16} />{editing ? "حفظ التعديلات" : "إضافة"}</button>
      </form>
      <RecordsTable title={config.title} rows={rows} columns={tab === "students" ? ["fullName", "grade", "artworks"] : tab === "grades" ? ["name", "classes"] : tab === "classes" ? ["name", "grade"] : tab === "events" ? ["title", "startsAt", "published"] : ["name", "description"]} onEdit={edit} onDelete={(row) => onDelete(tab, row.id, String(row[config.name] || row.name || row.title))} />
    </div>
  );
}

function RecordsTable({
  title, rows, columns, onEdit, onDelete,
}: {
  title: string; rows: RecordRow[]; columns: string[];
  onEdit: (row: RecordRow) => void; onDelete: (row: RecordRow) => void;
}) {
  const labels: Record<string, string> = { title: "العمل", name: "الاسم", fullName: "الطالب", student: "الطالب", category: "القسم", description: "الوصف", status: "الحالة", grade: "الصف", artworks: "الأعمال", classes: "الفصول" };
  return (
    <section className="admin-panel records-panel"><div className="panel-title"><h2>{title}</h2><span className="row-count">{rows.length}</span></div>
      {rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{labels[column] || column}</th>)}<th>إجراءات</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column}>{renderValue(row, column)}</td>)}<td><span className="table-actions"><button onClick={() => onEdit(row)} aria-label="تعديل">تعديل</button><button className="delete-action" onClick={() => onDelete(row)} aria-label="حذف"><Trash2 size={15} /></button></span></td></tr>)}</tbody></table></div> : <p className="admin-empty">لا توجد سجلات بعد. أضف أول سجل من النموذج.</p>}
    </section>
  );
}

function renderValue(row: RecordRow, column: string) {
  if (column === "status") return <span className={`status-chip ${row.status === "PUBLISHED" ? "published" : "draft"}`}>{row.status === "PUBLISHED" ? "منشور" : row.status === "ARCHIVED" ? "مؤرشف" : "مسودة"}</span>;
  if (column === "published") return <span className={`status-chip ${row.published ? "published" : "draft"}`}>{row.published ? "منشور" : "مسودة"}</span>;
  if (column === "startsAt") return row.startsAt ? new Date(String(row.startsAt)).toLocaleDateString("ar-SA") : "—";
  if (column === "student") {
    const student = row.student as Record<string, unknown> | undefined;
    return String(student?.fullName ?? "—");
  }
  if (column === "category") {
    const category = row.category as Record<string, unknown> | undefined;
    return String(category?.name ?? "—");
  }
  if (column === "grade") {
    const grade = row.grade as Record<string, unknown> | undefined;
    const schoolClass = row.schoolClass as Record<string, unknown> | undefined;
    return String(grade?.name ?? schoolClass?.gradeName ?? "—");
  }
  if (column === "classes") {
    const classes = Array.isArray(row.classes) ? row.classes : [];
    return String(classes.length);
  }
  if (column === "artworks") {
    const count = row._count as Record<string, unknown> | undefined;
    return String(count?.artworks ?? 0);
  }
  const value = row[column];
  return value == null || value === "" ? "—" : String(value).slice(0, 55);
}

function SettingsForm({ settings, setSettings, onSubmit, busy, onError }: {
  settings: Record<string, string>; setSettings: (settings: Record<string, string>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; onError: (message: string) => void;
}) {
  const fields: Array<[string, string, string?]> = [
    ["platformName", "اسم المنصة"], ["subtitle", "العنوان الفرعي"], ["slogan", "الشعار الرئيسي"],
    ["secondarySlogan", "الشعار الثانوي"], ["description", "وصف المعرض"],
    ["teacherName", "اسم معلم التربية الفنية"], ["teacherTitle", "المسمى الوظيفي"],
    ["teacherPhotoUrl", "رابط صورة المعلم", "url"], ["academicSupervisor", "المشرف الأكاديمي"],
    ["principal", "مدير المدرسة"], ["schoolLogoUrl", "رابط شعار المدرسة", "url"],
    ["organizationLogoUrl", "رابط شعار الشركة", "url"],
  ];
  async function uploadSetting(name: string, file?: File) {
    if (!file) return;
    try {
      const data = new FormData(); data.append("file", file);
      const uploaded = await adminRequest<UploadResult>("/admin/media/upload", { method: "POST", body: data });
      const publicIdName = name.replace("Url", "PublicId");
      setSettings({ ...settings, [name]: uploaded.url, [publicIdName]: uploaded.publicId });
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : "تعذر رفع الصورة.");
    }
  }
  return (
    <form className="admin-panel settings-form" onSubmit={onSubmit}>
      <div className="panel-title"><h2>محتوى الموقع العام</h2><p>تظهر التغييرات مباشرةً على الصفحة الرئيسية.</p></div>
      <div className="form-grid">{fields.map(([name, label, type]) => <label key={name}>{label}<input type={type || "text"} value={settings[name] || ""} onChange={(event) => setSettings({ ...settings, [name]: event.target.value, ...(event.target.value ? {} : { [name.replace("Url", "PublicId")]: "" }) })} />{name.endsWith("Url") && <input className="settings-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label={`رفع ${label}`} onChange={(event) => void uploadSetting(name, event.target.files?.[0])} />}</label>)}</div>
      <button className="admin-submit" type="submit" disabled={busy}><Save size={16} />{busy ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button>
    </form>
  );
}
