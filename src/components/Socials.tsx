import Link from "next/link"
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Video,
} from "lucide-react"

const iconClass = "h-5 w-5"

export const Socials = () => {
  return (
    <div className="w-full bg-black p-5">
      <ul
        id="socialMedia"
        className="flex flex-wrap justify-center gap-2 py-5"
      >
        <li>
          <Link
            href="https://www.facebook.com/javabin"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="Facebook"
          >
            <Facebook className={iconClass} aria-hidden />
            <span className="sr-only">Facebook</span>
          </Link>
        </li>
        <li>
          <Link
            href="https://instagram.com/javabin/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="Instagram"
          >
            <Instagram className={iconClass} aria-hidden />
            <span className="sr-only">Instagram</span>
          </Link>
        </li>
        <li>
          <Link
            href="https://twitter.com/javaBin"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="Twitter"
          >
            <Twitter className={iconClass} aria-hidden />
            <span className="sr-only">Twitter</span>
          </Link>
        </li>
        <li>
          <Link
            href="https://linkedin.com/groups/107562"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="LinkedIn"
          >
            <Linkedin className={iconClass} aria-hidden />
            <span className="sr-only">LinkedIn</span>
          </Link>
        </li>
        <li>
          <Link
            href="https://github.com/javaBin"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="GitHub"
          >
            <Github className={iconClass} aria-hidden />
            <span className="sr-only">GitHub</span>
          </Link>
        </li>
        <li>
          <Link
            href="https://vimeo.com/javabin"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="Vimeo"
          >
            <Video className={iconClass} aria-hidden />
            <span className="sr-only">Vimeo</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
