"use client";

import { ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useState } from "react";
import { compressImageForUpload } from "@/lib/client-image-compression";
import { getSupabase } from "@/lib/supabase-browser";
import LessonBlocksEditor, { type LessonBlock } from "@/components/LessonBlocksEditor";
import SiteContentEditor, { type AdminResult, type AdminReview } from "@/components/SiteContentEditor";

type Lesson = {
  id: string;
  title: string;
  section: string;
  kind: "text" | "video" | "finish";
  content: string | null;
  video_url: string | null;
  image_path: string | null;
  pdf_path: string | null;
  duration: string | null;
  position: number;
  published: boolean;
  lesson_blocks?: LessonBlock[];
};
type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sales_story_title: string | null;
  sales_story_body: string | null;
  sales_story_conclusion: string | null;
  sales_gallery: string[];
  sales_gallery_title: string | null;
  guide_preview_gallery: string[];
  equipment_image_path: string | null;
  equipment_button_label: string | null;
  weeks: number | null;
  price: number | null;
  old_price: number | null;
  stripe_price_id: string | null;
  product_type: "course" | "guide";
  image_path: string | null;
  cover_url?: string | null;
  cover_focus_x: number | null;
  cover_focus_y: number | null;
  cover_card_focus_x: number | null;
  cover_card_focus_y: number | null;
  cover_sales_focus_x: number | null;
  cover_sales_focus_y: number | null;
  cover_sales_phone_focus_x?: number | null;
  cover_sales_phone_focus_y?: number | null;
  cover_sales_tablet_focus_x?: number | null;
  cover_sales_tablet_focus_y?: number | null;
  cover_sales_desktop_focus_x?: number | null;
  cover_sales_desktop_focus_y?: number | null;
  cover_cabinet_focus_x: number | null;
  cover_cabinet_focus_y: number | null;
  cover_dashboard_focus_x: number | null;
  cover_dashboard_focus_y: number | null;
  cover_card_zoom?: number | null;
  cover_sales_zoom?: number | null;
  cover_sales_phone_zoom?: number | null;
  cover_sales_tablet_zoom?: number | null;
  cover_sales_desktop_zoom?: number | null;
  cover_cabinet_zoom?: number | null;
  cover_dashboard_zoom?: number | null;
  status: "available" | "coming-soon";
  grants_calorie_calculator: boolean;
  published: boolean;
  display_order: number;
  lessons?: Lesson[];
  course_sections?: CourseSection[];
};
type CourseSection = { id: string; title: string; content: string; position: number };
type CourseForm = Omit<Course, "id" | "lessons" | "course_sections">;
type LessonForm = Omit<Lesson, "id" | "lesson_blocks">;

const emptyCourse: CourseForm = { title: "", slug: "", description: "", sales_story_title: "", sales_story_body: "", sales_story_conclusion: "", sales_gallery: [], sales_gallery_title: "MY TRANSFORMATION", guide_preview_gallery: [], equipment_image_path: "", equipment_button_label: "VIEW EQUIPMENT LIST", weeks: 9, price: 65, old_price: null, stripe_price_id: "", product_type: "course", image_path: "", cover_focus_x: 50, cover_focus_y: 50, cover_card_focus_x: 50, cover_card_focus_y: 50, cover_sales_focus_x: 50, cover_sales_focus_y: 50, cover_sales_phone_focus_x: 50, cover_sales_phone_focus_y: 50, cover_sales_tablet_focus_x: 50, cover_sales_tablet_focus_y: 50, cover_sales_desktop_focus_x: 50, cover_sales_desktop_focus_y: 50, cover_cabinet_focus_x: 50, cover_cabinet_focus_y: 50, cover_dashboard_focus_x: 50, cover_dashboard_focus_y: 50, cover_card_zoom: 1, cover_sales_zoom: 1, cover_sales_phone_zoom: 1, cover_sales_tablet_zoom: 1, cover_sales_desktop_zoom: 1, cover_cabinet_zoom: 1, cover_dashboard_zoom: 1, status: "available", grants_calorie_calculator: false, published: false, display_order: 0 };
const emptyLesson: LessonForm = { title: "", section: "The Basics", kind: "text", content: "", video_url: "", image_path: "", pdf_path: "", duration: "", position: 0, published: false };
const courseToForm = (course: Course): CourseForm => { const { id, lessons, course_sections, ...form } = course; const x = course.cover_focus_x ?? 50; const y = course.cover_focus_y ?? 50; const salesX = course.cover_sales_focus_x ?? x; const salesY = course.cover_sales_focus_y ?? y; const salesZoom = course.cover_sales_zoom ?? 1; return { ...form, sales_story_title: course.sales_story_title ?? "", sales_story_body: course.sales_story_body ?? "", sales_story_conclusion: course.sales_story_conclusion ?? "", sales_gallery: Array.isArray(course.sales_gallery) ? course.sales_gallery : [], sales_gallery_title: course.sales_gallery_title ?? "", guide_preview_gallery: Array.isArray(course.guide_preview_gallery) ? course.guide_preview_gallery : [], equipment_image_path: course.equipment_image_path ?? "", equipment_button_label: course.equipment_button_label ?? "VIEW EQUIPMENT LIST", grants_calorie_calculator: course.grants_calorie_calculator ?? false, cover_focus_x: x, cover_focus_y: y, cover_card_focus_x: course.cover_card_focus_x ?? x, cover_card_focus_y: course.cover_card_focus_y ?? y, cover_sales_focus_x: salesX, cover_sales_focus_y: salesY, cover_sales_phone_focus_x: course.cover_sales_phone_focus_x ?? salesX, cover_sales_phone_focus_y: course.cover_sales_phone_focus_y ?? salesY, cover_sales_tablet_focus_x: course.cover_sales_tablet_focus_x ?? salesX, cover_sales_tablet_focus_y: course.cover_sales_tablet_focus_y ?? salesY, cover_sales_desktop_focus_x: course.cover_sales_desktop_focus_x ?? salesX, cover_sales_desktop_focus_y: course.cover_sales_desktop_focus_y ?? salesY, cover_cabinet_focus_x: course.cover_cabinet_focus_x ?? x, cover_cabinet_focus_y: course.cover_cabinet_focus_y ?? y, cover_dashboard_focus_x: course.cover_dashboard_focus_x ?? x, cover_dashboard_focus_y: course.cover_dashboard_focus_y ?? y, cover_card_zoom: course.cover_card_zoom ?? 1, cover_sales_zoom: salesZoom, cover_sales_phone_zoom: course.cover_sales_phone_zoom ?? salesZoom, cover_sales_tablet_zoom: course.cover_sales_tablet_zoom ?? salesZoom, cover_sales_desktop_zoom: course.cover_sales_desktop_zoom ?? salesZoom, cover_cabinet_zoom: course.cover_cabinet_zoom ?? 1, cover_dashboard_zoom: course.cover_dashboard_zoom ?? 1 }; };

