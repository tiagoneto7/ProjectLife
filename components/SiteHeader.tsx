"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/fire", label: "Fire" },
  { href: "/galeria", label: "Galeria" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Project Life — Início"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full border border-line bg-white sm:h-20 sm:w-20">
            <Image
              src="/pl-logo.jpg"
              alt="Project Life"
              width={62}
              height={62}
              className="h-[68%] w-[68%] object-contain invert"
            />
          </span>
          <span className="hidden text-[13px] uppercase tracking-[0.1em] text-inksoft sm:inline">
            Associação Project Life
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm text-inkmuted sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-ink sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            {open ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-3 text-sm text-inkmuted sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 hover:bg-surfacealt hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
