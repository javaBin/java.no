import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import norwegianFlag from "../../public/img/no.png"
import englighFlag from "../../public/img/eng.png"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import { Menu as MenuIcon, X } from "lucide-react"

export const Menu = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "menu" })

  return (
    <nav
      id="navbar"
      className="fixed left-0 right-0 top-0 z-[1100] border-b border-transparent bg-[#222] px-4 py-2 transition-[background-color] lg:px-5 lg:py-3"
    >
      <div className="mx-auto flex max-w-content items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-['Roboto_Slab'] text-xl font-normal text-[#fed136] hover:text-[#fec503] lg:text-2xl"
          >
            {"< javaBin />"}
          </Link>
          <Link
            className="shrink-0"
            locale="en"
            href={router.asPath}
            scroll={false}
            aria-label="English"
          >
            <Image
              className={`rounded-sm ${router.locale === "en" ? "ring-2 ring-red-500" : ""}`}
              src={englighFlag}
              alt="English"
              width={20}
              height={14}
            />
          </Link>
          <Link
            className="shrink-0"
            locale="no"
            href={router.asPath}
            scroll={false}
            aria-label="Norsk"
          >
            <Image
              className={`rounded-sm ${router.locale === "no" ? "ring-2 ring-red-500" : ""}`}
              src={norwegianFlag}
              alt="Norsk"
              width={20}
              height={14}
            />
          </Link>
        </div>

        <div className="flex items-center">
          <div
            className={`absolute left-0 right-0 top-full border-t border-white/5 bg-[#222] lg:static lg:flex lg:border-0 lg:bg-transparent ${
              open ? "block" : "hidden"
            }`}
            id="menu-collapse"
          >
            <ul className="flex flex-col gap-0 py-2 font-['Montserrat'] text-xs uppercase tracking-wider lg:flex-row lg:gap-5 lg:py-0 lg:text-sm lg:whitespace-nowrap">
              <li>
                <Link
                  href="/#about"
                  className="block px-4 py-3 text-white hover:text-[#fed136] lg:inline-block lg:rounded lg:px-3 lg:py-2"
                onClick={() => setOpen(false)}
              >
                {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#contribute"
                  className="block px-4 py-3 text-white hover:text-[#fed136] lg:inline-block lg:rounded lg:px-3 lg:py-2"
                  onClick={() => setOpen(false)}
                >
                  {t("contribute")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#locations"
                  className="block px-4 py-3 text-white hover:text-[#fed136] lg:inline-block lg:rounded lg:px-3 lg:py-2"
                  onClick={() => setOpen(false)}
                >
                  {t("locations")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#board"
                  className="block px-4 py-3 text-white hover:text-[#fed136] lg:inline-block lg:rounded lg:px-3 lg:py-2"
                  onClick={() => setOpen(false)}
                >
                  {t("board")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="block px-4 py-3 text-white hover:text-[#fed136] lg:inline-block lg:rounded lg:px-3 lg:py-2"
                  onClick={() => setOpen(false)}
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-white hover:text-[#fed136] lg:hidden"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