function CourseDisplayOrder({ course }: { course: Course }) {
  const [value, setValue] = useState((course.display_order ?? 0) + 1);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue((course.display_order ?? 0) + 1), [course.id, course.display_order]);

  async function savePosition(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/admin/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...course, display_order: Math.max(0, (Number(value) || 1) - 1) }),
    });
    setSaving(false);
    if (response.ok) window.location.reload();
  }

  return <form className="admin-card" onSubmit={savePosition} style={{ marginTop: 18 }}>
    <h3>Порядок карточки на сайте</h3>
    <label>
      Позиция карточки
      <input type="number" min="1" value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
    <p className="admin-help">1 — первая карточка (слева вверху), 2 — вторая (справа вверху), 3 — первая карточка следующего ряда.</p>
    <div className="admin-actions"><button className="admin-save" disabled={saving}>{saving ? "Сохранение..." : "Сохранить порядок"}</button></div>
  </form>;
}

type CoverPlacement = "card" | "sales" | "cabinet" | "dashboard";
type CoverPoint = { x: number; y: number };
type CoverDevice = "phone" | "tablet" | "desktop";

function CourseCoverFocus({ course, onSaved }: { course: Course; onSaved: (course: Course) => void }) {
  const fallback = { x: course.cover_focus_x ?? 50, y: course.cover_focus_y ?? 50 };
  const readFocus = () => ({
    card: { x: course.cover_card_focus_x ?? fallback.x, y: course.cover_card_focus_y ?? fallback.y },
    sales: { x: course.cover_sales_focus_x ?? fallback.x, y: course.cover_sales_focus_y ?? fallback.y },
    cabinet: { x: course.cover_cabinet_focus_x ?? fallback.x, y: course.cover_cabinet_focus_y ?? fallback.y },
    dashboard: { x: course.cover_dashboard_focus_x ?? fallback.x, y: course.cover_dashboard_focus_y ?? fallback.y },
  });
  const [points, setPoints] = useState<Record<CoverPlacement, CoverPoint>>(readFocus);
  const readZoom = () => ({ card: course.cover_card_zoom ?? 1, sales: course.cover_sales_zoom ?? 1, cabinet: course.cover_cabinet_zoom ?? 1, dashboard: course.cover_dashboard_zoom ?? 1 });
  const [zooms, setZooms] = useState<Record<CoverPlacement, number>>(readZoom);
  const readSalesFocusByDevice = (): Record<CoverDevice, CoverPoint> => ({
    phone: { x: course.cover_sales_phone_focus_x ?? course.cover_sales_focus_x ?? fallback.x, y: course.cover_sales_phone_focus_y ?? course.cover_sales_focus_y ?? fallback.y },
    tablet: { x: course.cover_sales_tablet_focus_x ?? course.cover_sales_focus_x ?? fallback.x, y: course.cover_sales_tablet_focus_y ?? course.cover_sales_focus_y ?? fallback.y },
    desktop: { x: course.cover_sales_desktop_focus_x ?? course.cover_sales_focus_x ?? fallback.x, y: course.cover_sales_desktop_focus_y ?? course.cover_sales_focus_y ?? fallback.y },
  });
  const readSalesZoomByDevice = (): Record<CoverDevice, number> => ({ phone: course.cover_sales_phone_zoom ?? course.cover_sales_zoom ?? 1, tablet: course.cover_sales_tablet_zoom ?? course.cover_sales_zoom ?? 1, desktop: course.cover_sales_desktop_zoom ?? course.cover_sales_zoom ?? 1 });
  const [salesPoints, setSalesPoints] = useState<Record<CoverDevice, CoverPoint>>(readSalesFocusByDevice);
  const [salesZooms, setSalesZooms] = useState<Record<CoverDevice, number>>(readSalesZoomByDevice);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<CoverDevice>("phone");
  const imageUrl = course.cover_url ?? "";
  const options: Array<{ key: CoverPlacement; title: string; hint: string; className: string }> = [
    { key: "card", title: "Карточка курса", hint: "Главная / Workout programs", className: "cover-focus-card" },
    { key: "sales", title: "Продающая страница", hint: "Баннер курса", className: "cover-focus-sales" },
    { key: "cabinet", title: "Личный кабинет", hint: "Страница программы после покупки", className: "cover-focus-cabinet" },
    { key: "dashboard", title: "My programs", hint: "Compact purchased-program card", className: "cover-focus-dashboard" },
  ];

  useEffect(() => { setPoints(readFocus()); setZooms(readZoom()); setSalesPoints(readSalesFocusByDevice()); setSalesZooms(readSalesZoomByDevice()); }, [course]);

  function setPoint(key: CoverPlacement, patch: Partial<CoverPoint>) {
    if (key === "sales") { setSalesPoints((current) => ({ ...current, [device]: { ...current[device], ...patch } })); return; }
    setPoints((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }
  const currentPoint = (key: CoverPlacement) => key === "sales" ? salesPoints[device] : points[key];
  const currentZoom = (key: CoverPlacement) => key === "sales" ? salesZooms[device] : zooms[key];
  function setZoom(key: CoverPlacement, value: number) {
    if (key === "sales") { setSalesZooms((current) => ({ ...current, [device]: value })); return; }
    setZooms((current) => ({ ...current, [key]: value }));
  }
  function resetCoverVariants() {
    setPoints({ card: { x: 50, y: 50 }, sales: { x: 50, y: 50 }, cabinet: { x: 50, y: 50 }, dashboard: { x: 50, y: 50 } });
    setZooms({ card: 1, sales: 1, cabinet: 1, dashboard: 1 });
    setSalesPoints({ phone: { x: 50, y: 50 }, tablet: { x: 50, y: 50 }, desktop: { x: 50, y: 50 } });
    setSalesZooms({ phone: 1, tablet: 1, desktop: 1 });
  }
  function chooseFocus(key: CoverPlacement, event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint(key, {
      x: Math.round(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))),
      y: Math.round(Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))),
    });
  }
  async function saveFocus(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...course,
          cover_focus_x: points.card.x, cover_focus_y: points.card.y,
          cover_card_focus_x: points.card.x, cover_card_focus_y: points.card.y,
          cover_sales_focus_x: salesPoints.phone.x, cover_sales_focus_y: salesPoints.phone.y,
          cover_sales_phone_focus_x: salesPoints.phone.x, cover_sales_phone_focus_y: salesPoints.phone.y,
          cover_sales_tablet_focus_x: salesPoints.tablet.x, cover_sales_tablet_focus_y: salesPoints.tablet.y,
          cover_sales_desktop_focus_x: salesPoints.desktop.x, cover_sales_desktop_focus_y: salesPoints.desktop.y,
          cover_cabinet_focus_x: points.cabinet.x, cover_cabinet_focus_y: points.cabinet.y,
          cover_dashboard_focus_x: points.dashboard.x, cover_dashboard_focus_y: points.dashboard.y,
          cover_card_zoom: zooms.card, cover_sales_zoom: salesZooms.phone, cover_sales_phone_zoom: salesZooms.phone, cover_sales_tablet_zoom: salesZooms.tablet, cover_sales_desktop_zoom: salesZooms.desktop, cover_cabinet_zoom: zooms.cabinet, cover_dashboard_zoom: zooms.dashboard,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Не удалось сохранить кадрирование обложки.");
      onSaved({ ...course, ...json.course, lessons: course.lessons, course_sections: course.course_sections });
    } catch (error) { window.alert(error instanceof Error ? error.message : "Не удалось сохранить кадрирование обложки."); }
    finally { setSaving(false); }
  }

  return <form className="admin-card admin-cover-focus" onSubmit={saveFocus}>
    <div className="admin-cover-focus-heading"><div><h3>Варианты обложки</h3><p className="admin-help">У продающей страницы теперь независимый кадр для телефона, планшета и компьютера. На планшете и компьютере фото всегда остаётся в центре вертикальной рамки, а поля по бокам добавляются автоматически.</p></div><div className="cover-device-switch" aria-label="Устройство для предпросмотра"><span>Показать:</span>{(["phone", "tablet", "desktop"] as const).map((item) => <button type="button" key={item} className={device === item ? "active" : ""} onClick={() => setDevice(item)}>{item === "phone" ? "Телефон" : item === "tablet" ? "Планшет" : "Компьютер"}</button>)}</div></div>
    {!imageUrl ? <div className="cover-focus-empty">После загрузки и сохранения обложки здесь появятся четыре окна для выбора кадра.</div> : <div className="cover-focus-choices" data-device={device}>{options.map(({ key, title, hint, className }) => { const point = currentPoint(key); const zoom = currentZoom(key); return <section className="cover-focus-choice" key={key}><div><h4>{title}</h4><p>{hint}</p></div><button type="button" className={`cover-focus-picker ${className}`} onPointerDown={(event) => chooseFocus(key, event)} aria-label={`Выбрать кадр: ${title}`}><img className="cover-focus-image" src={imageUrl} alt="" draggable={false} style={{ objectPosition: `${point.x}% ${point.y}%`, transform: `scale(${zoom})`, transformOrigin: `${point.x}% ${point.y}%` }} /><span className="cover-focus-grid" /><span className="cover-focus-marker" style={{ left: `${point.x}%`, top: `${point.y}%` }} /></button><div className="cover-focus-controls"><label>По горизонтали <b>{point.x}%</b><input type="range" min="0" max="100" value={point.x} onChange={(event) => setPoint(key, { x: Number(event.target.value) })} /></label><label>По вертикали <b>{point.y}%</b><input type="range" min="0" max="100" value={point.y} onChange={(event) => setPoint(key, { y: Number(event.target.value) })} /></label><label>Масштаб <b>{Math.round(zoom * 100)}%</b><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(key, Number(event.target.value))} /></label></div></section>; })}</div>}
    <div className="admin-actions"><button type="button" className="admin-secondary" disabled={saving || !imageUrl} onClick={resetCoverVariants}>Сбросить кадрирование</button><button className="admin-save" disabled={saving || !imageUrl}>{saving ? "Сохранение…" : "Сохранить все варианты"}</button></div>
  </form>;
}

