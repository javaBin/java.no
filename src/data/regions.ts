export type Region = {
  name: string
  meetupName: string
}

/** Derives duke image path from region name (e.g. "Tromsø" → /img/duke/tromso.png). */
export function getRegionDukePath(regionName: string): string {
  const filename = regionName
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
  return `/img/duke/${filename}.png`
}

const regions: Region[] = [
  {
    name: "Oslo",
    meetupName: "javaBin",
  },
  {
    name: "Bergen",
    meetupName: "javaBin-Bergen",
  },
  {
    name: "Trondheim",
    meetupName: "javaBin-Trondheim",
  },
  {
    name: "Sørlandet",
    meetupName: "javaBin-Sorlandet",
  },
  {
    name: "Stavanger",
    meetupName: "javaBin-Stavanger",
  },
  {
    name: "Vestfold",
    meetupName: "javaBin-Vestfold",
  },
  {
    name: "Sogn",
    meetupName: "javaBin-Sogn",
  },
  {
    name: "Tromsø",
    meetupName: "javaBin-Tromso",
  },
]

export default regions
