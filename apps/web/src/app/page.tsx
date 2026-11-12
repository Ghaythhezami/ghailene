"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpLeft, BookOpen, ChevronLeft, ChevronRight,
  CirclePlay, Eye, Filter, Grid2X2, Image as ImageIcon,
  Palette, Search, Sparkles, Star, UserRound, X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PublicArtwork, PublicCategory, PublicFilterOptions, PublicGalleryEvent, PublicSettings,
} from "@basmat-fan/shared";
import { fetchPublicContent } from "@/lib/api";
import { InstallAppButton } from "@/components/install-app-button";
import { GalleryStory } from "@/components/gallery-story";

const GalleryRoom = dynamic(() => import("@/components/gallery-room"), { ssr: false });

const categoryVisuals = [
  { slug: "onsite", name: "إبداعات حضورية", asset: "onsite.webp", tint: "coral", note: "ألوان من مدرستنا" },
  { slug: "remote", name: "إبداعات عن بُعد", asset: "remote.webp", tint: "turquoise", note: "مساحات من الخيال" },
  { slug: "projects", name: "مشاريع فنية", asset: "projects.webp", tint: "blue", note: "أفكار كبرت معنا" },
  { slug: "founding-day", name: "يوم التأسيس", asset: "founding-day.webp", tint: "founding", note: "حكاية وطن" },
  { slug: "national-day", name: "يوم الوطن", asset: "national-day.webp", tint: "emerald", note: "رايتنا خضراء" },
  { slug: "models", name: "عالم المجسمات", asset: "models.webp", tint: "violet", note: "أفكار ثلاثية الأبعاد" },
  { slug: "moments", name: "لحظات فنية", asset: "moments.webp", tint: "sky", note: "من يوميات المرسم" },
  { slug: "featured", name: "نجوم بصمة فن", asset: "featured.webp", tint: "amber", note: "إبداع يستحق الضوء" },
  { slug: "exhibitions", name: "معارضنا الفنية", asset: "exhibitions.webp", tint: "fuchsia", note: "لقاءاتنا ومعارضنا" },
  { slug: "__all__", name: "كل المشاريع", asset: "all-projects.webp", tint: "royal", note: "كل حكاياتنا الفنية" },
];
type CategoryCard = PublicCategory & { asset: string; tint: string; note: string };

