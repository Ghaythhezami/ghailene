"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, UsersRound, X } from "lucide-react";
import { z } from "zod";
import { apiBase } from "@/lib/api-base";

const feedbackSchema = z.object({ id: z.string(), name: z.string(), message: z.string() });
const feedbackPageSchema = z.object({
  items: z.array(feedbackSchema),
  pagination: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), pages: z.number() }),
});
type Feedback = z.infer<typeof feedbackSchema>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}/public/${path}`, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function VisitorFeedback() {
  const counted = useRef(false);
  const feedbackRequest = useRef(0);
  const restoreFeedbackFocus = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, pages: 0 });
  const [index, setIndex] = useState(0);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [countError, setCountError] = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedbackFocused, setFeedbackFocused] = useState(false);
  const [feedbackHovered, setFeedbackHovered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const loadFeedback = useCallback(async (page: number, side: "first" | "last" = "first") => {
    const requestId = ++feedbackRequest.current;
    setLoadingFeedback(true);
    try {
      const result = feedbackPageSchema.parse(await request<unknown>(`feedback?page=${page}`));
      if (requestId !== feedbackRequest.current) return;
      setFeedback(result.items);
      setPagination(result.pagination);
      setIndex(side === "last" ? Math.max(0, result.items.length - 1) : 0);
      setFeedbackError(false);
    } catch {
      if (requestId === feedbackRequest.current) { restoreFeedbackFocus.current = false; setFeedbackError(true); }
    } finally {
      if (requestId === feedbackRequest.current) setLoadingFeedback(false);
    }
  }, []);

  const focusFeedbackEntry = useCallback((element: HTMLButtonElement | null) => {
    if (element && restoreFeedbackFocus.current) {
      restoreFeedbackFocus.current = false;
      element.focus();
    }
  }, []);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void request<{ count: number }>("visits", { method: "POST" })
      .then((result) => setCount(result.count))
      .catch(() => setCountError(true));
    void loadFeedback(1);
  }, [loadFeedback]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialogOpen && dialog && !dialog.open) dialog.showModal();
    else if (!dialogOpen && dialog?.open) dialog.close();
  }, [dialogOpen]);
  useEffect(() => {
    const dialog = detailRef.current;
    if (detailOpen && dialog && !dialog.open) dialog.showModal();
    else if (!detailOpen && dialog?.open) dialog.close();
  }, [detailOpen]);

  const moveFeedback = useCallback((direction: -1 | 1) => {
    const next = index + direction;
    if (next >= 0 && next < feedback.length) setIndex(next);
    else if (pagination.pages <= 1) setIndex(direction > 0 ? 0 : feedback.length - 1);
    else if (direction > 0) void loadFeedback(pagination.page < pagination.pages ? pagination.page + 1 : 1);
    else void loadFeedback(pagination.page > 1 ? pagination.page - 1 : pagination.pages, "last");
  }, [feedback.length, index, loadFeedback, pagination.page, pagination.pages]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (reduceMotion || !pageVisible || feedbackFocused || feedbackHovered || dialogOpen || detailOpen || loadingFeedback || feedbackError || pagination.total < 2) return;
    const timer = window.setTimeout(() => moveFeedback(1), 2500);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, pageVisible, feedbackFocused, feedbackHovered, dialogOpen, detailOpen, loadingFeedback, feedbackError, pagination.total, moveFeedback]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setStatus("");
    try {
      const created = feedbackSchema.parse(await request<unknown>("feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      }));
      ++feedbackRequest.current;
      setLoadingFeedback(false);
      setFeedback((previous) => pagination.page === 1 ? [created, ...previous].slice(0, 10) : [created]);
      setPagination((previous) => ({ page: 1, pageSize: 10, total: previous.total + 1, pages: Math.ceil((previous.total + 1) / 10) }));
      setIndex(0);
      setName(""); setMessage("");
      setDialogOpen(false);
      setStatus("شكراً لمشاركتك!");
      void loadFeedback(1);
    } catch {
      setError("تعذر تأكيد إرسال رأيك. تحقق من الآراء وحاول مرة أخرى عند الحاجة.");
    } finally { setBusy(false); }
  }

  return <div className="visitor-panel">
    <section className="visitor-counter-card" aria-label="زوار معرضنا">
      <Image className="visitor-children" src="/assets/decorations/father-son-painting.webp" alt="" width={850} height={716} />
      <div className="visitor-count">
        <h2><UsersRound aria-hidden="true" size={23} /> زوار معرضنا</h2>
        <strong dir="ltr">{count === null ? "—" : count.toLocaleString("en-US")}</strong>
        {countError && <p className="visitor-load-error" role="status">تعذر تحميل عدد الزوار.</p>}
      </div>
    </section>
    <section className="feedback-card" aria-labelledby="feedback-title">
      <div className="feedback-heading">
        <h2 id="feedback-title">شاركنا رأيك!</h2>
        <p>رأيك يسعدنا ويجعل معرضنا أجمل.</p>
      </div>
      <div className="feedback-content">
        <button className="feedback-open" type="button" onClick={() => { setError(""); setDialogOpen(true); }}><Send size={17} aria-hidden="true" /> إرسال رأيي</button>
        <div className="visitor-recent" onPointerEnter={(event) => { if (event.pointerType === "mouse") setFeedbackHovered(true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setFeedbackHovered(false); }} onFocusCapture={() => setFeedbackFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFeedbackFocused(false); }}>
          <h3>آخر آراء الزوار</h3>
          {feedbackError && <p role="status">تعذر تحميل آراء الزوار. <button onClick={() => void loadFeedback(pagination.page)}>إعادة المحاولة</button></p>}
          {!feedbackError && feedback.length === 0 && loadingFeedback && <p role="status">جارٍ تحميل الآراء...</p>}
          <AnimatePresence mode="wait" initial={false}>
            {feedback[index] && <motion.button ref={focusFeedbackEntry} type="button" className="feedback-entry" onClick={() => setDetailOpen(true)} onKeyDown={(event) => { if (pagination.total > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); restoreFeedbackFocus.current = true; moveFeedback(event.key === "ArrowLeft" ? 1 : -1); } }} aria-label={`قراءة رأي ${feedback[index].name}`} aria-describedby="feedback-keyboard-help" key={feedback[index].id} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -18 }} transition={{ duration: .22 }}><Image className="feedback-avatar" src="/assets/decorations/visitor-avatar.webp" alt="" width={160} height={191} /><span className="feedback-entry-copy"><strong>{feedback[index].name}</strong><span>{feedback[index].message}</span></span></motion.button>}
          </AnimatePresence>
          <span id="feedback-keyboard-help" className="sr-only">استخدم مفاتيح الأسهم للتنقل بين الآراء.</span>
          {status && <p className="sr-only" role="status">{status}</p>}
        </div>
        {reduceMotion && pagination.total > 1 && <nav className="feedback-navigation" aria-label="التنقل بين آراء الزوار">
          <button type="button" onClick={() => moveFeedback(-1)} disabled={loadingFeedback} aria-label="الرأي السابق"><ChevronRight size={17} /></button>
          <button type="button" onClick={() => moveFeedback(1)} disabled={loadingFeedback} aria-label="الرأي التالي"><ChevronLeft size={17} /></button>
        </nav>}
      </div>
      <dialog ref={dialogRef} className="feedback-dialog" aria-labelledby="feedback-dialog-title" onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => setDialogOpen(false)}>
        <button className="feedback-dialog-close" type="button" onClick={() => setDialogOpen(false)} disabled={busy} aria-label="إغلاق"><X size={20} /></button>
        <form onSubmit={submit} className="visitor-form">
          <h2 id="feedback-dialog-title">شاركنا رأيك!</h2>
          <label className="sr-only" htmlFor="visitor-name">الاسم</label>
          <input id="visitor-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="اكتب اسمك هنا..." maxLength={60} required />
          <label className="sr-only" htmlFor="visitor-message">رأيك في المعرض</label>
          <textarea id="visitor-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="ما أكثر شيء أعجبك في معرضنا؟" maxLength={500} rows={2} required />
          <button disabled={busy || !name.trim() || !message.trim()}><Send size={18} aria-hidden="true" /> {busy ? "جارٍ الإرسال..." : "إرسال رأيي"}</button>
          {error && <p className="visitor-status" role="alert">{error}</p>}
        </form>
      </dialog>
      <dialog ref={detailRef} className="feedback-dialog feedback-detail-dialog" aria-labelledby="feedback-detail-title" onClose={() => setDetailOpen(false)}>
        <button className="feedback-dialog-close" type="button" onClick={() => setDetailOpen(false)} aria-label="إغلاق"><X size={20} /></button>
        <h2 id="feedback-detail-title">{feedback[index]?.name}</h2>
        <p>{feedback[index]?.message}</p>
      </dialog>
    </section>
  </div>;
}
