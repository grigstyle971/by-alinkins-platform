"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { compressImageForUpload } from "@/lib/client-image-compression";

type BlockKind = "text" | "heading" | "callout" | "checklist" | "quote" | "label" | "image" | "centered_image" | "photo_examples" | "week_banner" | "video" | "pdf" | "separator";
export type LessonBlock = { id: string; kind: BlockKind; content: string; thumbnail_path?: string | null; file_name?: string | null; position: number };
type BlockForm = Omit<LessonBlock, "id">;

const labels: Record<BlockKind, string> = {
  text: "Текст и оформление", heading: "Старый заголовок", callout: "Старая карточка", checklist: "Старый список", quote: "Старая цитата", label: "Старая подпись",
  image: "Фото", centered_image: "Фото по центру", photo_examples: "Photo examples", week_banner: "Баннер недели", video: "Видео Mux", pdf: "PDF-файл", separator: "Старый разделитель",
};
const textKinds: BlockKind[] = ["text", "heading", "callout", "checklist", "quote", "label"];
const blank = (position = 0): BlockForm => ({ kind: "text", content: "", thumbnail_path: null, file_name: null, position });

export default function LessonBlocksEditor({ lessonId, initialBlocks, onChange }: { lessonId: string; initialBlocks: LessonBlock[]; onChange: (blocks: LessonBlock[]) => void }) {
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [form, setForm] = useState<BlockForm>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isText = textKinds.includes(form.kind);

  useEffect(() => {
    const sorted = [...initialBlocks].sort((a, b) => a.position - b.position);
    setBlocks(sorted); setForm(blank(sorted.length)); setEditingId(null); setMessage("");
  }, [lessonId]);

  const apply = (next: LessonBlock[]) => { const sorted = [...next].sort((a, b) => a.position - b.position); setBlocks(sorted); onChange(sorted); };
  const change = (patch: Partial<BlockForm>) => setForm((current) => ({ ...current, ...patch }));
  const reset = (position = blocks.length) => { setEditingId(null); setForm(blank(position)); setMessage(""); };

  function replaceSelection(before: string, after = before, fallback = "text") {
    const input = textareaRef.current; if (!input) return;
    const start = input.selectionStart; const end = input.selectionEnd;
    const selected = form.content.slice(start, end) || fallback;
    const content = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`;
    change({ content });
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  function makeList() {
    const input = textareaRef.current; if (!input) return;
    const start = input.selectionStart; const end = input.selectionEnd;
    const selected = form.content.slice(start, end) || "First item\nSecond item";
    const list = selected.split("\n").map((line) => `- ${line.replace(/^[-*]\s*/, "")}`).join("\n");
    change({ content: `${form.content.slice(0, start)}${list}${form.content.slice(end)}` });
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start, start + list.length); });
  }

  async function request(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json(); if (!response.ok) throw new Error(json.error || "Не удалось сохранить блок."); return json;
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, target: "content" | "thumbnail") {
    const file = event.target.files?.[0]; if (!file) return;
    setSaving(true); setMessage("Загрузка файла…");
    try {
      const data = new FormData(); data.append("file", await compressImageForUpload(file));
      const response = await fetch("/api/admin/upload", { method: "POST", body: data }); const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Не удалось загрузить файл.");
      if (target === "thumbnail") change({ thumbnail_path: json.path });
      else change({ content: json.path, file_name: form.kind === "pdf" ? json.name : form.file_name });
      setMessage(target === "thumbnail" ? "Превью загружено. Сохраните блок." : "Файл загружен. Сохраните блок.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить файл."); }
    finally { setSaving(false); event.target.value = ""; }
  }
  async function syncPreviews() {
    setSaving(true); setMessage("Заполняем превью во всех неделях курса…");
    try {
      const result = await request(`/api/admin/lessons/${lessonId}/sync-previews`, "POST");
      setMessage(`Готово. Обновлено превью: ${result.updated}.${result.conflicts ? ` Пропущено блоков: для одного видео в исходной неделе сохранены разные обложки. Количество: ${result.conflicts}.` : ""} Обновите страницу, чтобы увидеть изменения в редакторе.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось заполнить превью."); }
    finally { setSaving(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const result = await request(editingId ? `/api/admin/blocks/${editingId}` : `/api/admin/lessons/${lessonId}/blocks`, editingId ? "PATCH" : "POST", form);
      const saved = result.block as LessonBlock;
      apply(editingId ? blocks.map((block) => block.id === saved.id ? saved : block) : [...blocks.map((block) => block.position >= saved.position ? { ...block, position: block.position + 1 } : block), saved]);
      reset(blocks.length); setMessage("Блок сохранён.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить блок."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Удалить этот блок?")) return;
    setSaving(true); setMessage("");
    try { await request(`/api/admin/blocks/${id}`, "DELETE"); apply(blocks.filter((block) => block.id !== id)); if (editingId === id) reset(Math.max(0, blocks.length - 1)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось удалить блок."); }
    finally { setSaving(false); }
  }
  const edit = (block: LessonBlock) => { setEditingId(block.id); setForm({ kind: block.kind, content: block.content, thumbnail_path: block.thumbnail_path ?? null, file_name: block.file_name ?? null, position: block.position }); setMessage(""); };

  return <section className="admin-blocks"><div className="admin-blocks-title"><div><p className="admin-kicker">СОДЕРЖИМОЕ УРОКА</p><h4>Блоки урока</h4><p>Один текстовый блок теперь поддерживает заголовки, списки, рамки, цитаты и линии.</p></div></div>
    {blocks.length > 0 && <div className="admin-block-list">{blocks.map((block) => <article key={block.id}><button type="button" onClick={() => edit(block)}><span>{block.position + 1}</span><strong>{labels[block.kind]}</strong><small>{textKinds.includes(block.kind) ? block.content.slice(0, 80) || "Текст" : block.file_name || block.content}</small></button><button type="button" aria-label="Удалить блок" onClick={() => remove(block.id)}>×</button></article>)}</div>}
    <div className="admin-card"><div className="admin-actions"><button type="button" disabled={saving} onClick={syncPreviews}>Заполнить превью во всех неделях</button></div><p className="admin-help">Откройте первую неделю и сохраните нужные превью. Кнопка скопирует обложки из открытой недели в остальные уроки текущего курса по совпадению видео, заменив старые превью. Видео без превью в исходной неделе и количество повторений не изменятся.</p></div>
    <form className="admin-card admin-block-form" onSubmit={save}><h4>{editingId ? "Редактировать блок" : "Добавить блок"}</h4><div className="admin-grid"><label>Тип блока<select value={form.kind} onChange={(event) => change({ kind: event.target.value as BlockKind })}><option value="text">Текст и оформление</option><option value="image">Фото</option><option value="centered_image">Фото по центру</option><option value="photo_examples">Photo examples</option><option value="week_banner">Баннер недели</option><option value="video">Видео Mux</option><option value="pdf">PDF-файл</option>{editingId && ["heading", "callout", "checklist", "quote", "label", "separator"].map((kind) => <option value={kind} key={kind}>{labels[kind as BlockKind]}</option>)}</select></label><label>Порядок<input type="number" min="1" value={form.position + 1} onChange={(event) => change({ position: Math.max(0, Number(event.target.value) - 1) })} /></label></div>
      {isText && <><div className="admin-rich-toolbar" aria-label="Оформление текста"><button type="button" onClick={() => replaceSelection("**")}><strong>B</strong></button><button type="button" onClick={() => replaceSelection("## ", "", "Heading")}>H</button><button type="button" onClick={() => replaceSelection(":::title\n", "\n:::", "Larger text")}>Title</button><button type="button" onClick={() => replaceSelection(":::label\n", "\n:::", "9-WEEK PROGRAM")}>Label</button><button type="button" onClick={() => replaceSelection(":::cycle\n", "\n:::", "Training Cycle 2")}>Cycle</button><button type="button" onClick={makeList}>• List</button><button type="button" onClick={() => replaceSelection(":::box\n", "\n:::", "Important text")}>▣ Frame</button><button type="button" onClick={() => replaceSelection("> ", "", "Quote")}>❝ Quote</button><button type="button" onClick={() => replaceSelection("\n---\n", "", "")}>— Line</button></div><p className="admin-rich-help">«Cycle» добавляет плашку Training Cycle. Один Enter - новая строка, пустая строка - новый абзац с отступом.</p></>}
      {form.kind === "separator" ? <p className="admin-help">Старый формат разделительной линии. Для новых текстов используйте кнопку «— Line».</p> : isText ? <label>Текст<textarea ref={textareaRef} rows={12} value={form.content} onChange={(event) => change({ content: event.target.value })} placeholder={"Напишите текст…\n\nВыделите строку и нажмите H для заголовка.\nДля списка используйте кнопку • List."} required /></label> : form.kind === "video" ? <><label>Playback ID Mux<input value={form.content} onChange={(event) => change({ content: event.target.value.trim().replace(/^mux:\/\//i, "") })} placeholder="Например: 9H1oNukL9nxa100pL1GMrIy5HifsF60002t6i8kVXtcAA4" required /></label><div className="admin-file-row"><label>Превью видео (необязательно)<input value={form.thumbnail_path ?? ""} readOnly placeholder="Загрузите выбранный кадр" /></label><label className="admin-upload">Загрузить превью<input type="file" accept="image/*" onChange={(event) => upload(event, "thumbnail")} /></label></div>{form.thumbnail_path && <div className="admin-actions"><button type="button" disabled={saving} onClick={() => { change({ thumbnail_path: null }); setMessage("Превью убрано. Сохраните блок, чтобы применить изменение."); }}>Удалить превью</button></div>}</> : form.kind === "pdf" ? <><div className="admin-file-row"><label>Путь к PDF<input value={form.content} onChange={(event) => change({ content: event.target.value })} placeholder="Загрузите PDF кнопкой справа" required /></label><label className="admin-upload">Загрузить PDF<input type="file" accept="application/pdf" onChange={(event) => upload(event, "content")} /></label></div><label>Название файла для ученика<input value={form.file_name ?? ""} onChange={(event) => change({ file_name: event.target.value })} placeholder="Например: cardio.pdf" required /></label></> : <><div className="admin-file-row"><label>{form.kind === "week_banner" ? "Фоновое фото баннера" : "Путь к фото"}<input value={form.content} onChange={(event) => change({ content: event.target.value })} placeholder="Загрузите чистое фото без текста" required /></label><label className="admin-upload">Загрузить фото<input type="file" accept="image/*" onChange={(event) => upload(event, "content")} /></label></div>{form.kind === "week_banner" && <p className="admin-help">Сайт сам добавит поверх фото название урока и раздел.</p>}</>}
      {message && <p className="admin-block-message">{message}</p>}<div className="admin-actions"><button className="admin-save" disabled={saving}>{saving ? "Сохранение…" : editingId ? "Сохранить блок" : "Добавить блок"}</button>{editingId && <button type="button" onClick={() => reset(form.position + 1)}>Добавить после этого</button>}{editingId && <button type="button" onClick={() => reset()}>Отмена</button>}</div></form>
  </section>;
}
