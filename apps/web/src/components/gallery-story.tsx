"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Palette, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicArtwork } from "@basmat-fan/shared";

type Pagination = { page: number; pages: number; total: number };

export function GalleryStory({ artworks, category, loading, error, pagination, initialArtworkId, paused, onPage, onSelect, onClose }: {
  artworks: PublicArtwork[];
  category: string;
  loading: boolean;
  error: string;
  pagination: Pagination;
  initialArtworkId?: string;
  paused: boolean;
  onPage: (page: number) => void;
  onSelect: (artwork: PublicArtwork) => void;
  onClose: () => void;
}) {
  const [artIndex, setArtIndex] = useState(() => Math.max(0, artworks.findIndex((artwork) => artwork.id === initialArtworkId)));
  const [imageIndex, setImageIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reducedMotion = useReducedMotion();
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;
  const artwork = artworks[artIndex];
  const image = artwork?.images[imageIndex];
  const duration = artwork && artwork.images.length > 1 ? 3000 : 4000;
  const isPaused = paused || userPaused || hidden || loading || Boolean(reducedMotion);

  useEffect(() => {
    function updateVisibility() { setHidden(document.hidden); }
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const next = useCallback(() => {
    if (!artwork || loading) return;
    if (imageIndex + 1 < artwork.images.length) setImageIndex(imageIndex + 1);
    else if (artIndex + 1 < artworks.length) { setArtIndex(artIndex + 1); setImageIndex(0); }
    else if (pagination.pages > 1) onPageRef.current(pagination.page < pagination.pages ? pagination.page + 1 : 1);
    else { setArtIndex(0); setImageIndex(0); }
  }, [artwork, artworks.length, artIndex, imageIndex, loading, pagination.page, pagination.pages]);

  function previous() {
    if (!artwork || loading) return;
    if (imageIndex > 0) setImageIndex(imageIndex - 1);
    else if (artIndex > 0) { setArtIndex(artIndex - 1); setImageIndex(Math.max(0, artworks[artIndex - 1].images.length - 1)); }
    else if (pagination.page > 1) onPageRef.current(pagination.page - 1);
  }

  useEffect(() => {
    if (!artwork || isPaused || error) return;
    const timer = window.setTimeout(next, duration);
    return () => window.clearTimeout(timer);
  }, [artwork, duration, error, imageIndex, isPaused, next]);

  return <motion.section className="gallery-story" aria-label={`عرض ${category}`} aria-busy={loading}
    initial={reducedMotion ? false : { opacity: 0, y: 28, scale: .97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>
    <div className="story-heading"><div><small>قاعات بصمة فن</small><h2>{category}</h2></div><button onClick={onClose} aria-label="العودة للملف المهني"><X size={19} /></button></div>
    {loading ? <div className="story-message" role="status">جارٍ تحميل الأعمال الفنية...</div> : error ? <div className="story-message" role="alert">تعذر تحميل الأعمال. تحقق من اتصال المعرض وحاول مرة أخرى.<button onClick={() => onPageRef.current(pagination.page)}>إعادة المحاولة</button></div> : !artwork ? <div className="story-message">لا توجد أعمال منشورة في هذا القسم بعد.</div> :
      <div className="story-body">
        <div className="story-frame">
          <AnimatePresence initial={false}>
            <motion.div key={`${artwork.id}-${imageIndex}`} className="story-image" initial={reducedMotion ? false : { opacity: 0, x: 35, scale: 1.025 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, x: -35, scale: .98 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>
              {image ? <Image src={image.url} alt={image.alt || artwork.title} fill sizes="(max-width: 900px) 90vw, 55vw" /> : <div className="story-placeholder"><Palette size={36} /><span>{artwork.videoUrl ? "عمل مرئي" : "عمل فني"}</span></div>}
            </motion.div>
          </AnimatePresence>
          {artwork.images.length > 1 && <div className="story-progress" aria-label="صور العمل">{artwork.images.map((item, index) => <button key={`${item.url}-${index}`} onClick={() => setImageIndex(index)} aria-label={`عرض الصورة ${index + 1}`} aria-current={index === imageIndex ? "true" : undefined}><span key={`${index}-${imageIndex}-${isPaused}`} className={index < imageIndex ? "complete" : index === imageIndex && !isPaused ? "current" : ""} style={index === imageIndex && !isPaused ? { animationDuration: `${duration}ms` } : undefined} /></button>)}</div>}
          <button className="story-arrow story-prev" onClick={previous} disabled={artIndex === 0 && imageIndex === 0 && pagination.page <= 1} aria-label="السابق"><ChevronRight size={20} /></button>
          <button className="story-arrow story-next" onClick={next} aria-label="التالي"><ChevronLeft size={20} /></button>
        </div>
        <div className="story-copy"><div><small>{artwork.studentDisplayName}{artwork.gradeName ? ` · ${artwork.gradeName}` : ""}</small><h3>{artwork.title}</h3></div><div className="story-actions"><button onClick={() => onSelect(artwork)}><Eye size={16} /> عرض العمل</button><button onClick={() => setUserPaused(!userPaused)} aria-label={userPaused ? "تشغيل العرض" : "إيقاف العرض مؤقتًا"} disabled={Boolean(reducedMotion)}>{userPaused || reducedMotion ? <Play size={16} /> : <Pause size={16} />}</button></div></div>
      </div>}
    {pagination.pages > 1 && <nav className="story-pagination" aria-label="صفحات المعرض"><button disabled={loading || pagination.page <= 1} onClick={() => onPageRef.current(pagination.page - 1)}>الصفحة السابقة</button><span>{pagination.page} / {pagination.pages}</span><button disabled={loading || pagination.page >= pagination.pages} onClick={() => onPageRef.current(pagination.page + 1)}>الصفحة التالية</button></nav>}
  </motion.section>;
}
