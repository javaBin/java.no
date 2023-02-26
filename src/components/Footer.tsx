import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import { Socials } from "./Socials"
import javabinLogo from "../../public/img/logos/javaBin-logo-horizontal-WHITE.png"
export const Footer = () => {
  const [visible, setState] = useState<boolean | undefined>(undefined)
  const router = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "footer" })

  return (
    <footer>
      <div className="footer-main">
        <div className="footer-content">
          <div className="col main">
            <strong>javabin</strong>

            <p>{t("aboutShortText")}</p>
            <Link href="/" title="javaBin (java.no)">
              <Image src={javabinLogo} width="150" alt="javabin logo"></Image>
            </Link>
          </div>
          <div className="col">
            <strong>{t("links")}</strong>
            <ul>
              <li>
                <Link href="/" className="javano">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/#locations">{t("meetups")}</Link>
              </li>

              <li>
                <Link href="https://github.com/javaBin" className="javazone">
                  {t("github")}
                </Link>
              </li>
              <li>
                <Link href="/principles" className="principles">
                  {t("codeOfConduct")}
                </Link>
              </li>
              <li>
                <Link href="/#contact">{t("contact")}</Link>
              </li>
            </ul>
          </div>
          <div className="col">
            <strong>{t("external")}</strong>
            <ul className="external">
              <li>
                <Link href="http://www.javazone.no" className="javazone">
                  JavaZone
                </Link>
              </li>
              <li>
                <Link
                  href="http://www.teknologihuset.no"
                  className="teknologihuset"
                >
                  Teknologihuset
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Socials />
      </div>
    </footer>
  )
}
