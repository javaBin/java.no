# Utlegg-skjema: deep-links

Skjemaet på `/utlegg` støtter URL-parametere for å forhåndsutfylle felter og styre flyten. Nyttig for lenker i e-post, Confluence o.l.

---

## Query-parametere

### Hvor skal det kostnadføres?

| Parameter     | Verdier                | Beskrivelse                                     |
| ------------- | ---------------------- | ----------------------------------------------- |
| `target`      | `javabin` / `javazone` | Velges når siden åpnes (bruker kan endre)       |
| `fixedTarget` | `javabin` / `javazone` | Setter veriden og **skjuler valget i skjemaet** |

Hvis flere parametere er satt samtidig, brukes den første i rekkefølgen `target` → `fixedTarget`. Uten parameter: Norge → `javaBin`, utland → `javaZone`.

### Person og adresse

`name`, `email`, `streetAddress`, `postalCode`, `city`, `country`

`country` godtar ISO alpha-2 (`NO`), alpha-3 (`NOR`) eller fullt navn (`Norway`).

### Internasjonal flyt

| Parameter       | Verdi                   | Effekt                 |
| --------------- | ----------------------- | ---------------------- |
| `international` | `true`                  | Starter i utlandsmodus |
| `international` | annen verdi / ikke satt | Norsk modus (default)  |

Norsk modus → norsk kontonummer (11 siffer). Utlandsmodus → IBAN/SWIFT, land-felt for bosted, og bankland-spesifikke felter (SEPA, US, other).

### Bank

`bankCountry`, `bankCountryIso2`, `bankIban`, `bankRoutingNumber`, `bankAccountNumber`, `bankAccountType` (`checking`/`savings`), `bankSwiftBic`, `bankName`, `bankAddress`, `bankAccountHolderName`

Hvis bankland settes og brukeren ikke har rørt bostedsland-feltet, synkroniseres bostedsland automatisk til banklandet.

---

## Eksempler

**Enkel norsk (default):**

```text
/utlegg
```

**JavaZone-utlegg, låst mål:**

```text
/utlegg?fixedTarget=javazone
```

**Internasjonal deltaker, svensk bank:**

```text
/utlegg?international=true&country=Sweden&bankCountry=Sweden&name=Ola%20Nordmann&email=ola@example.com
```

**Amerikansk konto:**

```text
/utlegg?international=true&country=US&bankCountryIso2=US&bankAccountType=checking
```
