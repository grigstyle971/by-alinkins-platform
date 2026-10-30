import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import "./preview.css";

export const dynamic = "force-dynamic";

type PreviewArea = "sales" | "cabinet" | "site";
type PreviewDevice = "phone" | "tablet" | "desktop";

const areaLabels: Record<PreviewArea, string> = {
  sales: "Продающая страница",
  cabinet: "Личный кабинет",
  site: "Весь сайт",
};

const deviceLabels: Record<PreviewDevice, string> = {
  phone: "Телефон",
  tablet: "Планшет",
  desktop: "ПК",
};

export default async function AdminPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; area?: string; device?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const area = params.area as PreviewArea;
  const device = params.device as PreviewDevice;

  if (!params.slug || !["sales", "cabinet", "site"].includes(area) || !["phone", "tablet", "desktop"].includes(device)) notFound();

  const source = area === "sales"
    ? `/courses/${encodeURIComponent(params.slug)}?preview=1`
    : area === "cabinet"
      ? `/my-programs/${encodeURIComponent(params.slug)}?preview=1`
      : "/home?preview=1";

  return <main className="admin-device-preview"><header><div><p>ПРЕДПРОСМОТР</p><h1>{areaLabels[area]} · {deviceLabels[device]}</h1></div><a href="/admin">← Вернуться в админку</a></header><div className={`admin-device-frame admin-device-${device}`}><iframe title={`${areaLabels[area]} — ${deviceLabels[device]}`} src={source} /></div></main>;
}
