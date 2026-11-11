"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setPrompt(null);
      setMessage("");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setMessage("لتثبيت التطبيق، افتح قائمة المتصفح واختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».");
      return;
    }
    try {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } catch (error) {
      console.error("App installation failed:", error);
      setMessage("تعذر بدء التثبيت. حاول من قائمة المتصفح.");
    }
  }

  if (installed) return null;
  return <div className="museum-install">
    <button type="button" onClick={() => void install()}><Download size={16} /> تثبيت التطبيق</button>
    {message && <p role="status">{message}</p>}
  </div>;
}
