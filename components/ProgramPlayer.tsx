"use client";

import Link from "next/link";
import Hls from "hls.js";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const finishFront = { src: "/images/finish-result-front.JPEG" };
const finishSide = { src: "/images/finish-result-side.JPG" };
import type { CSSProperties, ReactNode } from "react";

export type PlayerBlock = {
  id?: string;
  kind: "text" | "heading" | "callout" | "checklist" | "quote" | "label" | "image" | "centered_image" | "photo_examples" | "week_banner" | "video" | "pdf" | "separator";
  content: string;
  image_srcset?: string | null;
  thumbnail_url?: string | null;
  file_name?: string | null;
  position: number;
};

export type PlayerLesson = {
  id?: string;
  title: string;
  kind: "text" | "video" | "finish";
  duration?: string | null;
  section: string;
  intro?: boolean;
  content?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  image_srcset?: string | null;
  pdf_url?: string | null;
  blocks?: PlayerBlock[];
};

type VimeoApiPlayer = {
  ready: () => Promise<void>;
  getDuration: () => Promise<number>;
  getPaused: () => Promise<boolean>;
  on: (event: string, callback: (data: { seconds: number; duration: number }) => void) => void;
  off: (event: string, callback: (data: { seconds: number; duration: number }) => void) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
};

type VimeoPlayerConstructor = new (element: HTMLIFrameElement) => VimeoApiPlayer;

type MuxWebPlayer = HTMLElement & { play?: () => Promise<void> };

const defaultLessons: PlayerLesson[] = [
  { section: "The Basics", title: "Program Introduction", kind: "text", intro: true },
  { section: "The Basics", title: "Part 1. Workouts", kind: "text" },
  { section: "The Basics", title: "Part 2. Training Load & Working Weights", kind: "text" },
  { section: "The Basics", title: "Part 3. Nutrition", kind: "text" },
  { section: "The Basics", title: "Part 4. Body Measurements", kind: "text" },
  { section: "The Basics", title: "Part 5. Before & After Transformations", kind: "text" },
  { section: "Equipment", title: "Home Workout Equipment", kind: "text" },
  { section: "Warm-Up & Cool-Down", title: "Warm-Up", kind: "video", duration: "2:57" },
  { section: "Warm-Up & Cool-Down", title: "Cool-Down", kind: "video", duration: "1:58" },
  { section: "Strength Training", title: "Working Weights", kind: "video", duration: "1:24" },
  ...Array.from({ length: 9 }, (_, index) => ({ section: "Strength Training", title: `Week ${index + 1}`, kind: "video" as const, duration: "Coming soon" })),
  { section: "Cardio", title: "Cardio Training", kind: "text" },
  { section: "Cardio", title: "Cardio Guidelines", kind: "text" },
  { section: "Nutrition", title: "Calorie Tracking", kind: "text" },
  { section: "Nutrition", title: "Cheat Meals and Cheat Days", kind: "text" },
  { section: "Nutrition", title: "Simple vs. Complex Carbohydrates", kind: "text" },
  { section: "Nutrition", title: "Carbohydrates in Fat Loss", kind: "text" },
  { section: "Nutrition", title: "Healthy Snacks", kind: "text" },
  { section: "Nutrition", title: "Personal Macro Targets", kind: "text" },
];

function VideoIcon() {
  return <svg className="player-video-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="3" width="22" height="18" rx="2" fill="#111"/><path d="m10 8 6 4-6 4Z" fill="#fff"/></svg>;
}

function TextIcon() {
  return <svg className="player-text-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>;
}

function FinishIcon() {
  return <svg className="player-finish-icon" viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M32 0C49.7 0 64 14.3 64 32V48l69-17.2c38.1-9.5 78.3-5.1 113.5 12.5c46.3 23.2 100.8 23.2 147.1 0l9.6-4.8C423.8 28.1 448 43.1 448 66.1V345.8c0 13.3-8.3 25.3-20.8 30l-34.7 13c-46.2 17.3-97.6 14.6-141.7-7.4c-37.9-19-81.3-23.7-122.5-13.4L64 384v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V400 334 64 32C0 14.3 14.3 0 32 0zM64 187.1l64-13.9v65.5L64 252.6V318l48.8-12.2c5.1-1.3 10.1-2.4 15.2-3.3V238.7l38.9-8.4c8.3-1.8 16.7-2.5 25.1-2.1l0-64c13.6 .4 27.2 2.6 40.4 6.4l23.6 6.9v66.7l-41.7-12.3c-7.3-2.1-14.8-3.4-22.3-3.8v71.4c21.8 1.9 43.3 6.7 64 14.4V244.2l22.7 6.7c13.5 4 27.3 6.4 41.3 7.4V194c-7.8-.8-15.6-2.3-23.2-4.5l-40.8-12v-62c-13-3.8-25.8-8.8-38.2-15c-8.2-4.1-16.9-7-25.8-8.8v72.4c-13-.4-26 .8-38.7 3.6L128 173.2V98L64 114v73.1zM320 335.7c16.8 1.5 33.9-.7 50-6.8l14-5.2V251.9l-7.9 1.8c-18.4 4.3-37.3 5.7-56.1 4.5v77.4zm64-149.4V115.4c-20.9 6.1-42.4 9.1-64 9.1V194c13.9 1.4 28 .5 41.7-2.6l22.3-5.2z"/></svg>;
}

function isFinishLesson(lesson: PlayerLesson) {
  return lesson.kind === "finish" || /^(share your results|поделись.*результат)/i.test(lesson.title.trim());
}

