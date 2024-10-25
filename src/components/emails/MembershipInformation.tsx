import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import * as React from "react"

interface VercelInviteUserEmailProps {
  name?: string
  userImage?: string
  invitedByUsername?: string
  teamImage?: string
  inviteLink?: string
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : ""

export const VercelInviteUserEmail = ({
  name,
  userImage,
  invitedByUsername,
  teamImage,
  inviteLink,
}: VercelInviteUserEmailProps) => {
  const previewText = `Join ${invitedByUsername} on Vercel`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/img/javabin.jpg`}
                width="300"
                height="168"
                alt="JavaBin"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Din <strong>medlemsstatus</strong> hos <strong>javaBin</strong>
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hei {name},
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Vi har mottatt en forespørsel, om å sjekke om du har medlemskap
              hos oss i <strong>javaBin</strong>
            </Text>
            <Section>
              <Row>
                <Column align="right">
                  <Img
                    className="rounded-full"
                    src={userImage}
                    width="64"
                    height="64"
                  />
                </Column>
                <Column align="center">
                  <Img
                    src={`${baseUrl}/static/vercel-arrow.png`}
                    width="12"
                    height="9"
                    alt="invited you to"
                  />
                </Column>
                <Column align="left">
                  <Img
                    className="rounded-full"
                    src={teamImage}
                    width="64"
                    height="64"
                  />
                </Column>
              </Row>
            </Section>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-[#fed136] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Kjøp medlemsskap
              </Button>
            </Section>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Dette e-post var beregnet for{" "}
              <span className="text-black">{name}</span>. Om du ikke har sendt
              noen forespørsel til oss, og er bekymret for personvernet ditt,
              vennligst svar på denne e-posten for å komme i kontakt med oss.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

VercelInviteUserEmail.PreviewProps = {
  name: "alanturing",
  userImage: `${baseUrl}/static/vercel-user.png`,
  invitedByUsername: "Alan",
  invitedByEmail: "alan.turing@example.com",
  teamName: "Enigma",
  teamImage: `${baseUrl}/static/vercel-team.png`,
  inviteLink: "https://vercel.com/teams/invite/foo",
  inviteFromIp: "204.13.186.218",
  inviteFromLocation: "São Paulo, Brazil",
} as VercelInviteUserEmailProps

export default VercelInviteUserEmail
