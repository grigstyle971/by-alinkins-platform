"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isInstalledApp() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileDevice() {
  return isAppleMobile() || /Android/i.test(navigator.userAgent);
}

export default function PwaInstallHint() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [appleMobile, setAppleMobile] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const closeHint = () => {
    setOpen(false);
  };

  useEffect(() => {
    const updateVisibility = () => {
      if (!isMobileDevice() || isInstalledApp()) {
        setOpen(false);
        setVisible(false);
        return;
      }
      setVisible(true);
    };
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    setAppleMobile(isAppleMobile());
    updateVisibility();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    media.addEventListener("change", updateVisibility);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      media.removeEventListener("change", updateVisibility);
    };
  }, []);

  const installOnAndroid = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") closeHint();
  };

  if (!visible) return null;

  return <>
    <div className="pwa-install-row">
      <button type="button" className="pwa-install-link" onClick={() => setOpen(true)}>Install app</button>
    </div>
    {open && <div className="pwa-install-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeHint(); }}>
      <section className="pwa-install-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <div className="pwa-install-handle" />
        <div className="pwa-install-heading"><img src="/apple-icon?v=2" alt="by.alinkins" /><h2 id="pwa-install-title">Install by.alinkins App</h2></div>
        {appleMobile ? <p>In Safari, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p> : <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>}
        <div className="pwa-install-actions">
          {!appleMobile && installPrompt && <button type="button" className="pwa-install-confirm" onClick={installOnAndroid}>Install</button>}
          <button type="button" className={appleMobile || !installPrompt ? "pwa-install-confirm" : "pwa-install-later"} onClick={closeHint}>Got it</button>
          {!appleMobile && installPrompt && <button type="button" className="pwa-install-later" onClick={closeHint}>Maybe later</button>}
        </div>
      </section>
    </div>}
  </>;
}
