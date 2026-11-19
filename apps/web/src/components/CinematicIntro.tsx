"use client";

import Image from "next/image";
import { GraduationCap, School, SkipForward } from "lucide-react";
import { useEffect, useRef } from "react";
import "./CinematicIntro.css";

const schoolLogo = "/assets/logos/ibtekaria-official.png";
const companyLogo = "/assets/logos/al-motaqadimah-official.png";
const teacherPhoto = "/assets/team/art-teacher.png";

export function CinematicIntro({ onFinish }: { onFinish: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const timer = window.setTimeout(onFinish, 10000);
    return () => {
      window.clearTimeout(timer);
      if (dialog?.open) dialog.close();
    };
  }, [onFinish]);

  return <dialog ref={dialogRef} className="cinematic-intro-dialog" aria-labelledby="cinematic-intro-title" onCancel={(event) => { event.preventDefault(); onFinish(); }}>
    <div className="cinematic-intro-screen" dir="rtl">
      <div className="cinematic-ribbons" aria-hidden="true" />
      <div className="cinematic-particles" aria-hidden="true" />
      <button className="cinematic-skip" type="button" onClick={onFinish}>تخطي العرض <SkipForward size={15} /></button>
      <div className="cinematic-art cinematic-art-brush" aria-hidden="true" />
      <div className="cinematic-art cinematic-art-palette" aria-hidden="true" />

      <header className="cinematic-brand">
        <Image src={schoolLogo} alt="شعار مدارس الابتكارية الأهلية" width={420} height={390} priority />
        <div className="cinematic-school-name"><strong>مدارس الابتكارية الأهلية</strong><span>حي إشبيلية</span></div>
      </header>

      <p className="cinematic-welcome" aria-label="أهلاً وسهلاً بكم"><span>أهلاً</span> <span>وسهلاً</span> <span>بكم</span></p>

      <div className="cinematic-title-wrap">
        <svg className="cinematic-gold-trails" viewBox="0 0 380 155" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10 28C100 66 242-8 369 32M9 123C110 162 275 85 372 122" />
          <path d="M16 34C104 58 248 0 362 37M20 130C127 150 263 94 360 128" />
        </svg>
        <h1 id="cinematic-intro-title"><span className="cinematic-title-blue">بصمة</span> <span className="cinematic-title-green">الابتكارية</span> <span className="cinematic-number">2</span></h1>
      </div>

      <section className="cinematic-teacher" aria-label="مع الأستاذ غيلان الخزامي">
        <div className="cinematic-teacher-copy"><span>مع الأستاذ</span><strong>غيلان الخزامي</strong></div>
        <div className="cinematic-portrait"><Image src={teacherPhoto} alt="الأستاذ غيلان الخزامي" fill sizes="(max-width: 600px) 48vw, 220px" priority /></div>
      </section>

      <section className="cinematic-leadership" aria-label="إدارة المدرسة">
        <div className="cinematic-leader cinematic-leader-supervisor"><GraduationCap aria-hidden="true" /><span>المشرف الأكاديمي</span><strong>الأستاذ محمد عيّاس</strong></div>
        <div className="cinematic-leader cinematic-leader-principal"><School aria-hidden="true" /><span>مدير المدرسة</span><strong>الأستاذ محمد العتيبي</strong></div>
      </section>

      <footer className="cinematic-footer">
        <div className="cinematic-school-scene" aria-hidden="true" />
        <div className="cinematic-official-logos">
          <Image src={companyLogo} alt="شعار شركة المدارس المتقدمة" width={590} height={340} priority />
          <span aria-hidden="true" />
          <Image src={schoolLogo} alt="شعار مدارس الابتكارية الأهلية" width={420} height={390} priority />
        </div>
      </footer>
    </div>
  </dialog>;
}
