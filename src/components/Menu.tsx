import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import norwegianFlag from "../../public/img/no.png";
import americanFlag from "../../public/img/us.png";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export const Menu = () => {
  const [visible, setState] = useState<boolean | undefined>(undefined);
  const router = useRouter();
  const { t } = useTranslation("common", { keyPrefix: "menu" });

  return (
    <>
      <nav
        id="navbar"
        className="navbar navbar-default navbar-custom navbar-fixed-top affix"
      >
        <div className="container-fluid">
          <div className="navbar-header">
            <button
              type="button"
              className={`navbar-toggle ${visible ? "" : "collapsed"}`}
              aria-expanded={visible}
              onClick={() => setState(visible === undefined ? true : !visible)}
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <Link className="navbar-brand" href="/">
              {"< javaBin />"}
            </Link>
            <Link className="navbar-brand" locale="en" href="/">
              <Image
                className={`flag ${
                  router.locale === "en" ? `flagselected` : ""
                }`}
                src={americanFlag}
                alt="English"
                width={16}
                height={11}
              />
            </Link>
            <Link className="navbar-brand" locale="no" href="/">
              <Image
                className={`flag ${
                  router.locale === "no" ? `flagselected` : ""
                }`}
                src={norwegianFlag}
                alt="Norsk"
                width={16}
                height={11}
              />
            </Link>
          </div>

          <div
            className={`navbar-collapse ${visible ? "" : "collapse"}`}
            aria-expanded={visible}
            id="menu-collapse"
          >
            <ul className="nav navbar-nav navbar-right">
              <li>
                <Link href="/#about">{t("about")}</Link>
              </li>

              <li>
                <Link href="/#contribute">{t("contribute")}</Link>
              </li>

              <li>
                <Link href="/#locations">{t("locations")}</Link>
              </li>

              <li>
                <Link href="/#board">{t("board")}</Link>
              </li>

              {/*<li>*/}
              {/*  <Link href="/#membership">{t("membership")}</Link>*/}
              {/*</li>*/}

              <li>
                <Link href="/#contact">{t("contact")}</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};
