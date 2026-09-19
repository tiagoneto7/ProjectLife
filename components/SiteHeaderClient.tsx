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
    <header className="relative border-b border-line bg-[#FCFCFB]">
      {/* Fundo quase branco (entre o branco da página e o #F7F7F5 dos cartões). */}
      {/* Mais largo (e sem quebras) porque no /admin o header leva também o ano e o modo de edição. */}
      <div className="relative z-50 mx-auto flex max-w-6xl items-center justify-between gap-6 bg-[#FCFCFB] px-6 py-3">
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
          <span className="hidden whitespace-nowrap text-[13px] uppercase tracking-[0.1em] text-inksoft sm:inline">
            Associação Project Life
          </span>
        </Link>

        <nav className="hidden flex-none items-center gap-6 text-sm text-inkmuted sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-ink">
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <span className="h-4 w-px bg-line" aria-hidden="true" />
              <AdminLogoutButton />
              {/* O /admin injeta aqui o seletor de edição (portal em AdminPainel). */}
              <span id="admin-edicao-slot" className="-ml-2 empty:hidden" />
            </>
          )}
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
        <div
          className="fixed inset-0 z-40 bg-black/20 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sempre no DOM (escondido quando fechado) para o /admin poder injetar
          aqui os seus controlos — ver o slot no fim. */}
      <nav
        aria-hidden={!open}
        className={
          "absolute inset-x-0 top-full z-50 flex-col gap-1 border-b border-line bg-surface px-6 py-3 text-sm text-inkmuted shadow-lg sm:hidden " +
          // Classe (e não o atributo hidden) porque o "flex" ganharia ao [hidden].
          (open ? "flex" : "hidden")
        }
      >
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
          <div className="flex items-center justify-between gap-4 px-2 py-2">
            <AdminLogoutButton />
            {/* O /admin injeta aqui o ano e o modo de edição. */}
            <span id="admin-edicao-slot-mobile" className="flex items-center gap-4 empty:hidden" />
          </div>
        )}
      </nav>
    </header>
  );
}
