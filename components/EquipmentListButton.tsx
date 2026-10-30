"use client";

import { useEffect, useState } from "react";

export default function EquipmentListButton({ image, label = "VIEW EQUIPMENT LIST" }: { image: string; label?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return <><button className="equipment-list-button" type="button" onClick={() => setOpen(true)}>{label || "VIEW EQUIPMENT LIST"}</button>{open && <div className="equipment-list-modal" role="dialog" aria-modal="true" aria-label="Equipment list" onClick={() => setOpen(false)}><div className="equipment-list-modal-card" onClick={(event) => event.stopPropagation()}><button type="button" className="equipment-list-close" aria-label="Close equipment list" onClick={() => setOpen(false)}>×</button><img src={image} alt="Equipment list" /></div></div>}</>;
}
