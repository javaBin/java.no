import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import norwegianFlag from "../../public/img/no.png";
import americanFlag from "../../public/img/us.png";

export const Menu = () => {
  const [visible, setState] = useState<boolean | undefined>(undefined);
  const [lang, setLang] = useState<"en" | "no">("no");
  const flagselected = `flagselected`;
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
            <Link className="navbar-brand" href="#en">
              <Image
                className={`flag ${lang === "en" ? flagselected : ""}`}
                src={americanFlag}
                alt="English"
                width={16}
                height={11}
              />
            </Link>
            <Link className="navbar-brand" href="#no">
              <Image
                className={`flag ${lang === "no" ? flagselected : ""}`}
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
                <Link href="/#about">
                  Om javaBin <span className="sr-only">(current)</span>
                </Link>
              </li>

              <li>
                <Link href="/#contribute">
                  Vil du være med? <span className="sr-only">(current)</span>
                </Link>
              </li>

              <li>
                <Link href="/#locations">
                  Regioner <span className="sr-only">(current)</span>
                </Link>
              </li>

              <li>
                <Link href="/#board">
                  Styret <span className="sr-only">(current)</span>
                </Link>
              </li>

              <li>
                <Link href="/#membership">
                  Medlemskap <span className="sr-only">(current)</span>
                </Link>
              </li>

              <li>
                <Link href="/#contact">
                  Kontakt <span className="sr-only">(current)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};
