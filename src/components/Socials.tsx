import Link from "next/link"
import {
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiVimeo,
  SiX,
} from "@icons-pack/react-simple-icons"

const iconClass = "h-5 w-5"

/** LinkedIn icon (Simple Icons path; not exported by @icons-pack/react-simple-icons). */
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export const Socials = () => {
  return (
    <div className="w-full bg-black">
      <ul id="socialMedia" className="flex flex-wrap justify-center gap-2 py-5">
        <li>
          <Link
            href="https://www.facebook.com/javabin"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-white transition-colors hover:bg-[#fed136]"
            target="_blank"
            rel="noreferrer"
            title="Facebook"
          >
            <SiFacebook className={iconClass} aria-hidden />
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
            <SiInstagram className={iconClass} aria-hidden />
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
            <SiX className={iconClass} aria-hidden />
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
            <LinkedInIcon className={iconClass} />
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
            <SiGithub className={iconClass} aria-hidden />
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
            <SiVimeo className={iconClass} aria-hidden />
            <span className="sr-only">Vimeo</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
