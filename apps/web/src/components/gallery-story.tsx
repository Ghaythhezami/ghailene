"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Palette, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicArtwork } from "@basmat-fan/shared";

type Pagination = { page: number; pages: number; total: number };

export function GalleryStory({ artworks, category, loading, error, pagination, prefetchedArtwork, previousCategoryArtwork, initialArtworkId, paused, onPage, onCategoryEnd, onPreviousCategory, onSelect, onClose }: {
  artworks: PublicArtwork[];
  category: string;
  loading: boolean;
  error: string;
  pagination: Pagination;
  prefetchedArtwork: PublicArtwork | null;
  previousCategoryArtwork: PublicArtwork | null;
  initialArtworkId?: string;
  paused: boolean;
  onPage: (page: number) => void;
  onCategoryEnd: (empty: boolean) => void;
  onPreviousCategory: () => void;
  onSelect: (artwork: PublicArtwork) => void;
  onClose: () => void;
}) {
  const [artIndex, setArtIndex] = useState(() => Math.max(0, artworks.findIndex((artwork) => artwork.id === initialArtworkId)));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hidden, setHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const onPageRef = useRef(onPage);
  const onCategoryEndRef = useRef(onCategoryEnd);
  const pendingPageSide = useRef<"first" | "last" | null>(null);
  const previousPageArtwork = useRef<PublicArtwork | null>(null);
  const requestedInitialArtwork = useRef(initialArtworkId);
  const suppressClickUntil = useRef(0);
  const restoreFrameFocus = useRef(false);
  onPageRef.current = onPage;
  onCategoryEndRef.current = onCategoryEnd;
  const artwork = artworks[artIndex];
  const image = artwork?.images[0];
  const isPaused = paused || hidden || loading || Boolean(reducedMotion);
  const prevArtwork = artworks[artIndex - 1] ?? (pagination.page > 1 ? previousPageArtwork.current : previousCategoryArtwork);
  const nextArtwork = artworks[artIndex + 1] ?? prefetchedArtwork;
  const focusFrame = useCallback((element: HTMLButtonElement | null) => {
    if (element && restoreFrameFocus.current) {
      restoreFrameFocus.current = false;
      element.focus();
    }
  }, []);

  useEffect(() => {
    if (pendingPageSide.current) {
      setArtIndex(pendingPageSide.current === "last" ? Math.max(0, artworks.length - 1) : 0);
      pendingPageSide.current = null;
    } else {
      const index = artworks.findIndex((item) => item.id === requestedInitialArtwork.current);
      setArtIndex(Math.max(0, index));
      if (index >= 0) requestedInitialArtwork.current = undefined;
    }
  }, [artworks]);

  useEffect(() => {
    function updateVisibility() { setHidden(document.hidden); }
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const next = useCallback(() => {
    if (!artwork || loading) return;
    setDirection(1);
    if (artIndex + 1 < artworks.length) setArtIndex(artIndex + 1);
    else if (pagination.page < pagination.pages) {
      previousPageArtwork.current = artwork;
      pendingPageSide.current = "first";
      onPageRef.current(pagination.page + 1);
    }
    else onCategoryEndRef.current(false);
  }, [artwork, artworks.length, artIndex, loading, pagination.page, pagination.pages]);

  function previous() {
    if (!artwork || loading) return;
    setDirection(-1);
    if (artIndex > 0) setArtIndex(artIndex - 1);
    else if (pagination.page > 1) {
      pendingPageSide.current = "last";
      onPageRef.current(pagination.page - 1);
    }
    else if (previousCategoryArtwork) onPreviousCategory();
  }

  useEffect(() => {
    if (!artwork || isPaused || error) return;
    const timer = window.setTimeout(next, 5000);
    return () => window.clearTimeout(timer);
  }, [artwork, error, isPaused, artIndex, next]);

  useEffect(() => {
    if (artwork || isPaused || error) return;
    const timer = window.setTimeout(() => onCategoryEndRef.current(true), 600);
    return () => window.clearTimeout(timer);
  }, [artwork, error, isPaused]);

  return <motion.section className="gallery-story" aria-label={`عرض ${category}`} aria-busy={loading}
    initial={reducedMotion ? false : { opacity: 0, y: 28, scale: .97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>
    {nextArtwork?.images[0] && <span className="gallery-image-preload" aria-hidden="true"><Image src={nextArtwork.images[0].url} alt="" fill sizes="(max-width: 900px) 82vw, 55vw" loading="eager" fetchPriority="low" /></span>}
    {prefetchedArtwork?.images[0] && prefetchedArtwork.images[0].url !== nextArtwork?.images[0]?.url && <span className="gallery-image-preload" aria-hidden="true"><Image src={prefetchedArtwork.images[0].url} alt="" fill sizes="(max-width: 900px) 82vw, 55vw" loading="eager" fetchPriority="low" /></span>}
    <div className="story-heading"><div><small>قاعات بصمة فن</small><h2>{category}</h2></div><button onClick={onClose} aria-label="العودة للملف المهني"><X size={19} /></button></div>
    {loading ? <div className="story-message" role="status">جارٍ تحميل الأعمال الفنية...</div> : error ? <div className="story-message" role="alert">تعذر تحميل الأعمال. تحقق من اتصال المعرض وحاول مرة أخرى.<button onClick={() => onPageRef.current(pagination.page)}>إعادة المحاولة</button></div> : !artwork ? <div className="story-message"><Palette size={36} />قريباً... إبداعات جديدة بانتظاركم</div> :
      <div className="story-body">
        <div
          className="story-frame story-carousel"
          onTouchStart={(event) => setTouchStart(event.changedTouches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const distance = event.changedTouches[0].clientX - touchStart;
            if (Math.abs(distance) > 45) {
              suppressClickUntil.current = Date.now() + 500;
              distance > 0 ? previous() : next();
            }
            setTouchStart(null);
          }}
        >
          <button type="button" className="story-neighbor story-neighbor-prev" onClick={() => { if (Date.now() >= suppressClickUntil.current) previous(); }} disabled={!prevArtwork && pagination.page <= 1} aria-label="العمل السابق">{prevArtwork?.images[0] ? <Image src={prevArtwork.images[0].url} alt="" fill sizes="(max-width: 900px) 65vw, 40vw" /> : <Palette size={28} aria-hidden="true" />}</button>
          <button type="button" className="story-neighbor story-neighbor-next" onClick={() => { if (Date.now() >= suppressClickUntil.current) next(); }} aria-label="العمل التالي">{nextArtwork?.images[0] ? <Image src={nextArtwork.images[0].url} alt="" fill sizes="(max-width: 900px) 65vw, 40vw" /> : <Palette size={28} aria-hidden="true" />}</button>
          <AnimatePresence initial={false} custom={direction}>
            <motion.button ref={focusFrame} type="button" onClick={() => { if (Date.now() >= suppressClickUntil.current) onSelect(artwork); }} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); if (event.key === "ArrowLeft" || artIndex > 0 || pagination.page > 1) restoreFrameFocus.current = true; event.key === "ArrowLeft" ? next() : previous(); } }} aria-label={`عرض ${artwork.title}`} aria-describedby="gallery-navigation-help" key={artwork.id} className="story-image story-main-image" custom={direction}
              variants={{ enter: (side: number) => reducedMotion ? { opacity: 1 } : { opacity: .55, x: side * -65, scale: .78, rotate: side * -7 }, center: { opacity: 1, x: 0, scale: 1, rotate: 0 }, exit: (side: number) => reducedMotion ? { opacity: 0 } : { opacity: .5, x: side * 65, scale: .78, rotate: side * 7 } }}
              initial="enter" animate="center" exit="exit" transition={{ duration: reducedMotion ? 0 : .55, ease: [0.22, 1, 0.36, 1] }}>
              {image ? <Image src={image.url} alt={image.alt || artwork.title} fill sizes="(max-width: 900px) 82vw, 55vw" loading="eager" fetchPriority="high" /> : <div className="story-placeholder"><Palette size={36} /><span>{artwork.videoUrl ? "عمل مرئي" : "عمل فني"}</span></div>}
            </motion.button>
          </AnimatePresence>
        </div>
        <span id="gallery-navigation-help" className="sr-only">استخدم مفاتيح الأسهم أو اسحب للتنقل بين الأعمال.</span>
        <div className="story-copy">
          <Image className="story-avatar" src="/assets/decorations/visitor-avatar.webp" alt="" width={160} height={191} />
          <div><small>{artwork.studentDisplayName}{artwork.gradeName ? ` · ${artwork.gradeName}` : ""}</small><h3>{artwork.title}</h3>{artwork.description && <p>{artwork.description}</p>}</div>
        </div>
        <div className="story-carousel-status">
          <strong>{String((pagination.page - 1) * 12 + artIndex + 1).padStart(2, "0")} / {String(pagination.total || artworks.length).padStart(2, "0")}</strong>
          <div className="story-progress-bars" aria-label="تقدم العرض">{artworks.slice(0, 12).map((item, index) => <button key={item.id} onClick={() => { setDirection(index >= artIndex ? 1 : -1); setArtIndex(index); }} aria-label={`عرض العمل ${index + 1}`} aria-current={index === artIndex ? "true" : undefined} className={index === artIndex ? "is-active" : ""} />)}</div>
        </div>
      </div>}
  </motion.section>;
}