function CourseAccessGrant({ course }: { course: Course }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  async function grantAccess(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, courseId: course.id }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Не удалось выдать доступ.");
      setMessage(json.message || "Доступ выдан.");
      if (!json.alreadyGranted) setEmail("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось выдать доступ."); }
    finally { setBusy(false); }
  }

  async function selectCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const emails = Array.from(new Set((text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi) ?? []).map((item) => item.trim().toLowerCase())));
    setBulkEmails(emails);
    setBulkProgress(emails.length ? `Найдено клиентов: ${emails.length}.` : "Не удалось найти e-mail в файле.");
    event.target.value = "";
  }

  async function grantBulkAccess() {
    if (!bulkEmails.length || bulkBusy) return;
    if (!window.confirm(`Выдать доступ к «${course.title}» ${bulkEmails.length} клиентам? Пользователям без аккаунта будет отправлено письмо для создания пароля.`)) return;

    setBulkBusy(true);
    let granted = 0;
    let alreadyGranted = 0;
    let failed = 0;
    try {
      for (let index = 0; index < bulkEmails.length; index += 1) {
        const response = await fetch("/api/admin/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: bulkEmails[index], courseId: course.id }),
        });
        const json = await response.json();
        if (response.ok && json.alreadyGranted) alreadyGranted += 1;
        else if (response.ok) granted += 1;
        else failed += 1;

        setBulkProgress(`Обработано ${index + 1} из ${bulkEmails.length}: выдано ${granted}, уже было ${alreadyGranted}, ошибок ${failed}.`);
        // Keep Resend below its rate limit when setup emails need to be sent.
        if (index < bulkEmails.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 650));
      }
      setBulkProgress(`Готово: выдано ${granted}, уже был доступ у ${alreadyGranted}, ошибок ${failed}.`);
    } finally {
      setBulkBusy(false);
    }
  }

  return <form className="admin-card admin-access-grant" onSubmit={grantAccess}>
    <h3>Выдать доступ к курсу</h3>
    <p className="admin-help">Для подарка, акции или ручного доступа. Если аккаунта с этим e-mail ещё нет, пользователь получит письмо для создания пароля.</p>
    <label>E-mail пользователя<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></label>
    {message && <p className="admin-block-message">{message}</p>}
    <div className="admin-actions"><button className="admin-save" disabled={busy}>{busy ? "Выдаём доступ…" : "Выдать доступ"}</button></div>
    <div className="admin-bulk-access">
      <h4>Массовая выдача доступа</h4>
      <p className="admin-help">Загрузите CSV из Teachable. Будут использованы только уникальные e-mail; повторные доступы пропустятся.</p>
      <label className="admin-upload">Загрузить CSV<input type="file" accept=".csv,text/csv" onChange={selectCsv} disabled={bulkBusy} /></label>
      {bulkProgress && <p className="admin-block-message">{bulkProgress}</p>}
      <div className="admin-actions"><button type="button" className="admin-save" onClick={grantBulkAccess} disabled={bulkBusy || !bulkEmails.length}>{bulkBusy ? "Выдаём доступ…" : `Выдать доступ ${bulkEmails.length || ""} клиентам`}</button></div>
    </div>
  </form>;
}

