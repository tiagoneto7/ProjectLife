"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { useCloseOnEscape } from "@/lib/useCloseOnEscape";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/fire", label: "Fire" },
  { href: "/galeria", label: "Galeria" },
];

export default function SiteHeaderClient({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  useCloseOnEscape(open, () => setOpen(false));

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="relative z-50 mx-auto flex max-w-4xl items-center justify-between bg-surface px-6 py-3">
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

        <nav className="hidden items-center gap-6 text-sm text-inkmuted sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
          {isAdmin && <AdminLogoutButton />}
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
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b border-line bg-surface px-6 py-3 text-sm text-inkmuted shadow-lg sm:hidden">
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
            {isAdmin && (
              <div className="px-2 py-2">
                <AdminLogoutButton />
              </div>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
