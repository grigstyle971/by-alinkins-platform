import { redirect } from "next/navigation";

/** Instagram-safe public link to the transformation results section. */
export default function ResultsShortcutPage() {
  redirect("/home?section=transformation-results");
}
