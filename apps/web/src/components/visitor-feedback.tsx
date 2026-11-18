"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { apiBase } from "@/lib/api-base";

type Feedback = { id: string; name: string; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}/public/${path}`, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function VisitorFeedback() {
  const counted = useRef(false);
  const [count, setCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void request<{ count: number }>("visits", { method: "POST" })
      .then((result) => setCount(result.count))
      .catch(() => setError("تعذر تحميل عدد الزوار."));
    void request<Feedback[]>("feedback")
      .then(setFeedback)
      .catch(() => setError("تعذر تحميل آراء الزوار."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setStatus("");
    try {
      await request("feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      setName(""); setMessage("");
      setStatus("شكراً لمشاركتك! سيظهر رأيك بعد المراجعة.");
    } catch {
      setError("تعذر إرسال رأيك. حاول مرة أخرى.");
    } finally { setBusy(false); }
  }

  return <section className="visitor-panel" aria-label="آراء الزوار">
    <div className="visitor-count">✦ عدد الزيارات: <strong>{count === null ? "—" : count.toLocaleString("ar-SA")}</strong></div>
    <form onSubmit={submit} className="visitor-form">
      <label className="sr-only" htmlFor="visitor-name">الاسم</label>
      <input id="visitor-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="الاسم" maxLength={60} required />
      <label className="sr-only" htmlFor="visitor-message">رأيك في المعرض</label>
      <input id="visitor-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="رأيك في المعرض" maxLength={500} required />
      <button disabled={busy || !name.trim() || !message.trim()}>{busy ? "..." : "إرسال"}</button>
    </form>
    {status && <p className="visitor-status" role="status">{status}</p>}
    {error && <p className="visitor-status" role="alert">{error}</p>}
    {feedback.length > 0 && <div className="visitor-recent"><strong>آراء الزوار:</strong> {feedback.map((item) => <span key={item.id}><b>{item.name}:</b> {item.message}</span>)}</div>}
  </section>;
}
