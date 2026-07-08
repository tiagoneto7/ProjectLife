import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/fire", label: "Fire" },
  { href: "/galeria", label: "Galeria" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surfacealt">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-inksoft">Navegação</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-inkmuted hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-inksoft">Com o apoio de</p>
            <div className="mt-3 flex flex-col gap-2">
              <Image src="/culligan-logo.png" alt="Culligan" width={80} height={27} className="mt-1" />
              <Image src="/corl-supply-logo.png" alt="Corl Supply" width={86} height={45} />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-inksoft">Contactos</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-inkmuted">
              <li>+351 962 032 936</li>
              <li>
                <a href="mailto:projectlife4all@gmail.com" className="hover:text-ink">
                  projectlife4all@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <SocialLinks />
            <a
              href="https://linktr.ee/project_life_"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-branddark hover:underline"
            >
              linktr.ee/project_life_
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-center text-xs text-inksoft">
          © {year} Associação Project Life
        </p>
      </div>
    </footer>
  );
}