function CourseFinishScreen() {
  return <section className="course-finish-screen">
    <p className="course-finish-kicker">SHARE YOUR RESULTS</p>
    <h1>Share your results</h1>
    <p><strong>You did it, girl! You&apos;ve completed the program,<br />and I hope you&apos;re proud of yourself 🤍</strong></p>
    <p>I would genuinely love to see what you&apos;ve achieved. You can send me your before-and-after photos in an Instagram DM and tell me about the changes you noticed throughout the program.</p>
    <p>Your progress can also inspire another woman who is just getting started. Your photos and story will never be shared publicly without your permission 🫶🏼</p>
    <p className="course-finish-example-title">RESULT EXAMPLE</p>
    <div className="course-finish-examples" aria-label="Before and after result examples">
      <figure><img src={finishFront.src} alt="Front view before and after example"/><figcaption><span>BEFORE</span><span>AFTER</span></figcaption></figure>
      <figure><img src={finishSide.src} alt="Side view before and after example"/><figcaption><span>BEFORE</span><span>AFTER</span></figcaption></figure>
    </div>
  </section>;
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return direction === "left"
    ? <svg className="player-nav-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="m12 4-6 6 6 6" /></svg>
    : <svg className="player-nav-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6" /></svg>;
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>;
}

function youtubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1) || null;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return id || null;
    }
  } catch { /* An ordinary link will be shown as a button below. */ }
  return null;
}

function muxVideoId(value: string) {
  const trimmed = value.trim();
  const directMatch = trimmed.match(/^(?:mux:\/\/)?([A-Za-z0-9]+)$/);
  if (directMatch) return directMatch[1];
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "stream.mux.com") return parsed.pathname.replace(/^\//, "").replace(/\.m3u8$/, "") || null;
  } catch { /* A normal link will be handled below. */ }
  return null;
}

function videoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").find((part) => /^\d+$/.test(part));
      if (!id) return null;
      const embed = new URL(`https://player.vimeo.com/video/${id}`);
      const hash = parsed.searchParams.get("h");
      if (hash) embed.searchParams.set("h", hash);
      embed.searchParams.set("api", "1");
      embed.searchParams.set("badge", "0");
      embed.searchParams.set("byline", "0");
      embed.searchParams.set("controls", "0");
      embed.searchParams.set("dnt", "1");
      embed.searchParams.set("pip", "1");
      embed.searchParams.set("playsinline", "1");
      embed.searchParams.set("portrait", "0");
      embed.searchParams.set("speed", "1");
      embed.searchParams.set("title", "0");
      return embed.toString();
    }
  } catch { /* An ordinary link will be shown as a button below. */ }
  return null;
}

