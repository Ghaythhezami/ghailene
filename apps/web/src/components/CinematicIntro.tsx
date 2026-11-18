"use client";

import Image from "next/image";
import { GraduationCap, School, SkipForward } from "lucide-react";
import { useEffect, useRef } from "react";
import "./CinematicIntro.css";

const schoolLogo = "/assets/logos/ibtekaria-official.png";
const companyLogo = "/assets/logos/al-motaqadimah-official.png";
const teacherPhoto = "/assets/team/art-teacher.png";

function Ribbons() {
  return <svg className="cinematic-ribbons" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="intro-green-ribbon"><stop stopColor="#0d7880" /><stop offset=".48" stopColor="#a5e54b" /><stop offset="1" stopColor="#166d55" /></linearGradient>
      <linearGradient id="intro-cyan-ribbon"><stop stopColor="#064353" /><stop offset=".55" stopColor="#25c7df" /><stop offset="1" stopColor="#00677a" /></linearGradient>
    </defs>
    <path d="M-65 115C-20 15 75-33 198-50 86-5 25 40-12 151Z" fill="url(#intro-green-ribbon)" />
    <path d="M-40 133C8 44 82 8 207-29 110 18 42 46-10 160Z" fill="url(#intro-cyan-ribbon)" />
    <path d="M-22 158C38 53 99 42 191 6" fill="none" stroke="#92f5ed" strokeOpacity=".7" strokeWidth="1.5" />
    <path d="M425 720C350 723 330 773 230 844H435Z" fill="url(#intro-green-ribbon)" />
    <path d="M-25 842C39 778 78 780 151 844Z" fill="url(#intro-cyan-ribbon)" />
    <path d="M-10 818C40 790 65 795 105 818M295 838C330 795 355 776 405 777" fill="none" stroke="#7eeaf0" strokeWidth="2" />
  </svg>;
}

function SchoolScene() {
  return <svg className="cinematic-school-scene" viewBox="0 0 390 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="intro-building" x2="0" y2="1"><stop stopColor="#c5e8e7" /><stop offset="1" stopColor="#478c9c" /></linearGradient>
      <linearGradient id="intro-ground" x2="0" y2="1"><stop stopColor="#6bafb4" /><stop offset="1" stopColor="#063c4c" /></linearGradient>
      <pattern id="intro-windows" width="27" height="28" patternUnits="userSpaceOnUse"><path d="M4 5h17v16H4z" fill="#287789" stroke="#d4eeee" strokeWidth="2" /><path d="M12.5 5v16" stroke="#a9d2d3" /></pattern>
    </defs>
    <path d="M0 130V39l79-16 58 8 57-18 92 16 104-17v118Z" fill="url(#intro-building)" />
    <path d="M0 45l79-16v83H0zm87-14 50 6v75H87zm58 4 50-16v93h-50zm59-16 76 14v79h-76zm84 16 102-17v94H288z" fill="url(#intro-windows)" />
    <path d="M154 130V82h76v48" fill="#195e70" stroke="#afd8d8" strokeWidth="4" /><path d="M192 83v47M154 103h76" stroke="#afd8d8" strokeWidth="2" />
    <path d="M0 111c80-10 138 3 202-2 86-7 125-4 188 3v18H0Z" fill="url(#intro-ground)" />
    {[16, 344, 375].map((x) => <g key={x} transform={`translate(${x} 60)`} fill="#174f51" stroke="#174f51" strokeWidth="2">
      <path d="M0 50Q3 23 0 0" fill="none" strokeWidth="4" />
      <path d="M0 2q-15-17-23-8 12-2 23 11M0 2q15-18 24-10Q11-7 0 5M0 1q-5-21-13-24Q-7-10 0 3M0 1q8-20 17-22Q7-9 0 3" />
    </g>)}
  </svg>;
}

export function CinematicIntro({ onFinish }: { onFinish: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const timer = window.setTimeout(onFinish, 8000);
    return () => {
      window.clearTimeout(timer);
      if (dialog?.open) dialog.close();
    };
  }, [onFinish]);

  return <dialog ref={dialogRef} className="cinematic-intro-dialog" aria-labelledby="cinematic-intro-title" onCancel={(event) => { event.preventDefault(); onFinish(); }}>
    <div className="cinematic-intro-screen" dir="rtl">
      <Ribbons />
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
        <SchoolScene />
        <div className="cinematic-official-logos">
          <Image src={companyLogo} alt="شعار شركة المدارس المتقدمة" width={590} height={340} priority />
          <span aria-hidden="true" />
          <Image src={schoolLogo} alt="شعار مدارس الابتكارية الأهلية" width={420} height={390} priority />
        </div>
      </footer>
    </div>
  </dialog>;
}
