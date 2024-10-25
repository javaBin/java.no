import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"

const MembershipVerificationComponent = () => {
  const [email, setEmail] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [userCaptcha, setUserCaptcha] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setCaptcha(result)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userCaptcha.toLowerCase() !== captcha.toLowerCase()) {
      setError("'CAPTCHA is incorrect. Please try again.'")
      generateCaptcha()
      setUserCaptcha("")
      return
    }
    // Here you would typically send a request to your backend to verify the email
    // For this example, we'll just simulate a successful verification
    setIsVerified(true)
    setError("")
  }

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Verification Successful
          </h2>
          <p className="mt-2 text-gray-600">
            Your membership has been verified. Welcome to the Norwegian Java
            User Group!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-4xl font-bold">
          Norwegian Java User Group
        </h1>
        <h2 className="mb-4 text-2xl font-semibold">Membership Verification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="captcha">CAPTCHA</Label>
            <div className="mb-2 flex items-center space-x-2">
              <div className="select-none rounded bg-gray-200 p-2 font-mono text-xl">
                {captcha}
              </div>
              <Button type="button" variant="outline" onClick={generateCaptcha}>
                Refresh
              </Button>
            </div>
            <Input
              type="text"
              id="captcha"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              placeholder="Enter the CAPTCHA"
              required
            />
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full">
            Verify Membership
          </Button>
        </form>
      </div>
    </div>
  )
}

export default MembershipVerificationComponent

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
  }
}
