import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "next-i18next"
import { Socials } from "./Socials"
import javabinLogo from "../../public/img/logos/javaBin-logo-horizontal-WHITE.png"

export const Footer = () => {
  const { t } = useTranslation("common", { keyPrefix: "footer" })

  return (
    <footer className="bg-hero bg-cover bg-center text-white">
      <div className="flex flex-wrap justify-center gap-4 bg-[hsl(0_57%_31%_/_74%)] p-5 max-[900px]:justify-start">
        <div className="min-w-[200px] px-5 py-2.5 max-[900px]:basis-full">
          <strong className="mb-5 block font-montserrat text-xl uppercase text-jz-yellow">
            javabin
          </strong>
          <p className="max-w-[500px]">{t("aboutShortText")}</p>
          <Link href="/" title="javaBin (java.no)">
            <Image src={javabinLogo} width="150" alt="javabin logo"></Image>
          </Link>
        </div>
        <div className="min-w-[200px] px-5 py-2.5">
          <strong className="mb-5 block font-montserrat text-xl uppercase text-jz-yellow">
            {t("links")}
          </strong>
          <ul className="[&_li]:pb-0.5">
            <li>
              <Link href="/" className="text-white hover:text-jz-yellow">
                {t("home")}
              </Link>
            </li>
            <li>
              <Link href="/#locations" className="text-white hover:text-jz-yellow">
                {t("meetups")}
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/javaBin"
                className="text-white hover:text-jz-yellow"
              >
                {t("github")}
              </Link>
            </li>
            <li>
              <Link
                href="/principles"
                className="text-white hover:text-jz-yellow"
              >
                {t("codeOfConduct")}
              </Link>
            </li>
            <li>
              <Link
                href="/gir-tilbake"
                className="text-white hover:text-jz-yellow"
              >
                {t("girTilbake")}
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="text-white hover:text-jz-yellow">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="min-w-[200px] px-5 py-2.5">
          <strong className="mb-5 block font-montserrat text-xl uppercase text-jz-yellow">
            {t("external")}
          </strong>
          <ul className="[&_li]:pb-0.5">
            <li>
              <Link
                href="http://www.javazone.no"
                className="text-white hover:text-jz-yellow"
              >
                JavaZone
              </Link>
            </li>
            <li>
              <Link
                href="http://www.teknologihuset.no"
                className="text-white hover:text-jz-yellow"
              >
                Teknologihuset
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <Socials />
    </footer>
  )
}