function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const togglePlayback = () => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: [] }), "https://www.youtube-nocookie.com");
    setPlaying((current) => !current);
  };
  return <div className="player-youtube-frame">
    <iframe ref={iframeRef} src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0`} title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" />
    <div className="player-youtube-controls">
      <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"}>{playing ? "❚❚" : "▶"}<span>{playing ? "Pause" : "Play video"}</span></button>
    </div>
  </div>;
}

function MuxPlayer({ playbackId, title, courseSlug, posterUrl }: { playbackId: string; title: string; courseSlug?: string; posterUrl?: string | null }) {
  // A workout can contain many clips. Starting every HLS pipeline at once
  // exhausts Safari's media buffers and results in `bufferAppendError`.
  const [shouldLoad, setShouldLoad] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const muxPlayerContainerRef = useRef<HTMLDivElement>(null);
  const automaticRetryCountRef = useRef(0);
  const nativeStreamUrl = source ? `https://stream.mux.com/${playbackId}.m3u8?token=${encodeURIComponent(source)}` : null;

  useEffect(() => {
    const element = muxPlayerContainerRef.current;
    if (!element || shouldLoad) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "500px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    setSource(null);
    setPoster(posterUrl ?? null);
    setSourceError(null);
    const query = new URLSearchParams({ playbackId });
    if (courseSlug) query.set("courseSlug", courseSlug);
    fetch(`/api/mux/token?${query.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as { token?: string; thumbnailToken?: string; error?: string } | null;
        if (!response.ok || !data?.token) throw new Error(data?.error || "Could not get a video token");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setSource(data.token ?? null);
        // Keep the cover selected in the admin until playback starts.
        // Use a generated Mux frame only when no custom cover was provided.
        if (!posterUrl && data.thumbnailToken) setPoster(`https://image.mux.com/${playbackId}/thumbnail.webp?token=${encodeURIComponent(data.thumbnailToken)}`);
      })
      .catch((error) => { if (!cancelled) setSourceError(error instanceof Error ? error.message : "Could not get a video token"); });
    return () => { cancelled = true; };
  }, [courseSlug, playbackId, posterUrl, retryKey, shouldLoad]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !nativeStreamUrl || video.hidden) return;
    let hls: Hls | null = null;
    let cancelled = false;
    let mediaRecoveryAttempts = 0;
    const retryStream = (message: string) => {
      if (cancelled) return;
      if (automaticRetryCountRef.current >= 2) {
        setSourceError(message);
        return;
      }
      automaticRetryCountRef.current += 1;
      setSourceError(`${message} Retrying…`);
      window.setTimeout(() => {
        if (!cancelled) setRetryKey((key) => key + 1);
      }, 750);
    };
    const showNativeError = () => {
      const code = video.error?.code;
      const detail = code === 2 ? "network error" : code === 3 ? "decoding error" : code === 4 ? "unsupported or rejected stream" : "unknown error";
      retryStream(`Native HLS playback failed (${detail}${code ? `, code ${code}` : ""}).`);
    };
    // Chrome must use hls.js. Some Chromium builds report that they can play
    // HLS natively but then do not keep the signed Mux token for all requests.
    if (Hls.isSupported()) {
      // Mux returns already-signed rendition URLs in the master playlist.
       // Rewriting those URLs invalidates the signature and causes a 403.
       hls = new Hls();
       hls.on(Hls.Events.ERROR, (_event, data) => {
         if (!data.fatal) return;
         if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveryAttempts < 1) {
           mediaRecoveryAttempts += 1;
           hls?.recoverMediaError();
           return;
         }
         const status = data.response?.code ? ` (HTTP ${data.response.code})` : "";
        const failedUrl = data.url ?? data.context?.url;
        let requestDetails = "";
        if (failedUrl) {
          const requestUrl = new URL(failedUrl);
          requestDetails = ` Request: ${requestUrl.pathname}; token=${requestUrl.searchParams.has("token") ? "yes" : "no"}.`;
        }
         retryStream(`The video stream could not be loaded: ${data.details}${status}.${requestDetails}`);
      });
      hls.loadSource(nativeStreamUrl);
      hls.attachMedia(video);
    }
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.addEventListener("error", showNativeError);
      video.src = nativeStreamUrl;
    }
    else setSourceError("This browser does not support video playback.");
    return () => {
      cancelled = true;
      video.removeEventListener("error", showNativeError);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [nativeStreamUrl]);
  const retry = () => {
    automaticRetryCountRef.current = 0;
    setShouldLoad(true);
    setSourceError(null);
    setRetryKey((key) => key + 1);
  };
  // Use native controls and defer buffering until the customer presses play.
  return <div className="player-vimeo-frame player-mux-frame" ref={muxPlayerContainerRef}>
    {!shouldLoad ? <button className="player-video-loading" type="button" onClick={() => setShouldLoad(true)}>Load video</button>
      : sourceError ? <div className="player-video-error"><p>Video configuration error: {sourceError}</p><button type="button" onClick={retry}>Try again</button></div>
      : source ? <video ref={videoRef} title={title} poster={poster ?? undefined} playsInline controls preload="none" onCanPlay={() => { automaticRetryCountRef.current = 0; }} />
      : <div className="player-video-loading">Loading video…</div>}
  </div>;
  /* Legacy custom controls kept below temporarily for reference.
  return <div className="player-vimeo-frame player-mux-frame" onPointerMove={revealControls}>
    <video ref={videoRef} title={title} playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} />
    <button className="player-vimeo-tap-area" type="button" onClick={toggleControls} aria-label={controlsVisible ? "Hide video controls" : "Show video controls"} />
    <div className={`player-vimeo-controls ${controlsVisible ? "is-visible" : "is-hidden"}`}>
      <button className="player-vimeo-play" type="button" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"}>{playing ? "❚❚" : "▶"}</button>
      <div className="player-vimeo-progress-pill"><span>{formatTime(currentTime)}</span><input className="player-vimeo-progress" style={{ "--player-progress": `${progress}%` } as CSSProperties} type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onPointerDown={() => { const video = videoRef.current; resumeAfterSeekRef.current = Boolean(video && !video.paused); video?.pause(); }} onChange={(event) => { const video = videoRef.current; if (video) video.currentTime = Number(event.target.value); }} onPointerUp={() => { const video = videoRef.current; if (resumeAfterSeekRef.current && video) { resumeAfterSeekRef.current = false; if (video.seeking) video.addEventListener("seeked", () => void video.play(), { once: true }); else void video.play(); } }} /><span>{formatTime(duration)}</span></div>
      <button className="player-vimeo-fullscreen" type="button" onClick={fullscreen} aria-label="Full screen">⛶</button>
    </div>
  </div>;
  */
}