const defaultSettings: PublicSettings = {
  platformName: "بصمة فن",
  subtitle: "الابتكارية ٢",
  slogan: "كل طالب فنان.. وكل إبداع له بصمة.",
  description: "معرض الإبداع الفني الرقمي",
  teacherName: "غيلان الخزامي",
  teacherTitle: "أستاذ التربية الفنية",
  teacherPhotoUrl: "/assets/team/art-teacher.png",
  academicSupervisor: "الأستاذ رفيق عباس",
  principal: "الأستاذ محمد العتيبي",
  schoolLogoUrl: "/assets/logos/school-logo.png",
  organizationLogoUrl: "/assets/logos/company-logo.png",
};

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const [settings, setSettings] = useState(defaultSettings);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [artworks, setArtworks] = useState<PublicArtwork[]>([]);
  const [filterOptions, setFilterOptions] = useState<PublicFilterOptions>({ grades: [], classes: [], projects: [] });
  const [events, setEvents] = useState<PublicGalleryEvent[]>([]);
  const [selected, setSelected] = useState<PublicArtwork | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [storyOpen, setStoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState<"gallery" | "projects" | "about">("gallery");
  const toolsDialogRef = useRef<HTMLDialogElement>(null);
  const profileDialogRef = useRef<HTMLDialogElement>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, total: 0, pages: 0 });
  const galleryRequest = useRef(0);
  const selectedRef = useRef<PublicArtwork | null>(null);
  selectedRef.current = selected;

  const loadGallery = useCallback(async (query: URLSearchParams = new URLSearchParams(), selectPage?: { side: "first" | "last"; currentId: string }) => {
    const requestId = ++galleryRequest.current;
    setLoading(true);
    setApiError("");
    try {
      const content = await fetchPublicContent(query);
      if (requestId !== galleryRequest.current) return;
      setSettings(content.settings ?? defaultSettings);
      setCategories(content.categories);
      setArtworks(content.artworks);
      setFilterOptions(content.filters ?? { grades: [], classes: [], projects: [] });
      setEvents(content.events ?? []);
      setPagination(content.pagination);
      if (selectPage && selectedRef.current?.id === selectPage.currentId && content.artworks.length) {
        setSelected(selectPage.side === "first" ? content.artworks[0] : content.artworks[content.artworks.length - 1]);
      }
    } catch (error) {
      if (requestId !== galleryRequest.current) return;
      setApiError(error instanceof Error ? error.message : "تعذر الاتصال بالمعرض");
      if (!selectPage) {
        setArtworks([]);
        setPagination({ page: Number(query.get("page")) || 1, pageSize: 12, total: 0, pages: 0 });
      }
    } finally {
      if (requestId === galleryRequest.current) setLoading(false);
    }
  }, []);
  function moveArtwork(offset: number) {
    if (!selected || loading || !artworks.length) return;
    const index = artworks.findIndex((artwork) => artwork.id === selected.id);
    if (index < 0) return;
    const next = index + offset;
    if (next >= 0 && next < artworks.length) {
      setSelected(artworks[next]);
    } else if (pagination.pages > 1) {
      const page = offset > 0 ? (pagination.page < pagination.pages ? pagination.page + 1 : 1) : (pagination.page > 1 ? pagination.page - 1 : pagination.pages);
      void loadGallery(galleryParams(page), { side: offset > 0 ? "first" : "last", currentId: selected.id });
    } else {
      setSelected(artworks[(next + artworks.length) % artworks.length]);
    }
  }

  useEffect(() => { void loadGallery(); }, [loadGallery]);
  useEffect(() => {
    const dialog = toolsDialogRef.current;
    if (toolsOpen && dialog && !dialog.open) dialog.showModal();
    else if (!toolsOpen && dialog?.open) dialog.close();
  }, [toolsOpen]);
  useEffect(() => {
    const dialog = profileDialogRef.current;
    if (profileOpen && dialog && !dialog.open) dialog.showModal();
    else if (!profileOpen && dialog?.open) dialog.close();
  }, [profileOpen]);
  useEffect(() => {
    if (!selected) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") moveArtwork(1);
      if (event.key === "ArrowRight") moveArtwork(-1);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [selected, moveArtwork]);

  const categoryCards = useMemo<CategoryCard[]>(() => {
    const fixedCategories = categoryVisuals.map((visual, index): CategoryCard => {
      const category = categories.find((item) => item.slug === visual.slug);
      return {
        ...visual,
        ...category,
        id: category?.id ?? `category-${index}`,
        description: category?.description ?? null,
        coverUrl: category?.coverUrl ?? null,
        sortOrder: category?.sortOrder ?? index,
      };
    });
    const customCategories = categories
      .filter((category) => !categoryVisuals.some((visual) => visual.slug === category.slug))
      .map((category, index): CategoryCard => ({
        ...categoryVisuals[index % (categoryVisuals.length - 1)],
        ...category,
        tint: categoryVisuals[index % (categoryVisuals.length - 1)].tint,
      }));
    return [...fixedCategories.slice(0, -1), ...customCategories, fixedCategories[fixedCategories.length - 1]];
  }, [categories]);

  function galleryParams(
    page = 1,
    category = selectedCategory,
    queryText = search.trim(),
    grade = gradeFilter,
    schoolClass = classFilter,
    project = projectFilter,
    year = yearFilter,
  ) {
    const params = new URLSearchParams();
    if (queryText) params.set("q", queryText);
    if (category) params.set("category", category);
    if (grade) params.set("grade", grade);
    if (schoolClass) params.set("class", schoolClass);
    if (project) params.set("project", project);
    if (year) params.set("year", year);
    params.set("page", String(page));
    return params;
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToolsOpen(false);
    setActiveView("gallery");
    setStoryOpen(true);
    void loadGallery(galleryParams());
  }

  function focusCategories() {
    document.querySelector<HTMLButtonElement>(".museum-category-tile")?.focus({ preventScroll: true });
  }

  function openHome() {
    setActiveView("gallery");
    setSelectedCategory("");
    setStoryOpen(false);
    setSearch("");
    setGradeFilter("");
    setClassFilter("");
    setProjectFilter("");
    setYearFilter("");
    setFiltersOpen(false);
    setToolsOpen(false);
    void loadGallery(new URLSearchParams());
  }

  function chooseCategory(slug: string) {
    const next = slug === "__all__" ? "" : slug;
    setSelectedCategory(next);
    setActiveView("gallery");
    setStoryOpen(true);
    void loadGallery(galleryParams(1, next));
  }

  function applyGalleryFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveView("gallery");
    setStoryOpen(true);
    setFiltersOpen(false);
    void loadGallery(galleryParams());
  }

  function clearGalleryFilters() {
    setGradeFilter("");
    setClassFilter("");
    setProjectFilter("");
    setYearFilter("");
    setFiltersOpen(false);
    void loadGallery(galleryParams(1, selectedCategory, search.trim(), "", "", "", ""));
  }

  return (
    <main className="museum-app" id="top">
      <dialog ref={toolsDialogRef} className="museum-tools-dialog" onCancel={(event) => { event.preventDefault(); setToolsOpen(false); }} onClose={() => setToolsOpen(false)} aria-labelledby="museum-tools-title">
        <div className="museum-tools-heading"><strong id="museum-tools-title">أدوات المعرض</strong><button onClick={() => setToolsOpen(false)} aria-label="إغلاق"><X size={20} /></button></div>
        <nav className="museum-tools-nav" aria-label="التنقل الرئيسي">
          <button className={activeView === "gallery" && !selectedCategory ? "is-active" : ""} onClick={openHome}>الرئيسية</button>
          <button className={activeView === "gallery" && Boolean(selectedCategory) ? "is-active" : ""} onClick={() => { setActiveView("gallery"); setToolsOpen(false); focusCategories(); }}>الأقسام</button>
          <button className={activeView === "projects" ? "is-active" : ""} onClick={() => { setActiveView("projects"); setToolsOpen(false); }}>المشاريع</button>
          <button className={activeView === "about" ? "is-active" : ""} onClick={() => { setActiveView("about"); setToolsOpen(false); }}>عن المنصة</button>
        </nav>
        <div className="museum-tools-actions">
          <form className="museum-tools-search" onSubmit={submitSearch}>
            <input maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} aria-label="ابحث عن عمل فني" placeholder="ابحث في المعرض..." />
            <button type="submit" aria-label="تنفيذ البحث"><Search size={18} /></button>
          </form>
          <button onClick={() => { setActiveView("gallery"); setFiltersOpen(true); setToolsOpen(false); }}><Filter size={16} /> تصفية الأعمال</button>
          <a href="/admin"><Grid2X2 size={16} /> لوحة التحكم</a>
          <InstallAppButton />
        </div>
      </dialog>
      <dialog ref={profileDialogRef} className="museum-profile-dialog" onCancel={(event) => { event.preventDefault(); setProfileOpen(false); }} onClose={() => setProfileOpen(false)} aria-labelledby="profile-dialog-title">
        <button className="museum-profile-close" onClick={() => setProfileOpen(false)} aria-label="إغلاق"><X size={20} /></button>
        <TeacherProfile settings={settings} full />
      </dialog>

      <section className={`museum-stage ${activeView !== "gallery" ? "museum-stage-panel-open" : ""} ${storyOpen && activeView === "gallery" ? "museum-stage-story" : ""}`} aria-label="معرض بصمة فن التفاعلي">
        <div className="museum-scene" aria-label="قاعة معرض فنية ثلاثية الأبعاد"><GalleryRoom artworks={artworks} onSelect={setSelected} /></div>
        <div className="museum-scene-shade" aria-hidden="true" />
        <AnimatePresence>
          {filtersOpen && activeView === "gallery" && <motion.form className="museum-filter-panel" onSubmit={applyGalleryFilters} initial={{ opacity: 0, y: -7, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} aria-label="تصفية الأعمال الفنية">
            <div className="museum-filter-title"><span>اكتشف أعمالًا جديدة</span><button type="button" onClick={() => setFiltersOpen(false)} aria-label="إغلاق"><X size={15} /></button></div>
            <label>الصف<select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value); setClassFilter(""); }}><option value="">كل الصفوف</option>{filterOptions.grades.map((grade) => <option value={grade.id} key={grade.id}>{grade.name}</option>)}</select></label>
            <label>الفصل<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="">كل الفصول</option>{filterOptions.classes.filter((item) => !gradeFilter || item.gradeId === gradeFilter).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <label>المشروع<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">كل المشاريع</option>{filterOptions.projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
            <label>السنة<select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="">كل السنوات</option>{Array.from({ length: 7 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
            <div className="museum-filter-actions"><button type="button" onClick={clearGalleryFilters}>مسح</button><button type="submit">عرض الأعمال</button></div>
          </motion.form>}
        </AnimatePresence>
        {!(storyOpen && activeView === "gallery") && <TeacherProfile settings={settings} onExpand={() => setProfileOpen(true)} />}
        <button className="museum-open-tools" onClick={() => setToolsOpen(true)}><Grid2X2 size={16} /> أدوات المعرض</button>

        {storyOpen && activeView === "gallery" && <GalleryStory
          key={`${selectedCategory}-${pagination.page}`}
          artworks={artworks}
          category={categoryCards.find((category) => category.slug === selectedCategory)?.name ?? "كل المشاريع"}
          loading={loading}
          error={apiError}
          pagination={pagination}
          initialArtworkId={selected?.id}
          paused={Boolean(selected) || toolsOpen || filtersOpen || profileOpen}
          onPage={(page) => void loadGallery(galleryParams(page))}
          onSelect={setSelected}
          onClose={() => setStoryOpen(false)}
        />}
        <AnimatePresence mode="wait" initial={false}>
          {!(storyOpen && activeView === "gallery") && <motion.div key={`${activeView}-${selectedCategory}`} className="museum-center" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.32 }}>
            {activeView === "gallery" && <>
              <span className="museum-eyebrow"><i /> {settings.description}</span>
              <h1>{settings.platformName}</h1>
              <p className="museum-subtitle">{settings.subtitle}</p>
              <span className="museum-gold-rule" />
              <p className="museum-description">{settings.slogan}</p>
              {selectedCategory && <div className="museum-active-category"><span />{categoryCards.find((category) => category.slug === selectedCategory)?.name ?? "أعمال المعرض"}<small>{loading ? "جارٍ العرض" : `${artworks.length} عمل`}</small></div>}
              <div className="museum-hero-actions">
                <button className="museum-primary-button" onClick={focusCategories}>استكشف المعرض <ImageIcon size={16} /></button>
                <button className="museum-secondary-button" onClick={() => artworks[0] && setSelected(artworks[0])} disabled={!artworks.length}><CirclePlay size={17} /> مشاهدة الإبداعات</button>
              </div>
              <div className="museum-gallery-status">
              <p className="museum-count"><span /> {loading ? "نفتح أبواب المعرض" : apiError ? "بانتظار الاتصال بالمعرض" : `${pagination.total} عملًا فنيًا في هذا العرض`}</p>
              {pagination.pages > 1 && <nav className="museum-page-nav" aria-label="صفحات المعرض">
                <button disabled={pagination.page <= 1} onClick={() => void loadGallery(galleryParams(pagination.page - 1))} aria-label="الأعمال السابقة"><ChevronRight size={13} /></button>
                <span>{pagination.page} / {pagination.pages}</span>
                <button disabled={pagination.page >= pagination.pages} onClick={() => void loadGallery(galleryParams(pagination.page + 1))} aria-label="الأعمال التالية"><ChevronLeft size={13} /></button>
              </nav>}
              </div>
            </>}
            {activeView === "projects" && <div className="museum-panel-content">
              <span className="museum-eyebrow"><i /> حكايات صنعتها أيدينا</span>
              <h2>مشاريع ومعارض</h2>
              <p className="museum-panel-lead">مساحات تجمع الفن، والفكرة، وأجمل لحظات الإبداع.</p>
              {events.length > 0 ? <div className="museum-event-list">{events.slice(0, 3).map((event) => <article className="museum-event" key={event.id}>
                {event.coverUrl && <Image src={event.coverUrl} alt="" fill sizes="(max-width: 700px) 85vw, 260px" />}
                <span className="museum-event-copy"><small>{event.startsAt ? new Date(event.startsAt).toLocaleDateString("ar-SA") : "من معارضنا"}</small><strong>{event.title}</strong>{event.description && <em>{event.description}</em>}</span>
              </article>)}</div> : <p className="museum-panel-empty">تظهر هنا المعارض والمشاريع المنشورة من لوحة الإدارة.</p>}
            </div>}
            {activeView === "about" && <div className="museum-panel-content museum-about-content">
              <span className="museum-eyebrow"><i /> مدرسة الابتكارية الثانية</span>
              <h2>فنٌ يترك أثرًا</h2>
              <p className="museum-panel-lead">{settings.secondarySlogan || "من أنامل صغيرة تنطلق إبداعات كبيرة؛ هنا نرسم أحلامنا ونترك بصمتنا."}</p>
              <div className="museum-about-mark"><Palette size={24} /><span>{settings.platformName}<small>{settings.description}</small></span></div>
            </div>}
          </motion.div>}
        </AnimatePresence>

        {artworks.length > 0 && activeView === "gallery" && !storyOpen && <aside className="museum-featured" aria-label="أعمال من المعرض">
          <div className="museum-featured-heading"><span>من مرسمنا إلى العالم</span><small>{loading ? "•••" : `${pagination.total} أعمال`}</small></div>
          {artworks.slice(0, 2).map((artwork, index) => <motion.button className="museum-art-preview" key={artwork.id} onClick={() => setSelected(artwork)} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
            <span className="museum-preview-image">
              {artwork.images[0] ? <Image src={artwork.images[0].url} alt={artwork.images[0].alt || artwork.title} fill sizes="(max-width: 900px) 90px, 180px" /> : <Palette size={24} />}
              <i><Eye size={13} /></i>
            </span>
            <span className="museum-preview-copy"><strong>{artwork.title}</strong><small>{artwork.studentDisplayName}</small></span>
          </motion.button>)}
          <span className="museum-gallery-hint"><Sparkles size={12} /> اختر لوحة لاكتشاف حكايتها</span>
        </aside>}
        {apiError && <p className="museum-api-notice" role="status">{apiError}</p>}
      </section>

      <section className="museum-category-dock" aria-label="أقسام المعرض">
        <div className="museum-dock-heading">
          <span>عوالم من الإبداع</span>
          <strong>اختر قاعةً لتبدأ الحكاية</strong>
          <small>{categoryCards.length} أقسام فنية</small>
        </div>
        <div className="museum-category-track">
          <div className="museum-category-list" id="category-dock" tabIndex={-1}>
            {categoryCards.map((category) => {
              const active = selectedCategory === category.slug || (category.slug === "__all__" && !selectedCategory);
              return <motion.button key={category.slug} className={`museum-category-tile category-${category.tint} ${active ? "is-selected" : ""}`} onClick={() => chooseCategory(category.slug)} aria-pressed={active} aria-label={`عرض ${category.name}`} whileHover={reduceMotion ? undefined : { y: -6, scale: 1.025 }} whileTap={reduceMotion ? undefined : { scale: 0.96 }} transition={{ type: "spring", stiffness: 330, damping: 22 }}>
                <span className="museum-tile-art" aria-hidden="true">
                  <Image src={`/assets/category-scenes/${category.asset}`} alt="" fill sizes="(max-width: 900px) 50vw, 12vw" />
                </span>
                <strong>{category.name}</strong>
                <span className="museum-tile-arrow" aria-hidden="true"><ChevronLeft size={15} /></span>
              </motion.button>;
            })}
          </div>
        </div>
      </section>

      <footer className="museum-footer">
        <svg className="museum-footer-skyline" viewBox="0 0 270 42" fill="none" aria-hidden="true">
          <path d="M0 40h270M4 40V26h10v14M19 40V15h5v-6h5v6h6v25M40 40V25h13v-9h9v24M69 40V20h6v-8h4v8h7v20M91 40V27h13v-8h8v21M117 40V16h8v-9h5v9h8v24M143 40V26h12V13h5v-7h4v7h7v13h9v14M187 40V22h8v-9h5v9h9v18M214 40V27h12v-8h5v-6h5v6h9v21M252 40V25h14" stroke="url(#museum-gold)" strokeWidth="1.4" />
          <path d="M18 15h18M122 16h20M156 26h24M226 27h19M73 20h13M40 25h22M190 22h22" stroke="#f4d18e" strokeWidth="1" />
          <defs><linearGradient id="museum-gold" x1="0" y1="0" x2="270" y2="0"><stop stopColor="#a96934" /><stop offset=".48" stopColor="#ffe2a0" /><stop offset="1" stopColor="#9b592d" /></linearGradient></defs>
        </svg>
        <span className="museum-footer-message">من أناملٍ صغيرة تنطلق إبداعاتٌ كبيرة.. هنا نرسم أحلامنا ونترك بصمتنا</span>
        <span className="museum-footer-brand">
          <Image src={settings.schoolLogoUrl || defaultSettings.schoolLogoUrl!} alt="" width={19} height={19} />
          <span><strong>بصمة فن</strong><small>مدارس الابتكارية الأهلية · © {new Date().getFullYear()}</small></span>
        </span>
      </footer>
      <AnimatePresence>
        {selected && <ArtworkDialog artwork={selected} onClose={() => setSelected(null)} onPrevious={() => moveArtwork(-1)} onNext={() => moveArtwork(1)}
        loading={loading} error={apiError}
        related={artworks.filter((item) => item.category.id === selected.category.id && item.id !== selected.id).slice(0, 3)}
        onSelectRelated={setSelected} />}
      </AnimatePresence>
    </main>
  );
}

