export type BoardMemberType = {
  name: string
  title:
    | "Chairman"
    | "Deputy Chairman"
    | "Financial Controller"
    | "Board Member"
  img?: string
}

const members: BoardMemberType[] = [
  {
    name: "Anders Karlsen",
    title: "Chairman",
    img: "anders_karlsen.jpg",
  },
  {
    name: "Hilde Rødseth",
    title: "Deputy Chairman",
    img: "hilde_rødseth.jpg",
  },
  {
    name: "Rafael Winterhalter",
    title: "Financial Controller",
    img: "rafael_winterhalter.jpg",
  },
  {
    name: "Sandra Lekve",
    title: "Board Member",
    img: "sandra_lekve.jpg",
  },
  {
    name: "Børge Nese",
    title: "Board Member",
    img: "børge_nese.jpg",
  },
  {
    name: "Alexander Amiri",
    title: "Board Member",
    img: "alexander_amiri.jpg",
  },
  {
    name: "Ole Berg",
    title: "Board Member",
  },
  {
    name: "Chris Searle",
    title: "Board Member",
    img: "chris_searle.jpg",
  },
  {
    name: "Janniche Lange",
    title: "Board Member",
    img: "janniche_lange.jpg",
  },
  {
    name: "Vytautas Zaleckas",
    title: "Board Member",
    img: "vytautas_zaleckas.jpg",
  },
]

export default members
