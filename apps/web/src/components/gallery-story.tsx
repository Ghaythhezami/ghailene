"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Palette, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicArtwork } from "@basmat-fan/shared";

type Pagination = { page: number; pages: number; total: number };

export function GalleryStory({ artworks, category, loading, error, pagination, initialArtworkId, paused, onPage, onCategoryEnd, onSelect, onClose }: {
  artworks: PublicArtwork[];
  category: string;
  loading: boolean;
  error: string;
  pagination: Pagination;
  initialArtworkId?: string;
  paused: boolean;
  onPage: (page: number) => void;
  onCategoryEnd: (empty: boolean) => void;
  onSelect: (artwork: PublicArtwork) => void;
  onClose: () => void;
}) {
  const [artIndex, setArtIndex] = useState(() => Math.max(0, artworks.findIndex((artwork) => artwork.id === initialArtworkId)));
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const onPageRef = useRef(onPage);
  const onCategoryEndRef = useRef(onCategoryEnd);
  const pendingPageSide = useRef<"first" | "last" | null>(null);
  const suppressClickUntil = useRef(0);
  onPageRef.current = onPage;
  onCategoryEndRef.current = onCategoryEnd;
  const artwork = artworks[artIndex];
  const image = artwork?.images[0];
  const isPaused = paused || userPaused || hidden || loading || Boolean(reducedMotion);
  const prevArtwork = artworks.length > 1 ? artworks[(artIndex - 1 + artworks.length) % artworks.length] : null;
  const nextArtwork = artworks.length > 1 ? artworks[(artIndex + 1) % artworks.length] : null;

  useEffect(() => {
    if (pendingPageSide.current) {
      setArtIndex(pendingPageSide.current === "last" ? Math.max(0, artworks.length - 1) : 0);
      pendingPageSide.current = null;
    } else {
      setArtIndex(0);
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
    if (artIndex + 1 < artworks.length) setArtIndex(artIndex + 1);
    else if (pagination.page < pagination.pages) {
      pendingPageSide.current = "first";
      onPageRef.current(pagination.page + 1);
    }
    else onCategoryEndRef.current(false);
  }, [artwork, artworks.length, artIndex, loading, pagination.page, pagination.pages]);

  function previous() {
    if (!artwork || loading) return;
    if (artIndex > 0) setArtIndex(artIndex - 1);
    else if (pagination.page > 1) {
      pendingPageSide.current = "last";
      onPageRef.current(pagination.page - 1);
    }
    else setArtIndex(artworks.length - 1);
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
          {prevArtwork?.images[0] && <button className="story-neighbor story-neighbor-prev" onClick={previous} aria-label="العمل السابق"><Image src={prevArtwork.images[0].url} alt="" fill sizes="22vw" /></button>}
          {nextArtwork?.images[0] && <button className="story-neighbor story-neighbor-next" onClick={next} aria-label="العمل التالي"><Image src={nextArtwork.images[0].url} alt="" fill sizes="22vw" /></button>}
          <AnimatePresence initial={false}>
            <motion.button type="button" onClick={() => { if (Date.now() >= suppressClickUntil.current) onSelect(artwork); }} aria-label={`عرض ${artwork.title}`} key={artwork.id} className="story-image story-main-image" initial={reducedMotion ? false : { opacity: 0, x: -55, scale: .94 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, x: 55, scale: .94 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>
              {image ? <Image src={image.url} alt={image.alt || artwork.title} fill sizes="(max-width: 900px) 82vw, 55vw" /> : <div className="story-placeholder"><Palette size={36} /><span>{artwork.videoUrl ? "عمل مرئي" : "عمل فني"}</span></div>}
            </motion.button>
          </AnimatePresence>
          <button className="story-arrow story-prev" onClick={previous} disabled={artIndex === 0 && pagination.page <= 1} aria-label="السابق"><ChevronRight size={20} /></button>
          <button className="story-arrow story-next" onClick={next} aria-label="التالي"><ChevronLeft size={20} /></button>
        </div>
        <div className="story-copy">
          <Image className="story-avatar" src="/assets/decorations/visitor-avatar.webp" alt="" width={160} height={191} />
          <div><small>{artwork.studentDisplayName}{artwork.gradeName ? ` · ${artwork.gradeName}` : ""}</small><h3>{artwork.title}</h3>{artwork.description && <p>{artwork.description}</p>}</div>
        </div>
        <div className="story-actions"><button onClick={() => onSelect(artwork)} aria-label="عرض العمل"><Eye size={16} /></button><button onClick={() => setUserPaused(!userPaused)} aria-label={userPaused ? "تشغيل العرض" : "إيقاف العرض مؤقتًا"} disabled={Boolean(reducedMotion)}>{userPaused || reducedMotion ? <Play size={16} /> : <Pause size={16} />}</button></div>
        <div className="story-carousel-status">
          <strong>{String((pagination.page - 1) * 12 + artIndex + 1).padStart(2, "0")} / {String(pagination.total || artworks.length).padStart(2, "0")}</strong>
          <div className="story-progress-bars" aria-label="تقدم العرض">{artworks.slice(0, 12).map((item, index) => <button key={item.id} onClick={() => setArtIndex(index)} aria-label={`عرض العمل ${index + 1}`} aria-current={index === artIndex ? "true" : undefined} className={index === artIndex ? "is-active" : ""} />)}</div>
        </div>
      </div>}
    {pagination.pages > 1 && <nav className="story-pagination" aria-label="صفحات المعرض"><button disabled={loading || pagination.page <= 1} onClick={() => onPageRef.current(pagination.page - 1)}>الصفحة السابقة</button><span>{pagination.page} / {pagination.pages}</span><button disabled={loading || pagination.page >= pagination.pages} onClick={() => onPageRef.current(pagination.page + 1)}>الصفحة التالية</button></nav>}
  </motion.section>;
}