const lessonToForm = (lesson: Lesson): LessonForm => { const { id, lesson_blocks, ...form } = lesson; return form; };

function CourseSectionsEditor({ course, onChange }: { course: Course; onChange: (sections: CourseSection[]) => void }) {
  const sections = course.course_sections ?? [];
  const [draft, setDraft] = useState({ title: "", content: "", position: sections.length });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDraft({ title: "", content: "", position: sections.length }); setError(""); }, [course.id]);
  const sort = (items: CourseSection[]) => [...items].sort((a, b) => a.position - b.position);
  const updateLocal = (id: string, patch: Partial<CourseSection>) => onChange(sections.map((section) => section.id === id ? { ...section, ...patch } : section));

  async function addSection(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/courses/${course.id}/sections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "Не удалось добавить карточку.");
      onChange(sort([...sections, json.section])); setDraft({ title: "", content: "", position: sections.length + 1 });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось добавить карточку."); }
    finally { setBusy(false); }
  }
  async function saveSection(section: CourseSection) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/sections/${section.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(section) });
      const json = await response.json(); if (!response.ok) throw new Error(json.error || "Не удалось сохранить карточку.");
      onChange(sort(sections.map((item) => item.id === section.id ? json.section : item)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить карточку."); }
    finally { setBusy(false); }
  }
  async function removeSection(id: string) {
    if (!window.confirm("Удалить эту карточку?")) return;
    setBusy(true); setError("");
    try { const response = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" }); const json = await response.json(); if (!response.ok) throw new Error(json.error || "Не удалось удалить карточку."); onChange(sections.filter((section) => section.id !== id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось удалить карточку."); }
    finally { setBusy(false); }
  }

  return <section className="admin-lessons admin-sales-sections" style={{ marginTop: 28 }}>
    <div className="admin-section-title"><div><p className="admin-kicker">СТРАНИЦА ПРОДАЖ КУРСА</p><h3>Карточки «Что входит»</h3></div></div>
    <p className="admin-help">Добавляйте любые карточки: тренировки, питание, оборудование, бонусы и другое. Меньшее число в поле «Порядок» будет показано раньше.</p>
    {error && <p className="admin-message">{error}</p>}
    <div className="admin-lesson-area"><div className="admin-lesson-list">{sections.length === 0 && <p className="admin-empty">Карточек пока нет. Добавьте первую справа.</p>}{sort(sections).map((section) => <article key={section.id}><button type="button" onClick={() => undefined}><span className="published">КАРТОЧКА {section.position + 1}</span><strong>{section.title}</strong><small>{section.content.slice(0, 70) || "Нет текста"}</small></button><button type="button" aria-label={`Удалить ${section.title}`} onClick={() => removeSection(section.id)}>×</button></article>)}</div>
      <div className="admin-editor-column"><form className="admin-card admin-lesson-form" onSubmit={addSection}><h3>Добавить карточку</h3><label>Название карточки<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Тренировки" required /></label><label>Текст<textarea rows={5} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Разделяйте абзацы пустой строкой. Сюда можно вставить весь текст карточки." /></label><label>Порядок<input type="number" min="1" value={draft.position + 1} onChange={(event) => setDraft({ ...draft, position: Math.max(0, Number(event.target.value) - 1) })} /></label><div className="admin-actions"><button className="admin-save" disabled={busy}>{busy ? "Сохранение…" : "Добавить карточку"}</button></div></form>
        {sort(sections).map((section) => <form key={section.id} className="admin-card admin-lesson-form" style={{ marginTop: 16 }} onSubmit={(event) => { event.preventDefault(); saveSection(section); }}><h3>Редактировать: {section.title}</h3><label>Название карточки<input value={section.title} onChange={(event) => updateLocal(section.id, { title: event.target.value })} /></label><label>Текст<textarea rows={5} value={section.content} onChange={(event) => updateLocal(section.id, { content: event.target.value })} /></label><label>Порядок<input type="number" min="1" value={section.position + 1} onChange={(event) => updateLocal(section.id, { position: Math.max(0, Number(event.target.value) - 1) })} /></label><div className="admin-actions"><button className="admin-save" disabled={busy}>{busy ? "Сохранение…" : "Сохранить карточку"}</button><button type="button" className="admin-delete" onClick={() => removeSection(section.id)}>Удалить карточку</button></div></form>)}</div></div>
  </section>;
}