function VimeoPlayer({ src, title }: { src: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoApiPlayer | null>(null);
  const lastObservedTimeRef = useRef(0);
  const controlsTimerRef = useRef<number | null>(null);
  const resumeAfterSeekRef = useRef(false);
  const seekRequestRef = useRef(0);
  const seekPromiseRef = useRef<Promise<number> | null>(null);
  const sendRawCommand = (method: string, value?: string | number) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), "https://player.vimeo.com");
  };
  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current) return;
    let player: VimeoApiPlayer | null = null;
    let cancelled = false;
    const updateProgress = (data: { seconds: number; duration: number }) => { if (data.seconds > lastObservedTimeRef.current + 0.05) setPlaying(true); lastObservedTimeRef.current = data.seconds; setCurrentTime(data.seconds); setDuration(data.duration); };
    const trackFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const receiveFallbackEvent = (event: MessageEvent) => {
      if (event.origin !== "https://player.vimeo.com") return;
      let message: { event?: string; method?: string; data?: { seconds?: number; duration?: number }; value?: number | boolean } | null = null;
      try { message = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (!message) return;
      if (message.event === "timeupdate") {
        setCurrentTime(message.data?.seconds ?? 0);
        setDuration(message.data?.duration ?? 0);
      }
      if (message.method === "getDuration" && typeof message.value === "number") setDuration(message.value);
      if (message.method === "getPaused" && typeof message.value === "boolean") setPlaying(!message.value);
      if (message.method === "getCurrentTime" && typeof message.value === "number") { if (message.value > lastObservedTimeRef.current + 0.05) setPlaying(true); lastObservedTimeRef.current = message.value; setCurrentTime(message.value); }
      if (message.event === "play") setPlaying(true);
      if (message.event === "pause") setPlaying(false);
    };
    const initialize = () => {
      const VimeoPlayer = (window as typeof window & { Vimeo?: { Player: VimeoPlayerConstructor } }).Vimeo?.Player;
      if (cancelled || !iframeRef.current || !VimeoPlayer) return;
      player = new VimeoPlayer(iframeRef.current);
      playerRef.current = player;
      player.ready().then(async () => {
        const [videoDuration, paused] = await Promise.all([player?.getDuration(), player?.getPaused()]);
        setDuration(videoDuration ?? 0);
        if (typeof paused === "boolean") setPlaying(!paused);
      }).catch(() => undefined);
      player.on("timeupdate", updateProgress);
      player.on("play", () => setPlaying(true));
      player.on("pause", () => setPlaying(false));
    };
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://player.vimeo.com/api/player.js"]');
    if ((window as typeof window & { Vimeo?: { Player: VimeoPlayerConstructor } }).Vimeo?.Player) initialize();
    else {
      const script = existingScript ?? document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      script.addEventListener("load", initialize, { once: true });
      if (!existingScript) document.head.append(script);
    }
    document.addEventListener("fullscreenchange", trackFullscreen);
    window.addEventListener("message", receiveFallbackEvent);
    const progressTimer = window.setInterval(() => {
      sendRawCommand("getCurrentTime");
      sendRawCommand("getDuration");
      if (playerRef.current) void playerRef.current.getPaused().then((paused) => setPlaying(!paused)).catch(() => undefined);
      else sendRawCommand("getPaused");
    }, 500);
    return () => { cancelled = true; window.clearInterval(progressTimer); document.removeEventListener("fullscreenchange", trackFullscreen); window.removeEventListener("message", receiveFallbackEvent); player?.off("timeupdate", updateProgress); };
  }, [iframeLoaded]);
  useEffect(() => {
    controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3500);
    return () => { if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current); };
  }, []);
  const revealControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3500);
  };
  const toggleControls = () => {
    if (controlsVisible) {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      setControlsVisible(false);
      return;
    }
    revealControls();
  };
  const togglePlayback = () => {
    const player = playerRef.current;
    if (player) {
      void player.getPaused().then((paused) => {
        if (paused) return player.play().then(() => setPlaying(true));
        return player.pause().then(() => setPlaying(false));
      }).catch(() => undefined);
      return;
    }
    sendRawCommand(playing ? "pause" : "play");
    setPlaying((current) => !current);
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  const progressPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return <div className="player-vimeo-frame" ref={containerRef} onPointerMove={revealControls}>
    <iframe ref={iframeRef} src={src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onLoad={() => { setIframeLoaded(true); sendRawCommand("addEventListener", "timeupdate"); sendRawCommand("getDuration"); }} />
    <button className="player-vimeo-tap-area" type="button" onClick={toggleControls} aria-label={controlsVisible ? "Hide video controls" : "Show video controls"} />
    <div className={`player-vimeo-controls ${controlsVisible ? "is-visible" : "is-hidden"}`}>
      <button className="player-vimeo-play" type="button" onClick={togglePlayback} aria-label={playing ? "Pause video" : "Play video"}>{playing ? "❚❚" : "▶"}</button>
      <div className="player-vimeo-progress-pill">
        <span>{formatTime(currentTime)}</span>
        <input className="player-vimeo-progress" style={{ "--player-progress": `${progressPercentage}%` } as CSSProperties} type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} disabled={!duration} aria-label="Video progress" onPointerDown={() => { resumeAfterSeekRef.current = playing; if (playing) { if (playerRef.current) void playerRef.current.pause().catch(() => undefined); else sendRawCommand("pause"); setPlaying(false); } }} onChange={(event) => { const next = Number(event.target.value); setCurrentTime(next); seekRequestRef.current += 1; if (playerRef.current) seekPromiseRef.current = playerRef.current.setCurrentTime(next).catch(() => next); else sendRawCommand("setCurrentTime", next); }} onPointerUp={() => { if (!resumeAfterSeekRef.current) return; resumeAfterSeekRef.current = false; const requestAtRelease = seekRequestRef.current; const resume = () => { if (requestAtRelease !== seekRequestRef.current) return; if (playerRef.current) void playerRef.current.play().then(() => setPlaying(true)).catch(() => undefined); else { sendRawCommand("play"); setPlaying(true); } }; if (seekPromiseRef.current) void seekPromiseRef.current.finally(resume); else window.setTimeout(resume, 450); }} />
        <span>{formatTime(duration)}</span>
      </div>
      {isFullscreen && <div className="player-vimeo-speed-wrap">
        <button className="player-vimeo-speed" type="button" onClick={() => { revealControls(); setSpeedMenuOpen((open) => !open); }} aria-label="Playback speed" aria-expanded={speedMenuOpen}>{playbackRate}×</button>
        {speedMenuOpen && <div className="player-vimeo-speed-menu">{[0.75, 1, 1.25, 1.5, 2].map((rate) => <button key={rate} type="button" className={rate === playbackRate ? "selected" : ""} onClick={() => { if (playerRef.current) void playerRef.current.setPlaybackRate(rate).then(() => setPlaybackRate(rate)).catch(() => undefined); else { sendRawCommand("setPlaybackRate", rate); setPlaybackRate(rate); } setSpeedMenuOpen(false); revealControls(); }}>{rate}×</button>)}</div>}
      </div>}
      <button className="player-vimeo-fullscreen" type="button" onClick={() => { const player = playerRef.current; if (player) { if (isFullscreen) void player.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => undefined); else void player.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => undefined); return; } if (document.fullscreenElement) { void document.exitFullscreen(); return; } void containerRef.current?.requestFullscreen(); }} aria-label={isFullscreen ? "Exit full screen" : "Full screen"}>⛶</button>
    </div>
  </div>;
}

