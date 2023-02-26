import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"
import { Socials } from "./socials"

export const Footer = () => {
  const [visible, setState] = useState<boolean | undefined>(undefined)
  const router = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "menu" })

  return (
    <footer>
      <div>
        <h4>Social</h4>
        <Socials />
      </div>
      <h4>javaBin</h4>
      <ul>
        <li>
          <Link href="http://www.teknologihuset.no" className="teknologihuset">
            Home
          </Link>
        </li>
        <li>
          <Link href="http://www.teknologihuset.no" className="teknologihuset">
            Code of Conduct
          </Link>
        </li>
      </ul>
      <h4>Our projects</h4>
      <ul className="external">
        <li>
          <Link href="http://www.javazone.no" className="javazone">
            JavaZone
          </Link>
        </li>
        <li>
          <Link href="http://www.teknologihuset.no" className="teknologihuset">
            Teknologihuset
          </Link>
        </li>
      </ul>
    </footer>
  )
}
