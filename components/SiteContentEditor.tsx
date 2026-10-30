"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { compressImageForUpload } from "@/lib/client-image-compression";

export type AdminResult = { id: string; image_path: string; image_url?: string | null; caption: string | null; position: number; published: boolean };
export type AdminReview = { id: string; author: string; body: string; position: number; published: boolean };

const resultDraft = (position = 0) => ({ image_path: "", image_url: "", caption: "", position, published: true });
const reviewDraft = (position = 0) => ({ author: "", body: "", position, published: true });

export default function SiteContentEditor({ initialResults, initialReviews }: { initialResults: AdminResult[]; initialReviews: AdminReview[] }) {
  const [results, setResults] = useState(initialResults);
  const [reviews, setReviews] = useState(initialReviews);
  const [newResult, setNewResult] = useState(resultDraft(initialResults.length));
  const [newReview, setNewReview] = useState(reviewDraft(initialReviews.length));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Не удалось сохранить изменения.");
    return json;
  };
  const updateResult = (id: string, patch: Partial<AdminResult>) => setResults((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const updateReview = (id: string, patch: Partial<AdminReview>) => setReviews((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));

  async function upload(event: ChangeEvent<HTMLInputElement>, target: "new" | string) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setMessage("");
    try {
      const uploadFile = await compressImageForUpload(file); const form = new FormData(); form.append("file", uploadFile);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form }); const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Не удалось загрузить изображение.");
      const preview = URL.createObjectURL(uploadFile);
      if (target === "new") setNewResult((item) => ({ ...item, image_path: json.path, image_url: preview }));
      else updateResult(target, { image_path: json.path, image_url: preview });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить изображение."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function addResult(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const json = await request("/api/admin/results", "POST", newResult); const item = { ...json.result, image_url: newResult.image_url }; setResults((items) => [...items, item]); setNewResult(resultDraft(results.length + 1)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось добавить результат."); } finally { setBusy(false); }
  }
  async function saveResult(item: AdminResult) { setBusy(true); setMessage(""); try { const json = await request(`/api/admin/results/${item.id}`, "PATCH", item); updateResult(item.id, { ...json.result, image_url: item.image_url }); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить результат."); } finally { setBusy(false); } }
  async function removeResult(id: string) { if (!window.confirm("Удалить этот результат?")) return; setBusy(true); setMessage(""); try { await request(`/api/admin/results/${id}`, "DELETE"); setResults((items) => items.filter((item) => item.id !== id)); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось удалить результат."); } finally { setBusy(false); } }
  async function addReview(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); try { const json = await request("/api/admin/reviews", "POST", newReview); setReviews((items) => [...items, json.review]); setNewReview(reviewDraft(reviews.length + 1)); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось добавить отзыв."); } finally { setBusy(false); } }
  async function saveReview(item: AdminReview) { setBusy(true); setMessage(""); try { const json = await request(`/api/admin/reviews/${item.id}`, "PATCH", item); updateReview(item.id, json.review); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить отзыв."); } finally { setBusy(false); } }
  async function removeReview(id: string) { if (!window.confirm("Удалить этот отзыв?")) return; setBusy(true); setMessage(""); try { await request(`/api/admin/reviews/${id}`, "DELETE"); setReviews((items) => items.filter((item) => item.id !== id)); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось удалить отзыв."); } finally { setBusy(false); } }

  const orderedResults = [...results].sort((a, b) => a.position - b.position);
  const orderedReviews = [...reviews].sort((a, b) => a.position - b.position);
  return <section className="admin-site-content">
    <div className="admin-section-title"><div><p className="admin-kicker">ГЛАВНАЯ СТРАНИЦА</p><h2>Результаты и отзывы</h2><p className="admin-help">Здесь отображается только опубликованный контент. Изображения и отзывы можно менять, скрывать или удалять в любой момент.</p></div></div>
    {message && <p className="admin-message">{message}</p>}
    <div className="admin-site-content-grid">
      <div><h3>Фото «до / после»</h3><form className="admin-card" onSubmit={addResult}><label>Фото<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, "new")} required={!newResult.image_path} /></label>{newResult.image_url && <img className="admin-result-thumb" src={newResult.image_url} alt="Новое фото до и после" />}<label>Подпись (необязательно)<input value={newResult.caption} onChange={(event) => setNewResult({ ...newResult, caption: event.target.value })} placeholder="Например: 8 weeks" /></label><label>Порядок<input type="number" min="1" value={newResult.position + 1} onChange={(event) => setNewResult({ ...newResult, position: Math.max(0, Number(event.target.value) - 1) })} /></label><label className="admin-check"><input type="checkbox" checked={newResult.published} onChange={(event) => setNewResult({ ...newResult, published: event.target.checked })} /> Показывать на сайте</label><div className="admin-actions"><button className="admin-save" disabled={busy}>Добавить фото</button></div></form>{orderedResults.map((item) => <form key={item.id} className="admin-card" onSubmit={(event) => { event.preventDefault(); saveResult(item); }}><div className="admin-result-row">{item.image_url && <img className="admin-result-thumb" src={item.image_url} alt="Фото результата" />}<label>Заменить фото<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, item.id)} /></label></div><label>Подпись<input value={item.caption ?? ""} onChange={(event) => updateResult(item.id, { caption: event.target.value })} /></label><label>Порядок<input type="number" min="1" value={item.position + 1} onChange={(event) => updateResult(item.id, { position: Math.max(0, Number(event.target.value) - 1) })} /></label><label className="admin-check"><input type="checkbox" checked={item.published} onChange={(event) => updateResult(item.id, { published: event.target.checked })} /> Показывать на сайте</label><div className="admin-actions"><button className="admin-save" disabled={busy}>Сохранить</button><button type="button" className="admin-delete" onClick={() => removeResult(item.id)}>Удалить</button></div></form>)}</div>
      <div><h3>Отзывы</h3><form className="admin-card" onSubmit={addReview}><label>Имя автора<input value={newReview.author} onChange={(event) => setNewReview({ ...newReview, author: event.target.value })} required placeholder="Например: Angelina" /></label><label>Текст отзыва<textarea rows={5} value={newReview.body} onChange={(event) => setNewReview({ ...newReview, body: event.target.value })} required /></label><label>Порядок<input type="number" min="1" value={newReview.position + 1} onChange={(event) => setNewReview({ ...newReview, position: Math.max(0, Number(event.target.value) - 1) })} /></label><label className="admin-check"><input type="checkbox" checked={newReview.published} onChange={(event) => setNewReview({ ...newReview, published: event.target.checked })} /> Показывать на сайте</label><div className="admin-actions"><button className="admin-save" disabled={busy}>Добавить отзыв</button></div></form>{orderedReviews.map((item) => <form key={item.id} className="admin-card" onSubmit={(event) => { event.preventDefault(); saveReview(item); }}><label>Имя автора<input value={item.author} onChange={(event) => updateReview(item.id, { author: event.target.value })} /></label><label>Текст отзыва<textarea rows={5} value={item.body} onChange={(event) => updateReview(item.id, { body: event.target.value })} /></label><label>Порядок<input type="number" min="1" value={item.position + 1} onChange={(event) => updateReview(item.id, { position: Math.max(0, Number(event.target.value) - 1) })} /></label><label className="admin-check"><input type="checkbox" checked={item.published} onChange={(event) => updateReview(item.id, { published: event.target.checked })} /> Показывать на сайте</label><div className="admin-actions"><button className="admin-save" disabled={busy}>Сохранить</button><button type="button" className="admin-delete" onClick={() => removeReview(item.id)}>Удалить</button></div></form>)}</div>
    </div>
    <style>{`.admin-site-content{margin-top:36px;padding-top:28px;border-top:1px solid #e6d9cd}.admin-site-content-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.admin-site-content-grid>div>h3{margin:0 0 12px}.admin-site-content .admin-card{margin-bottom:14px}.admin-result-row{display:flex;align-items:center;gap:14px}.admin-result-thumb{width:92px;height:92px;object-fit:cover;border-radius:10px;background:#eee}.admin-site-content label{display:block;margin:10px 0}.admin-site-content input,.admin-site-content textarea{width:100%;box-sizing:border-box}.admin-site-content .admin-check{display:flex;gap:8px;align-items:center}.admin-site-content .admin-check input{width:auto}@media(max-width:760px){.admin-site-content-grid{grid-template-columns:1fr}.admin-result-row{align-items:flex-start;flex-direction:column}}`}</style>
  </section>;
}