function TeacherProfile({ settings, full = false, onExpand }: { settings: PublicSettings; full?: boolean; onExpand?: () => void }) {
  return (
    <aside className={`profile-composition ${full ? "profile-composition-full" : ""}`} aria-label="الملف المهني للأستاذ غيلان الخزامي">
      <div className="profile-logos" aria-label="شعارات المدارس">
        <Image src="/assets/logos/ibtekaria-official.png" alt="شعار مدارس الابتكارية الأهلية" width={500} height={500} priority={!full} />
        <span aria-hidden="true" />
        <Image src="/assets/logos/al-motaqadimah-official.png" alt="شعار شركة المدارس المتقدمة" width={590} height={340} priority={!full} />
      </div>
      <div className="profile-main">
        <div className="profile-portrait">
          <Image src={settings.teacherPhotoUrl || defaultSettings.teacherPhotoUrl!} alt={`صورة ${settings.teacherName}`} fill sizes="(max-width: 900px) 220px, 30vw" priority={!full} />
        </div>
        <div className="profile-copy">
          <span className="profile-kicker">بصمة فن · الابتكارية ٢</span>
          <h2 id={full ? "profile-dialog-title" : undefined}>{settings.teacherName}</h2>
          <p className="profile-role">{settings.teacherTitle}.</p>
          <div className="profile-details">
            <p>متحصل على الماجستير الوطني في الفنون البصرية.</p>
            <p>خبرة في تدريس الفنون وتنمية المهارات الإبداعية.</p>
            <p>الاهتمام بالرسم والتصميم والتشكيل والمجسمات.</p>
            <div className="profile-vision"><strong><Sparkles size={16} /> الرؤية التربوية:</strong><p>اكتشاف مواهب الطلاب وتنمية خيالهم وتحويل أفكارهم إلى أعمال فنية مميزة.</p></div>
          </div>
          <div className="profile-management">
            <p><UserRound size={17} /><span><strong>المشرف الأكاديمي:</strong>{settings.academicSupervisor}</span></p>
            <p><BookOpen size={17} /><span><strong>مدير المدرسة:</strong>{settings.principal}</span></p>
          </div>
          {!full && <button className="profile-expand" onClick={onExpand}>عرض الملف المهني <ChevronLeft size={16} /></button>}
        </div>
      </div>
    </aside>
  );
}