function NativeVimeoPlayer({ src, title }: { src: string; title: string }) {
  return <div className="player-vimeo-frame">
    <iframe src={src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
  </div>;
}

function RichText({ children }: { children: string }) {
  return <>{children.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}><RichText>{part.slice(2, -2)}</RichText></strong>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer"><RichText>{link[1]}</RichText></a>;
    return part;
  })}</>;
}

function RichDocument({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.trim() === "---") {
      nodes.push(<hr className="player-separator" key={`line-${index}`} />);
      index += 1;
      continue;
    }
    if (line.trim() === ":::box") {
      const start = index + 1;
      index += 1;
      const boxed: string[] = [];
      while (index < lines.length && lines[index].trim() !== ":::") {
        boxed.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(<aside className="player-block-callout" key={`box-${start}`}><RichDocument content={boxed.join("\n")} /></aside>);
      continue;
    }
    if (line.trim() === ":::label") {
      const start = index + 1;
      index += 1;
      const label: string[] = [];
      while (index < lines.length && lines[index].trim() !== ":::") {
        if (lines[index].trim()) label.push(lines[index].trim());
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(<p className="player-inline-label" key={`label-${start}`}>{label.join(" ")}</p>);
      continue;
    }
    if (line.trim() === ":::cycle") {
      const start = index + 1;
      index += 1;
      const cycle: string[] = [];
      while (index < lines.length && lines[index].trim() !== ":::") {
        if (lines[index].trim()) cycle.push(lines[index].trim());
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(<p className="player-training-cycle" key={`cycle-${start}`}><RichText>{cycle.join(" ")}</RichText></p>);
      continue;
    }
    if (line.trim() === ":::title") {
      const start = index + 1;
      index += 1;
      const title: string[] = [];
      while (index < lines.length && lines[index].trim() !== ":::") {
        if (lines[index].trim()) title.push(lines[index].trim());
        index += 1;
      }
      if (index < lines.length) index += 1;
      nodes.push(<p className="player-inline-title" key={`title-${start}`}><RichText>{title.join(" ")}</RichText></p>);
      continue;
    }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      nodes.push(<p className="player-inline-heading" key={`heading-${index}`}><RichText>{heading[1]}</RichText></p>);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      nodes.push(<blockquote className="player-block-quote" key={`quote-${index}`}><RichText>{line.slice(2)}</RichText></blockquote>);
      index += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      const start = index;
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      nodes.push(<ul className="player-block-bullets" key={`list-${start}`}>{items.map((item, itemIndex) => <li key={itemIndex}><RichText>{item}</RichText></li>)}</ul>);
      continue;
    }
    // Consecutive lines are one paragraph with compact line breaks. An empty
    // line starts a new paragraph, so authors control the larger spacing by
    // leaving one blank line in the editor.
    const paragraphLines: string[] = [];
    const start = index;
    while (index < lines.length) {
      const current = lines[index];
      const trimmed = current.trim();
      if (!trimmed || trimmed === "---" || trimmed === ":::box" || trimmed === ":::label" || trimmed === ":::cycle" || trimmed === ":::title" || /^#{1,3}\s+/.test(current) || current.startsWith("> ") || /^[-*]\s+/.test(current)) break;
      paragraphLines.push(current);
      index += 1;
    }
    nodes.push(<p key={`paragraph-${start}`}>{paragraphLines.map((paragraphLine, lineIndex) => <Fragment key={lineIndex}>{lineIndex > 0 && <br />}<RichText>{paragraphLine}</RichText></Fragment>)}</p>);
  }
  return <>{nodes}</>;
}
function PdfPages({ src, title }: { src: string; title: string }) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [diagnostic, setDiagnostic] = useState("");

  useEffect(() => {
    let cancelled = false;
    const pages = pagesRef.current;
    if (!pages) return;

    const render = async () => {
      setState("loading");
      setDiagnostic("");
      pages.replaceChildren();
      const controller = new AbortController();
      const objectUrls: string[] = [];
      let stage = "loading the first page";

      try {
        const requestPage = async (pageNumber: number) => {
          stage = `loading page ${pageNumber}`;
          const pageUrl = new URL(src, window.location.origin);
          pageUrl.searchParams.set("page", String(pageNumber));
          // Changes to the protected renderer (such as the personal
          // watermark) must not be hidden behind a previously cached page.
          pageUrl.searchParams.set("render", "6");
          const response = await fetch(pageUrl, { credentials: "same-origin", signal: controller.signal, cache: "default" });
          if (!response.ok) {
            const details = await response.json().catch(() => null);
            throw new Error(`${details?.stage || "request failed"}: ${response.status}`);
          }
          const pageCount = Number(response.headers.get("X-PDF-Page-Count"));
          if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error("The page count was not returned by the reader");
          return { pageCount, blob: await response.blob() };
        };

        const firstPage = await requestPage(1);
        const pageImages = Array.from({ length: firstPage.pageCount }, (_, index) => {
          const image = document.createElement("img");
          image.className = "pdf-viewer-page";
          image.alt = `${title}, page ${index + 1}`;
          image.setAttribute("aria-busy", "true");
          pages.append(image);
          return image;
        });
        const fillPage = (pageNumber: number, blob: Blob) => {
          if (cancelled) return;
          const imageUrl = URL.createObjectURL(blob);
          objectUrls.push(imageUrl);
          const image = pageImages[pageNumber - 1];
          image.src = imageUrl;
          image.removeAttribute("aria-busy");
        };
        fillPage(1, firstPage.blob);
        setState("ready");

        // Rendering is CPU-intensive on the server. Three parallel requests
        // make a long guide feel immediate without exhausting a phone or a
        // serverless function with dozens of Canvas jobs at once.
        let nextPage = 2;
        const worker = async () => {
          while (!cancelled && nextPage <= firstPage.pageCount) {
            const pageNumber = nextPage;
            nextPage += 1;
            const page = await requestPage(pageNumber);
            fillPage(pageNumber, page.blob);
          }
        };
        await Promise.all(Array.from({ length: Math.min(3, Math.max(0, firstPage.pageCount - 1)) }, worker));

        if (!cancelled) setState("ready");
      } catch (error) {
        // Keep the detailed failure in DevTools; the dialog itself stays clear
        // for customers while the protected source URL is never exposed.
        console.error("PDF viewer failed to render", { src, error });
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unknown PDF.js error";
          setDiagnostic(`${stage}: ${message}`);
          setState("error");
        }
      } finally { if (cancelled) objectUrls.forEach((url) => URL.revokeObjectURL(url)); }
      return () => { controller.abort(); objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
    };

    let cleanup: (() => void) | undefined;
    void render().then((dispose) => { cleanup = dispose; });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [src, title]);

  return (
    <div
      className="pdf-viewer-pages"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="pdf-viewer-canvas-list" ref={pagesRef} />
      {state === "loading" && <p className="pdf-viewer-status">Loading document…</p>}
      {state === "error" && <p className="pdf-viewer-status">The document could not be displayed.<small>Diagnostic: {diagnostic}</small></p>}
    </div>
  );
}

function PdfViewer({ src, title }: { src: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  // The browser receives only watermarked page images; the original PDF stays
  // in private storage and is rendered by the authorized server route.
  const viewerSrc = `/api/course-pdf-page?path=${encodeURIComponent(src)}`;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const dialog = isOpen && <div className="pdf-viewer-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={() => setIsOpen(false)}>
      <section className="pdf-viewer-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="pdf-viewer-toolbar">
          <strong>{title}</strong>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close PDF">Close</button>
        </header>
        <PdfPages src={viewerSrc} title={title} />
      </section>
    </div>;

  return <>
    <button className="player-pdf-link" type="button" onClick={() => setIsOpen(true)}>{title}</button>
    {dialog ? createPortal(dialog, document.body) : null}
  </>;
}

function LessonBlocks({ blocks, courseSlug, lessonTitle, lessonSection }: { blocks: PlayerBlock[]; courseSlug?: string; lessonTitle: string; lessonSection: string }) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
  const firstImageIndex = sortedBlocks.findIndex((block) => block.kind === "image" || block.kind === "centered_image");
  return <div className="player-blocks">{sortedBlocks.map((block, index) => {
    if (block.kind === "separator") return <hr className="player-separator" key={block.id || index} />;
    if (block.kind === "text") return <div className="player-copy player-block-text" key={block.id || index}><RichDocument content={block.content} /></div>;
    if (block.kind === "heading") return <h2 className="player-block-heading" key={block.id || index}><RichText>{block.content}</RichText></h2>;
    if (block.kind === "label") return <p className="player-block-label" key={block.id || index}><RichText>{block.content}</RichText></p>;
    if (block.kind === "callout") return <aside className="player-block-callout" key={block.id || index}>{block.content.split("\n").filter(Boolean).map((line, lineIndex) => <p key={lineIndex}><RichText>{line}</RichText></p>)}</aside>;
    if (block.kind === "checklist") return <ul className="player-block-bullets" key={block.id || index}>{block.content.split("\n").filter(Boolean).map((line, lineIndex) => <li key={lineIndex}><RichText>{line.replace(/^(?:[-*]|✓)\s*/, "")}</RichText></li>)}</ul>;
    if (block.kind === "quote") return <blockquote className="player-block-quote" key={block.id || index}><RichText>{block.content}</RichText></blockquote>;
    if (block.kind === "week_banner") return <section className="player-week-hero" key={block.id || index} onContextMenu={(event) => event.preventDefault()}><img src={block.content} srcSet={block.image_srcset ?? undefined} sizes="(max-width: 600px) 100vw, 760px" alt="Week overview" loading="eager" fetchPriority="high" decoding="sync" /><div><h1>{lessonTitle}</h1><p>{lessonSection}</p></div></section>;
    const isFirstLessonImage = index === firstImageIndex;
    if (block.kind === "image") return <img className={`player-block-image ${sortedBlocks[index + 1]?.kind === "text" ? "floating" : ""}`} key={block.id || index} src={block.content} srcSet={block.image_srcset ?? undefined} sizes="(max-width: 600px) calc(100vw - 68px), 760px" alt="Lesson material" loading={isFirstLessonImage ? "eager" : "lazy"} fetchPriority={isFirstLessonImage ? "high" : "auto"} decoding={isFirstLessonImage ? "sync" : "async"} onContextMenu={(event) => event.preventDefault()} />;
    if (block.kind === "centered_image") return <img className="player-block-image centered" key={block.id || index} src={block.content} srcSet={block.image_srcset ?? undefined} sizes="(max-width: 600px) calc(100vw - 68px), 760px" alt="Lesson material" loading={isFirstLessonImage ? "eager" : "lazy"} fetchPriority={isFirstLessonImage ? "high" : "auto"} decoding={isFirstLessonImage ? "sync" : "async"} onContextMenu={(event) => event.preventDefault()} />;
    if (block.kind === "photo_examples") return <section className="player-photo-examples" key={block.id || index} onContextMenu={(event) => event.preventDefault()}><p>PHOTO EXAMPLES</p><img src={block.content} srcSet={block.image_srcset ?? undefined} sizes="(max-width: 600px) calc(100vw - 68px), 520px" alt="Front and side photo examples" loading={isFirstLessonImage ? "eager" : "lazy"} fetchPriority={isFirstLessonImage ? "high" : "auto"} decoding={isFirstLessonImage ? "sync" : "async"} /><div><span>FRONT</span><span>SIDE</span></div></section>;
    if (block.kind === "pdf") return <PdfViewer key={block.id || index} src={block.content} title={block.file_name || "View instruction"} />;
    const muxId = muxVideoId(block.content);
    if (muxId) return <MuxPlayer key={block.id || index} playbackId={muxId} title={`Lesson video ${index + 1}`} courseSlug={courseSlug} posterUrl={block.thumbnail_url} />;
    const youtubeId = youtubeVideoId(block.content);
    if (youtubeId) return <YouTubePlayer key={block.id || index} videoId={youtubeId} title={`Lesson video ${index + 1}`} />;
    const embedUrl = videoEmbedUrl(block.content);
    return embedUrl
      ? <VimeoPlayer key={block.id || index} src={embedUrl} title={`Lesson video ${index + 1}`} />
      : <a className="player-video-link" key={block.id || index} href={block.content} target="_blank" rel="noreferrer">Open lesson video</a>;
  })}</div>;
}

export default function ProgramPlayer({ courseTitle, courseSlug, initialLessonId, lessons: suppliedLessons, hasCalculatorAccess = false, isGuide = false }: { courseTitle: string; courseSlug?: string; initialLessonId?: string; lessons?: PlayerLesson[]; hasCalculatorAccess?: boolean; isGuide?: boolean }) {
  const lessons = suppliedLessons?.length ? suppliedLessons : defaultLessons;
  const sections = [...new Set(lessons.map((lesson) => lesson.section))];
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, initialLessonId ? lessons.findIndex((lesson) => lesson.id === initialLessonId) : 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isChangingLesson, setIsChangingLesson] = useState(false);
  const active = lessons[activeIndex];
  const jumpToLessonTop = () => {
    // The site uses smooth scrolling globally. Disable it briefly here so a
    // new lesson appears at its beginning instead of visibly scrolling there.
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    root.scrollTop = 0;
    window.requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
  };
  const changeLesson = (nextIndex: number, closeMenu = false) => {
    if (isChangingLesson || nextIndex === activeIndex || nextIndex < 0 || nextIndex >= lessons.length) return;
    setIsChangingLesson(true);
    if (closeMenu) setMenuOpen(false);
    window.setTimeout(() => {
      jumpToLessonTop();
      setActiveIndex(nextIndex);
      window.requestAnimationFrame(() => {
        window.setTimeout(() => setIsChangingLesson(false), 110);
      });
    }, 90);
  };
  const completeAndContinue = () => {
    if (activeIndex < lessons.length - 1) {
      changeLesson(activeIndex + 1);
    }
    else window.location.href = courseSlug ? `/my-programs/${courseSlug}` : "/my-programs";
  };
  const hasBlocks = Boolean(active.blocks?.length);
  const hasLegacyMaterial = Boolean(active.content || active.image_url || active.video_url || active.pdf_url);
  const isDefaultIntroduction = (active.intro || active.title === "Program Introduction") && !active.content && !active.image_url;
  const isWeekHero = /^week\s+\d+$/i.test(active.title) && Boolean(active.image_url);
  const hasWeekBannerBlock = (active.blocks ?? []).some((block) => block.kind === "week_banner");
  const isCourseFinish = !isGuide && isFinishLesson(active);
  const hidesAutomaticTitle = hasWeekBannerBlock || (/^week\s+\d+$/i.test(active.title) && (Boolean(active.image_url) || (active.blocks ?? []).some((block) => block.kind === "image" || block.kind === "centered_image")));
  const heroSubtitle = active.section && active.section !== active.title ? active.section : courseTitle;

  useEffect(() => {
    const scrollToLessonTop = jumpToLessonTop;
    // Safari can restore the previous scroll position after the route renders,
    // so reset it once more on the following frame.
    scrollToLessonTop();
    const frame = window.requestAnimationFrame(scrollToLessonTop);
    const timer = window.setTimeout(scrollToLessonTop, 0);
    setMenuOpen(window.matchMedia("(min-width: 901px)").matches);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!active?.id) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("lesson") === active.id) return;
    url.searchParams.set("lesson", active.id);
    window.history.replaceState(null, "", url);
  }, [active?.id]);

  useEffect(() => {
    // Warm only the active lesson. Preloading the next lesson delays the visible image.
    const imageUrls = [active].flatMap((lesson) => {
      if (!lesson) return [];
      return [lesson.image_url, (lesson.blocks ?? []).find((block) => block.kind === "image" || block.kind === "centered_image")?.content].filter(Boolean) as string[];
    });
    imageUrls.forEach((src) => { const image = new window.Image(); image.src = src; });
  }, [active, activeIndex, lessons]);

  const toggleAccountMenu = () => {
    if (!accountOpen) setMenuOpen(false);
    setAccountOpen(!accountOpen);
  };
  const toggleLessonsMenu = () => {
    if (!menuOpen) setAccountOpen(false);
    setMenuOpen(!menuOpen);
  };

  return <main className={`program-player ${menuOpen ? "menu-open" : ""} ${accountOpen ? "account-open" : ""} ${isChangingLesson ? "lesson-changing" : ""}`}>
    <header className="player-topbar">
      <button className="player-menu-toggle" type="button" aria-label={accountOpen ? "Close account menu" : "Open account menu"} aria-expanded={accountOpen} onClick={toggleAccountMenu}><i/><i/><i/></button>
      <button className={`player-mobile-lesson-toggle ${menuOpen ? "open" : ""}`} type="button" aria-label={menuOpen ? "Close lessons menu" : "Open lessons menu"} aria-expanded={menuOpen} onClick={toggleLessonsMenu}><ArrowIcon direction="right" /></button>
      <button className="player-account-toggle" type="button" aria-label={accountOpen ? "Close account menu" : "Open account menu"} aria-expanded={accountOpen} onClick={toggleAccountMenu}><i/><i/><i/></button>
      <Link href={courseSlug ? `/my-programs/${courseSlug}` : "/my-programs"} aria-label="Course overview" className="player-home"><HomeIcon /></Link>
      <span className="player-course-name">{courseTitle}</span>
      {accountOpen && <div className="player-account-menu"><Link href="/my-programs" onClick={() => setAccountOpen(false)}>My programs</Link><Link href={courseSlug ? `/calorie-calculator?from=${courseSlug}` : "/calorie-calculator"} className={hasCalculatorAccess ? undefined : "locked-menu-link"} onClick={() => setAccountOpen(false)}>Calorie calculator</Link><Link href="/profile" onClick={() => setAccountOpen(false)}>Edit profile</Link><form action="/auth/signout" method="POST"><button type="submit">Sign out</button></form></div>}
      <div className={`player-controls ${isCourseFinish ? "player-finish-controls" : ""}`}>
        {isCourseFinish ? <a href="https://instagram.com/by.alinkins" target="_blank" rel="noreferrer" aria-label="Share my results on Instagram">SHARE MY RESULTS</a> : <>
          {activeIndex > 0 && <button type="button" aria-label="Back" disabled={isChangingLesson} onClick={() => changeLesson(activeIndex - 1)}><ArrowIcon direction="left" /><span>Back</span></button>}
          <button type="button" aria-label={activeIndex === lessons.length - 1 ? "Finish" : "Next"} disabled={isChangingLesson} onClick={completeAndContinue}><span>{activeIndex === lessons.length - 1 ? "Finish" : "Next"}</span><ArrowIcon direction="right" /></button>
        </>}
      </div>
    </header>
    <aside className={`player-sidebar ${menuOpen ? "open" : ""}`}>
      <div className="player-lessons">{sections.map((section) => <div className="player-section" key={section}><h2>{section}</h2>{lessons.map((lesson, index) => lesson.section === section && <button key={`${lesson.id || lesson.title}-${index}`} type="button" disabled={isChangingLesson} className={index === activeIndex ? "active" : ""} onClick={() => changeLesson(index, true)}>{lesson.kind === "video" ? <VideoIcon /> : isFinishLesson(lesson) ? <FinishIcon /> : <TextIcon />}<span>{lesson.title}{lesson.duration && ` (${lesson.duration})`}</span></button>)}</div>)}</div>
    </aside>
    <button className="player-sidebar-toggle" type="button" aria-label={menuOpen ? "Close lessons menu" : "Open lessons menu"} onClick={toggleLessonsMenu}><ArrowIcon direction={menuOpen ? "left" : "right"} /></button>
    <section className="player-content">
      {isCourseFinish ? <CourseFinishScreen /> : <>
      {!hidesAutomaticTitle && <div className="player-title"><h1>{active.title}</h1></div>}
      {isDefaultIntroduction && <>
      </>}
      {hasLegacyMaterial && <div className="player-material">
        {active.image_url && (isWeekHero
          ? <section className="player-week-hero" onContextMenu={(event) => event.preventDefault()}><img src={active.image_url} srcSet={active.image_srcset ?? undefined} sizes="(max-width: 600px) 100vw, 760px" alt="Week overview" loading="eager" fetchPriority="high" decoding="sync" /><div><h1>{active.title}</h1><p>{heroSubtitle}</p></div></section>
          : <img src={active.image_url} srcSet={active.image_srcset ?? undefined} sizes="(max-width: 600px) calc(100vw - 68px), 760px" alt="Lesson illustration" loading="eager" fetchPriority="high" decoding="sync" onContextMenu={(event) => event.preventDefault()} />)}
        {active.video_url && <a className="player-video-link" href={active.video_url} target="_blank" rel="noreferrer">Open lesson video</a>}
        {active.content && <div className="player-copy">{active.content.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}><RichText>{paragraph}</RichText></p>)}</div>}
          {active.pdf_url && (isGuide
            ? <section className="guide-pdf-document"><PdfPages src={`/api/course-pdf-page?path=${encodeURIComponent(active.pdf_url)}`} title={active.title} /></section>
            : <PdfViewer src={active.pdf_url} title="View instruction" />)}
      </div>}
      {hasBlocks && <LessonBlocks blocks={active.blocks || []} courseSlug={courseSlug} lessonTitle={active.title} lessonSection={active.section} />}
      {!isDefaultIntroduction && !hasLegacyMaterial && !hasBlocks && <div className="player-empty"><p className="eyebrow">{active.section}</p><h2>{active.title}</h2><p>This lesson is ready for your materials.</p></div>}
      </>}
    </section>
  </main>;
}
