"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>;
}

export default function CourseOverviewHeader({ hasCalculatorAccess = false, calculatorHref = "/calorie-calculator" }: { hasCalculatorAccess?: boolean; calculatorHref?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return <header className="course-overview-header">
    <button className={`course-overview-menu-toggle ${menuOpen ? "open" : ""}`} type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><i/><i/><i/></button>
    {menuOpen && <nav className="course-overview-menu"><Link href="/my-programs" onClick={() => setMenuOpen(false)}>My programs</Link><Link href={calculatorHref} className={hasCalculatorAccess ? undefined : "locked-menu-link"} onClick={() => setMenuOpen(false)}>Calorie calculator</Link><Link href="/profile" onClick={() => setMenuOpen(false)}>Edit profile</Link><form action="/auth/signout" method="POST"><button type="submit">Sign out</button></form></nav>}
    <button className="course-overview-home" type="button" aria-label="Refresh this page" onClick={() => router.refresh()}><HomeIcon /></button>
  </header>;
}
