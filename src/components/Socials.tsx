import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { useTranslation } from "next-i18next"

export const Socials = () => {
  const [visible, setState] = useState<boolean | undefined>(undefined)
  const router = useRouter()
  const { t } = useTranslation("common", { keyPrefix: "menu" })

  return (
    <>
      <div className="row">
        <div className="col-md-12 center-justified">
          <ul id="socialMedia">
            <li>
              <Link
                href="https://www.facebook.com/javabin"
                className="icon fa fa-facebook"
                target="_blank"
                rel="noreferrer"
              >
                <span>Facebook</span>
              </Link>
            </li>

            <li>
              <Link
                href="https://github.com/javaBin"
                className="icon fa fa-github"
                target="_blank"
                rel="noreferrer"
              >
                <span>GitHub</span>
              </Link>
            </li>

            <li>
              <Link
                href="https://instagram.com/javabin/"
                className="icon fa fa-instagram"
                target="_blank"
                rel="noreferrer"
              >
                <span>Instagram</span>
              </Link>
            </li>

            <li>
              <Link
                href="https://twitter.com/javaBin"
                className="icon fa fa-twitter"
                target="_blank"
                rel="noreferrer"
              >
                <span>Twitter</span>
              </Link>
            </li>

            <li>
              <Link
                href="https://vimeo.com/javabin"
                className="icon fa fa-vimeo"
                target="_blank"
                rel="noreferrer"
              >
                <span>Vimeo</span>
              </Link>
            </li>

            <li>
              <Link
                href="https://linkedin.com/groups/107562"
                className="icon fa fa-linkedin"
                target="_blank"
                rel="noreferrer"
              >
                <span>LinkedIn</span>
              </Link>
            </li>

            <li>
              <Link
                href="mailto:styret@java.no"
                className="icon fa fa-envelope"
                target=""
              >
                <span>Email</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
