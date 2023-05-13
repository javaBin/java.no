export type BoardMemberType = {
  name: string
  title:
    | "Chairman"
    | "Deputy Chairman"
    | "Financial Controller"
    | "Board Member"
  img: string
}

const members: BoardMemberType[] = [
  {
    name: "Dervis Mansuroglu",
    title: "Chairman",
    img: "dervis_mansuroglu.jpg",
  },
  {
    name: "Kristian Berg",
    title: "Deputy Chairman",
    img: "kristian_berg.jpg",
  },
  {
    name: "Rafael Winterhalter",
    title: "Financial Controller",
    img: "rafael_winterhalter.jpg",
  },
  {
    name: "Alexander Samsig",
    title: "Board Member",
    img: "alexander_samsig.jpg",
  },
  {
    name: "Karl Syvert Løland",
    title: "Board Member",
    img: "karl_syvert_loland.jpg",
  },
  {
    name: "Patricia Zemer",
    title: "Board Member",
    img: "patricia_zemer.jpg",
  },
  {
    name: "Alexander Amiri",
    title: "Board Member",
    img: "alexander_amiri.jpg",
  },
  {
    name: "Sverre Moe",
    title: "Board Member",
    img: "sverre_moe.jpg",
  },
  {
    name: "Dorna Misaghian",
    title: "Board Member",
    img: "dorna_misaghian.jpg",
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
]

export default members