export default function AdminStudio({ initialCourses, initialResults = [], initialReviews = [] }: { initialCourses: Course[]; initialResults?: AdminResult[]; initialReviews?: AdminReview[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [activeId, setActiveId] = useState(initialCourses[0]?.id ?? "new");
  const [courseForm, setCourseForm] = useState<CourseForm>(initialCourses[0] ? courseToForm(initialCourses[0]) : emptyCourse);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const active = useMemo(() => courses.find((course) => course.id === activeId), [courses, activeId]);
  const currentLesson = active?.lessons?.find((lesson) => lesson.id === editingLesson);

  const updateCourse = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) => setCourseForm((form) => ({ ...form, [key]: value }));
  const updateLesson = <K extends keyof LessonForm>(key: K, value: LessonForm[K]) => setLessonForm((form) => ({ ...form, [key]: value }));
  function selectCourse(course: Course | null, productType: CourseForm["product_type"] = "course") {
    setActiveId(course?.id ?? "new");
    setCourseForm(course ? courseToForm(course) : { ...emptyCourse, product_type: productType, weeks: productType === "guide" ? null : emptyCourse.weeks });
    setLessonForm(emptyLesson);
    setEditingLesson(null);
    setMessage("");
  }
  async function api(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Что-то пошло не так. Попробуйте ещё раз.");
    return json;
  }
  async function saveCourse(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const result = await api(active ? `/api/admin/courses/${active.id}` : "/api/admin/courses", active ? "PATCH" : "POST", courseForm);
      const saved = result.course as Course;
      const savedWithLessons = active ? { ...saved, lessons: active.lessons ?? [], course_sections: active.course_sections ?? [] } : saved;
      setCourses((list) => active ? list.map((course) => course.id === saved.id ? savedWithLessons : course) : [savedWithLessons, ...list]);
      selectCourse(savedWithLessons); setMessage("Курс сохранён.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить курс."); }
    finally { setSaving(false); }
  }
  async function deleteCourse() {
    if (!active || !window.confirm(`Удалить курс «${active.title}» вместе со всеми уроками?`)) return;
    setSaving(true);
    try { await api(`/api/admin/courses/${active.id}`, "DELETE"); const next = courses.filter((course) => course.id !== active.id); setCourses(next); selectCourse(next[0] ?? null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось удалить курс."); }
    finally { setSaving(false); }
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, key: "image_path" | "pdf_path", target: "course" | "lesson" | "gallery" | "guide_gallery" | "equipment") {
    const file = event.target.files?.[0]; if (!file) return;
    setSaving(true); setMessage("Загрузка файла…");
    try {
      const uploadFile = await compressImageForUpload(file);
      let json: { path: string; name: string; token?: string };
      if (uploadFile.size > 4 * 1024 * 1024) {
        const response = await fetch("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: uploadFile.name, type: uploadFile.type, size: uploadFile.size }) });
        json = await response.json();
        if (!response.ok || !json.token) throw new Error((json as { error?: string }).error || "Не удалось подготовить загрузку файла.");
        const { error } = await getSupabase().storage.from("course-files").uploadToSignedUrl(json.path, json.token, uploadFile, { contentType: uploadFile.type });
        if (error) throw new Error(error.message || "Не удалось загрузить файл.");
      } else {
        const data = new FormData(); data.append("file", uploadFile);
        const response = await fetch("/api/admin/upload", { method: "POST", body: data }); json = await response.json();
        if (!response.ok) throw new Error((json as { error?: string }).error || "Не удалось загрузить файл.");
      }
      if (target === "course") {
        const nextForm = {
          ...courseForm,
          image_path: json.path,
          cover_focus_x: 50, cover_focus_y: 50, cover_card_focus_x: 50, cover_card_focus_y: 50,
          cover_sales_focus_x: 50, cover_sales_focus_y: 50, cover_sales_phone_focus_x: 50, cover_sales_phone_focus_y: 50,
          cover_sales_tablet_focus_x: 50, cover_sales_tablet_focus_y: 50, cover_sales_desktop_focus_x: 50, cover_sales_desktop_focus_y: 50,
          cover_cabinet_focus_x: 50, cover_cabinet_focus_y: 50, cover_dashboard_focus_x: 50, cover_dashboard_focus_y: 50,
          cover_card_zoom: 1, cover_sales_zoom: 1, cover_sales_phone_zoom: 1, cover_sales_tablet_zoom: 1,
          cover_sales_desktop_zoom: 1, cover_cabinet_zoom: 1, cover_dashboard_zoom: 1,
        };
        updateCourse("image_path", json.path);

        // A cover is the one upload that should be visible immediately. Saving it
        // here prevents the new file from remaining only in the unsaved form.
        if (active) {
          const result = await api(`/api/admin/courses/${active.id}`, "PATCH", nextForm);
          const saved = result.course as Course;
          const savedWithContent = { ...saved, lessons: active.lessons ?? [], course_sections: active.course_sections ?? [] };
          setCourses((list) => list.map((course) => course.id === saved.id ? savedWithContent : course));
          selectCourse(savedWithContent);
          setMessage("Новая обложка сохранена и сразу появится на сайте.");
        } else {
          setMessage("Файл загружен. Сначала сохраните новый курс, чтобы прикрепить обложку.");
        }
      } else if (target === "gallery") {
        updateCourse("sales_gallery", [...(courseForm.sales_gallery ?? []), json.path]);
        setMessage("Файл загружен. Нажмите «Сохранить», чтобы прикрепить его.");
      } else if (target === "guide_gallery") {
        updateCourse("guide_preview_gallery", [...(courseForm.guide_preview_gallery ?? []), json.path]);
        setMessage("Превью добавлено в карусель. Нажмите «Сохранить гайд».");
      } else if (target === "equipment") {
        updateCourse("equipment_image_path", json.path);
        setMessage("Файл загружен. Нажмите «Сохранить», чтобы прикрепить его.");
      } else {
        updateLesson(key, json.path);
        setMessage("Файл загружен. Нажмите «Сохранить», чтобы прикрепить его.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить файл."); }
    finally { setSaving(false); event.target.value = ""; }
  }
  async function saveLesson(event: FormEvent) {
    event.preventDefault(); if (!active) return;
    setSaving(true); setMessage("");
    try {
      const result = await api(editingLesson ? `/api/admin/lessons/${editingLesson}` : `/api/admin/courses/${active.id}/lessons`, editingLesson ? "PATCH" : "POST", lessonForm);
      const saved = result.lesson as Lesson;
      const preserved = { ...saved, lesson_blocks: currentLesson?.lesson_blocks ?? [] };
      const lessons = editingLesson ? (active.lessons ?? []).map((lesson) => lesson.id === saved.id ? preserved : lesson) : [...(active.lessons ?? []), preserved];
      const updated = { ...active, lessons: lessons.sort((a, b) => a.position - b.position) };
      setCourses((list) => list.map((course) => course.id === updated.id ? updated : course));
      if (!editingLesson) setEditingLesson(saved.id);
      setLessonForm(lessonToForm(preserved)); setMessage("Урок сохранён.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить урок."); }
    finally { setSaving(false); }
  }
  async function removeLesson(id: string) {
    if (!active || !window.confirm("Удалить этот урок?")) return;
    setSaving(true);
    try { await api(`/api/admin/lessons/${id}`, "DELETE"); const updated = { ...active, lessons: (active.lessons ?? []).filter((lesson) => lesson.id !== id) }; setCourses((list) => list.map((course) => course.id === updated.id ? updated : course)); if (editingLesson === id) { setEditingLesson(null); setLessonForm(emptyLesson); } }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось удалить урок."); }
    finally { setSaving(false); }
  }
  async function duplicateLesson(id: string) {
    if (!active) return;
    setSaving(true); setMessage("");
    try {
      const result = await api(`/api/admin/lessons/${id}/duplicate`, "POST");
      const copied = result.lesson as Lesson;
      const updated = { ...active, lessons: [...(active.lessons ?? []), copied].sort((a, b) => a.position - b.position) };
      setCourses((list) => list.map((course) => course.id === updated.id ? updated : course));
      setEditingLesson(copied.id); setLessonForm(lessonToForm(copied));
      setMessage("Урок скопирован как черновик. Измените название и сохраните его.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось скопировать урок."); }
    finally { setSaving(false); }
  }
  function updateBlocks(lessonId: string, lesson_blocks: LessonBlock[]) {
    if (!active) return;
    const updated = { ...active, lessons: (active.lessons ?? []).map((lesson) => lesson.id === lessonId ? { ...lesson, lesson_blocks } : lesson) };
    setCourses((list) => list.map((course) => course.id === updated.id ? updated : course));
  }

  return <div className="admin-layout">
    <aside className="admin-sidebar"><div><p className="admin-kicker">BY.ALINKINS</p><h1>Управление контентом</h1><p>Создавайте курсы, отдельные гайды и материалы для них.</p></div><button type="button" className="admin-new" onClick={() => selectCourse(null, "course")}>+ Новый курс</button><button type="button" className="admin-new" onClick={() => selectCourse(null, "guide")}>+ Новый гайд</button><nav>{courses.map((course) => <button type="button" key={course.id} className={course.id === activeId ? "active" : ""} onClick={() => selectCourse(course)}><strong>{course.title}</strong><span>{course.product_type === "guide" ? "ГАЙД" : `/${course.slug}`}</span></button>)}</nav><a href="/my-programs">← Вернуться к моим программам</a></aside>
    <main className="admin-main"><header><div><p className="admin-kicker">ЛИЧНЫЙ КАБИНЕТ</p><h2>{active ? `Редактирование: ${active.title}` : courseForm.product_type === "guide" ? "Создать новый гайд" : "Создать новый курс"}</h2></div>{message && <p className="admin-message">{message}</p>}</header>
      <form className="admin-card admin-course-form" onSubmit={saveCourse}>
        <h3>Основные настройки {courseForm.product_type === "guide" ? "гайда" : "курса"}</h3>
        <div className="admin-grid">
          <label>Тип продукта<select value={courseForm.product_type} onChange={(event) => updateCourse("product_type", event.target.value as CourseForm["product_type"])}><option value="course">Курс</option><option value="guide">Отдельный гайд</option></select></label>
          <label>Название {courseForm.product_type === "guide" ? "гайда" : "курса"}<input value={courseForm.title} onChange={(event) => updateCourse("title", event.target.value)} placeholder={courseForm.product_type === "guide" ? "Например: Nutrition Guide" : "Например: Hourglass Home"} required /></label>
          <label>Адрес страницы (slug)<input value={courseForm.slug} onChange={(event) => updateCourse("slug", event.target.value)} placeholder="hourglass-home" required /></label>
          {courseForm.product_type === "course" && <label>Длительность (недель)<input type="number" min="1" value={courseForm.weeks ?? ""} onChange={(event) => updateCourse("weeks", Number(event.target.value))} /></label>}
          <label>Цена сейчас (USD)<input type="number" min="0" step="0.01" value={courseForm.price ?? ""} onChange={(event) => updateCourse("price", Number(event.target.value))} /></label>
          <label>Старая цена (USD)<input type="number" min="0" step="0.01" value={courseForm.old_price ?? ""} onChange={(event) => updateCourse("old_price", event.target.value === "" ? null : Number(event.target.value))} placeholder="Например: 100" /></label>
          <label>Stripe Price ID<input value={courseForm.stripe_price_id ?? ""} onChange={(event) => updateCourse("stripe_price_id", event.target.value)} placeholder="price_..." /></label>
          <label>Статус<select value={courseForm.status} onChange={(event) => updateCourse("status", event.target.value as CourseForm["status"])}><option value="available">Доступен для покупки</option><option value="coming-soon">Скоро появится</option></select></label>
        </div>
        <label>Описание {courseForm.product_type === "guide" ? "гайда" : "программы"}<textarea value={courseForm.description ?? ""} onChange={(event) => updateCourse("description", event.target.value)} rows={4} placeholder="Этот текст увидит пользователь в блоке «О программе»." /></label>
        {courseForm.product_type === "guide" && <><h3>Карусель «What’s inside»</h3><p className="admin-help">Загрузите обложки или страницы гайда в нужном порядке. На сайте центральное превью будет крупнее, а соседние — видны по краям.</p><label>Изображения карусели — по одному пути в строке<textarea value={(courseForm.guide_preview_gallery ?? []).join("\n")} onChange={(event) => updateCourse("guide_preview_gallery", event.target.value.split("\n").map((value) => value.trim()).filter(Boolean))} rows={6} placeholder="Первое изображение будет открыто по умолчанию." /></label><label className="admin-upload">+ Добавить превью в карусель<input type="file" accept="image/*" onChange={(event) => upload(event, "image_path", "guide_gallery")} /></label></>}
        <h3>Большой блок под «What’s inside»</h3>
        <label>Заголовок блока<textarea value={courseForm.sales_story_title ?? ""} onChange={(event) => updateCourse("sales_story_title", event.target.value)} rows={2} placeholder="Например: Why I started training my deep core" /></label>
        <label>Текст блока<textarea value={courseForm.sales_story_body ?? ""} onChange={(event) => updateCourse("sales_story_body", event.target.value)} rows={8} placeholder="Большой текст, который будет показан под карточками состава программы." /></label>
        <label>Заголовок фотоленты (необязательно)<input value={courseForm.sales_gallery_title ?? ""} onChange={(event) => updateCourse("sales_gallery_title", event.target.value)} placeholder="MY TRANSFORMATION — оставьте пустым, чтобы скрыть" /></label><label>Фото для ленты — по одной ссылке в строке<textarea value={(courseForm.sales_gallery ?? []).join("\n")} onChange={(event) => updateCourse("sales_gallery", event.target.value.split("\n").map((value) => value.trim()).filter(Boolean))} rows={5} placeholder="Каждое загруженное фото появится здесь отдельной строкой." /></label><label className="admin-upload">+ Добавить фото в ленту<input type="file" accept="image/*" onChange={(event) => upload(event, "image_path", "gallery")} /></label><label>Заключение после фотоленты<textarea value={courseForm.sales_story_conclusion ?? ""} onChange={(event) => updateCourse("sales_story_conclusion", event.target.value)} rows={3} placeholder="Небольшая заключительная надпись перед кнопкой возврата." /></label>
        <h3>Оборудование</h3><label>Текст кнопки списка оборудования<input value={courseForm.equipment_button_label ?? ""} onChange={(event) => updateCourse("equipment_button_label", event.target.value)} placeholder="VIEW EQUIPMENT LIST" /></label><div className="admin-file-row"><label>Фото списка оборудования<input value={courseForm.equipment_image_path ?? ""} onChange={(event) => updateCourse("equipment_image_path", event.target.value)} placeholder="Загрузите изображение кнопкой справа" /></label><label className="admin-upload">Загрузить фото оборудования<input type="file" accept="image/*" onChange={(event) => upload(event, "image_path", "equipment")} /></label></div>
        <div className="admin-file-row"><label>Обложка курса<input value={courseForm.image_path ?? ""} onChange={(event) => updateCourse("image_path", event.target.value)} placeholder="Загрузите изображение кнопкой справа" /></label><label className="admin-upload">Загрузить обложку<input type="file" accept="image/*" onChange={(event) => upload(event, "image_path", "course")} /></label></div>
        <label className="admin-check"><input type="checkbox" checked={courseForm.published} onChange={(event) => updateCourse("published", event.target.checked)} /> Опубликовать {courseForm.product_type === "guide" ? "гайд" : "курс"} на сайте</label>
        <label className="admin-check"><input type="checkbox" checked={courseForm.grants_calorie_calculator} onChange={(event) => updateCourse("grants_calorie_calculator", event.target.checked)} /> Дать покупателям этого курса доступ к калькулятору калорий</label>
        <div className="admin-actions"><button className="admin-save" disabled={saving}>{saving ? "Сохранение…" : `Сохранить ${courseForm.product_type === "guide" ? "гайд" : "курс"}`}</button>{active && <a className="admin-preview-link" href={`/courses/${encodeURIComponent(active.slug)}?preview=1`} target="_blank" rel="noreferrer">Предпросмотр страницы</a>}{active && <button type="button" className="admin-delete" onClick={deleteCourse}>Удалить {courseForm.product_type === "guide" ? "гайд" : "курс"}</button>}</div>
      </form>
      {active && <CourseCoverFocus course={active} onSaved={(saved) => { setCourses((list) => list.map((course) => course.id === saved.id ? saved : course)); setCourseForm(courseToForm(saved)); }} />}
      {active && <CourseAccessGrant course={active} />}
      {active && <CourseSectionsEditor course={active} onChange={(course_sections) => setCourses((list) => list.map((course) => course.id === active.id ? { ...course, course_sections } : course))} />}
      {active && <section className="admin-lessons admin-course-lessons"><div className="admin-section-title"><div><p className="admin-kicker">{active.product_type === "guide" ? "РАЗДЕЛЫ ГАЙДА" : "СОДЕРЖИМОЕ КУРСА"}</p><h3>{active.product_type === "guide" ? "PDF-разделы" : "Уроки"}</h3></div><button type="button" onClick={() => { setLessonForm({ ...emptyLesson, section: active.product_type === "guide" ? "Guide" : emptyLesson.section, position: active.lessons?.length ?? 0 }); setEditingLesson(null); }}>{active.product_type === "guide" ? "+ Добавить раздел" : "+ Добавить урок"}</button></div><div className="admin-lesson-area"><div className="admin-lesson-list">{(active.lessons ?? []).length === 0 && <p className="admin-empty">{active.product_type === "guide" ? "Разделов пока нет. Добавьте первый PDF справа." : "Уроков пока нет. Добавьте первый урок справа."}</p>}{(active.lessons ?? []).map((lesson) => <article key={lesson.id}><button type="button" onClick={() => { setLessonForm(lessonToForm(lesson)); setEditingLesson(lesson.id); }}><span className={lesson.published ? "published" : "draft"}>{lesson.published ? "ОПУБЛИКОВАН" : "ЧЕРНОВИК"}</span><strong>{lesson.position + 1}. {lesson.title}</strong><small>{active.product_type === "guide" ? (lesson.pdf_path ? "PDF загружен" : "PDF не загружен") : `${lesson.section} · ${lesson.kind === "text" ? "текст" : lesson.kind === "video" ? "видео" : "финиш"}`}</small></button><button type="button" aria-label={`Копировать ${lesson.title}`} onClick={() => duplicateLesson(lesson.id)}>⧉</button><button type="button" aria-label={`Удалить ${lesson.title}`} onClick={() => removeLesson(lesson.id)}>×</button></article>)}</div><div className="admin-editor-column"><form className="admin-card admin-lesson-form" onSubmit={saveLesson}><h3>{editingLesson ? (active.product_type === "guide" ? "Редактировать раздел" : "Редактировать урок") : (active.product_type === "guide" ? "Новый раздел" : "Новый урок")}</h3>{active.product_type === "guide" ? <><p className="admin-help">Каждый раздел хранит один PDF и будет показан покупателю в исходном виде.</p><label>Название раздела<input value={lessonForm.title} onChange={(event) => updateLesson("title", event.target.value)} required /></label><div className="admin-grid"><label>Порядок<input type="number" min="1" value={lessonForm.position + 1} onChange={(event) => updateLesson("position", Math.max(0, Number(event.target.value) - 1))} /></label><label>Группа (необязательно)<input value={lessonForm.section} onChange={(event) => updateLesson("section", event.target.value)} /></label></div><div className="admin-file-row"><label>PDF-файл<input value={lessonForm.pdf_path ?? ""} onChange={(event) => updateLesson("pdf_path", event.target.value)} placeholder="Загрузите PDF кнопкой справа" required /></label><label className="admin-upload">Загрузить PDF<input type="file" accept="application/pdf" onChange={(event) => upload(event, "pdf_path", "lesson")} /></label></div></> : <><p className="admin-help">Выберите тип урока: у текстового урока будет значок с линиями, у видеоурока — значок воспроизведения, у «Финиша» — флажок.</p><label>Название урока<input value={lessonForm.title} onChange={(event) => updateLesson("title", event.target.value)} required /></label><div className="admin-grid"><label>Тип урока<select value={lessonForm.kind} onChange={(event) => updateLesson("kind", event.target.value as LessonForm["kind"])}><option value="text">Текстовый урок</option><option value="video">Видеоурок</option><option value="finish">Финиш</option></select></label><label>Раздел<input value={lessonForm.section} onChange={(event) => updateLesson("section", event.target.value)} /></label><label>Порядок<input type="number" min="1" value={lessonForm.position + 1} onChange={(event) => updateLesson("position", Math.max(0, Number(event.target.value) - 1))} /></label></div><div className="admin-file-row"><label>Фоновое фото баннера недели<input value={lessonForm.image_path ?? ""} onChange={(event) => updateLesson("image_path", event.target.value)} placeholder="Загрузите чистое фото без текста" /></label><label className="admin-upload">Загрузить фото<input type="file" accept="image/*" onChange={(event) => upload(event, "image_path", "lesson")} /></label></div><p className="admin-help">Для уроков «Week 1», «Week 2» и т.д. сайт сам добавит поверх этого фото название недели и раздел. Не добавляйте текст в само изображение.</p></>}<label className="admin-check"><input type="checkbox" checked={lessonForm.published} onChange={(event) => updateLesson("published", event.target.checked)} /> Опубликовать {active.product_type === "guide" ? "раздел" : "урок"} для пользователей с доступом</label><div className="admin-actions"><button className="admin-save" disabled={saving}>{saving ? "Сохранение…" : editingLesson ? "Сохранить" : "Добавить"}</button>{editingLesson && <button type="button" onClick={() => duplicateLesson(editingLesson)} disabled={saving}>Копировать</button>} {editingLesson && <button type="button" onClick={() => { setEditingLesson(null); setLessonForm({ ...emptyLesson, position: active.lessons?.length ?? 0 }); }}>Отмена</button>}</div></form>{editingLesson && active.product_type !== "guide" && <LessonBlocksEditor lessonId={editingLesson} initialBlocks={currentLesson?.lesson_blocks ?? []} onChange={(blocks) => updateBlocks(editingLesson, blocks)} />}</div></div></section>}
      {active && <CourseDisplayOrder course={active} />}
      <SiteContentEditor initialResults={initialResults} initialReviews={initialReviews} />
    </main>
  </div>;
}
