export type Region = {
  region: string
  description: string
  meetupName: string
}

const regions: Region[] = [
  {
    region: "Oslo",
    meetupName: "javaBin",
    description: "javaBin Oslo arrangerer fagkvelder i Oslo",
  },
  {
    region: "Bergen",
    meetupName: "javaBin-Bergen",
    description:
      "javaBin Bergen er regionslaget som dekker Bergen og områdene rundt.",
  },
  {
    region: "Trondheim",
    meetupName: "javaBin-Trondheim",
    description:
      "javaBin Trondheim er regionslaget som dekker Trondheim og områdene rundt.",
  },
  {
    region: "Sørlandet",
    meetupName: "javaBin-Sorlandet",
    description:
      "javaBin Sørlandet er regionslaget som dekker hovedsaklig Kristiansand, Grimstad og Arendal.",
  },
  {
    region: "Stavanger",
    meetupName: "javaBin-Stavanger",
    description:
      "javaBin Stavanger er regionslaget som dekker Stavanger og områdene rundt.",
  },
  {
    region: "Vestfold",
    meetupName: "javaBin-Vestfold",
    description:
      "javaBin Vestfold er regionslaget som dekker hovedsaklig Larvik, Sandefjord og Tønsberg.",
  },
  {
    region: "Sogn",
    meetupName: "javaBin-Sogn",
    description:
      "javaBin Sogn er regionslaget som dekker Sogn og områdene rundt.",
  },
  {
    region: "Tromsø",
    meetupName: "javaBin-Tromso",
    description:
      "javaBin Tromsø er regionslaget som dekker Tromsø og områdene rundt.",
  },
]

export default regions