function ArtworkCard({ artwork, index, onClick }: { artwork: PublicArtwork; index: number; onClick: () => void }) {
  const image = artwork.images[0];
  return (
    <motion.button className={`artwork-card artwork-card-${index % 4}`} onClick={onClick} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: index * 0.05, duration: 0.45 }}>
      <span className="artwork-image">
        {image ? <Image src={image.url} alt={image.alt || artwork.title} fill sizes="(max-width: 700px) 80vw, 25vw" /> : <span className="artwork-placeholder"><Palette size={42} /></span>}
        {artwork.featured && <span className="featured-label"><Star size={13} fill="currentColor" /> عمل مميز</span>}
        <span className="artwork-view"><Eye size={19} /></span>
      </span>
      <span className="artwork-info"><span><small>{artwork.category.name}</small><strong>{artwork.title}</strong></span><i><ArrowUpLeft size={17} /></i></span>
      <span className="artwork-student">{artwork.studentDisplayName}{artwork.gradeName ? ` · ${artwork.gradeName}` : ""}</span>
    </motion.button>
  );
}

function ArtworkDialog({
  artwork, onClose, onPrevious, onNext, related, onSelectRelated, loading, error,
}: {
  artwork: PublicArtwork;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  related: PublicArtwork[];
  onSelectRelated: (artwork: PublicArtwork) => void;
  loading: boolean;
  error: string;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const image = artwork.images[imageIndex];
  useEffect(() => {
    setImageIndex(0);
    setZoomed(false);
  }, [artwork.id]);
  return (
    <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.article className="artwork-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="إغلاق"><X size={19} /></button>
        <div className={`dialog-image ${zoomed ? "zoomed" : ""}`}>
          {image ? <AnimatePresence mode="wait" initial={false}><motion.button key={`${artwork.id}-${imageIndex}`} className="dialog-image-zoom" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? "تصغير الصورة" : "تكبير الصورة"} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: .3 }}><Image src={image.url} alt={image.alt || artwork.title} fill sizes="(max-width: 900px) 90vw, 50vw" /></motion.button></AnimatePresence> : artwork.videoUrl ? <video src={artwork.videoUrl} controls playsInline aria-label={`فيديو العمل الفني: ${artwork.title}`} /> : <div className="artwork-placeholder"><Palette size={52} /></div>}
          {artwork.images.length > 1 && <div className="dialog-thumbnails">{artwork.images.map((item, index) => <button key={item.url} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`عرض الصورة ${index + 1}`}><Image src={item.url} alt="" fill sizes="55px" /></button>)}</div>}
        </div>
        <div className="dialog-copy"><span className="section-kicker">{artwork.category.name}</span><h2 id="dialog-title">{artwork.title}</h2><p>{artwork.description || "عمل فني من إبداع طلابنا."}</p><dl><div><dt>الفنان</dt><dd>{artwork.studentDisplayName}</dd></div>{artwork.gradeName && <div><dt>الصف</dt><dd>{artwork.gradeName}</dd></div>}{artwork.projectName && <div><dt>المشروع</dt><dd>{artwork.projectName}</dd></div>}{artwork.materials.length > 0 && <div><dt>الخامات</dt><dd>{artwork.materials.join("، ")}</dd></div>}</dl></div>
        {image && artwork.videoUrl && <video className="dialog-video" src={artwork.videoUrl} controls playsInline aria-label={`فيديو العمل الفني: ${artwork.title}`} />}
        <nav className="artwork-dialog-nav" aria-label="التنقل بين الأعمال"><button disabled={loading} onClick={onPrevious}><ChevronRight size={17} /> العمل السابق</button>{loading ? <span role="status">جارٍ تحميل الأعمال...</span> : error ? <span role="alert">تعذر تحميل الأعمال. حاول مجددًا.</span> : null}<button disabled={loading} onClick={onNext}>العمل التالي <ChevronLeft size={17} /></button></nav>
        {related.length > 0 && <aside className="related-artworks"><h3>أعمال أخرى في هذا القسم</h3>{related.map((item) => <button key={item.id} onClick={() => onSelectRelated(item)}>{item.title}<ArrowUpLeft size={14} /></button>)}</aside>}
      </motion.article>
    </motion.div>
  );
}
