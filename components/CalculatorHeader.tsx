"use client";

import Link from "next/link";
import { useState } from "react";

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>;
}

export default function CalculatorHeader({ backHref }: { backHref: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="calculator-header">
    <button className="calculator-menu-toggle" type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><i/><i/><i/></button>
    <span>Calorie calculator</span>
    <Link className="calculator-home" href={backHref} aria-label="Return to program"><HomeIcon /></Link>
    {menuOpen && <nav className="calculator-account-menu"><Link href="/my-programs" onClick={() => setMenuOpen(false)}>My programs</Link><Link href="/calorie-calculator" onClick={() => setMenuOpen(false)}>Calorie calculator</Link><Link href="/profile" onClick={() => setMenuOpen(false)}>Edit profile</Link><form action="/auth/signout" method="POST"><button type="submit">Sign out</button></form></nav>}
  </header>;
}
