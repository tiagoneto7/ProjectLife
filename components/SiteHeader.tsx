import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/fire", label: "Fire" },
  { href: "/galeria", label: "Galeria" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Project Life — Início">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
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

        <nav className="flex gap-6 text-sm text-inkmuted">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
