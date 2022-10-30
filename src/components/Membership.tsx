import Link from "next/link";

export const Membership = () => (
  <section id="membership">
    <div className="container">
      <div className="row">
        <div className="col-md-12 text-center">
          <h1 className="section-heading">Medlemskap</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-md-8 col-md-offset-2 center-justified">
          <p>
            javaBin er åpent for alle som vil være medlem. Ved å være et betalt
            medlem av javaBin så støtter du Java-miljøet i Norge og gjør det
            mulig for oss å arrangere medlemsmøter og JavaZone.
          </p>

          <h3 className="text-muted">Hva koster et medlemskap?</h3>

          <p>
            Medlemskapet i javaBin er inkludert i prisen på JavaZone-billetten
            din, så dersom du har kjøpt deg billett til JavaZone eller har fått
            dette av arbeidsgiver, så er du allerede medlem av javaBin for ett
            år. Dersom du ikke skal på JavaZone kan du kjøpe et enkeltstående
            medlemskap. Pris for dette er 600,- for et 12-måneders medlemskap.
            Aktive studenter med studentbevis kan søke om gratis medlemskap.
            Dersom du ønsker studentmedlemskap kan du sende en epost til{" "}
            <Link href="mailto:medlemskap@java.no">medlemskap@java.no</Link>.
          </p>

          <h3 className="text-muted">Gyldighet</h3>
          <p>
            Medlemskap gjelder fra dagen det kjøpes til samme dato neste år.
            Dette gjelder både JavaZone-medfølgende medlemskap og vanlige
            medlemskap.
          </p>
          <h3 className="text-muted">Kjøp medlemskap</h3>
          <p>
            Besøk{" "}
            <Link href="https://www.checkin.no/event/22303/javazone-2020?action=invite&category=16883&pass=tdTFsnARc6kn8QdKmTaz">
              våres webshop
            </Link>{" "}
            for å kjøpe JavaZone billett eller enkeltstående medlemskap.
          </p>
        </div>
      </div>
    </div>
  </section>
);
