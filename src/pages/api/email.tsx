import MembershipInformationEmail from "@/components/emails/MembershipInformation"
import type { NextApiRequest, NextApiResponse } from "next"
import { render } from "@react-email/render"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const email = await render(
    MembershipInformationEmail({
      name: "Alexander Samsig",
      inviteLink: "https://event.checkin.no/65889/javazone-2024",
    }),
  )
  res.status(200).send(email)
}
