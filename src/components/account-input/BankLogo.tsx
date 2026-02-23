import Image from "next/image"
import React from "react"
import { PiggyBank } from "lucide-react"

export function BankLogo({
  bank,
}: {
  bank: { identifier: string; name: string } | null
}) {
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    setImageError(false)
  }, [bank?.identifier])

  if (!bank || imageError) {
    return (
      <PiggyBank
        size="1rem"
        className="absolute left-2 top-1/2 -translate-y-1/2 transform"
      />
    )
  }

  return (
    <Image
      src={`/bank/${bank.identifier}.png`}
      alt={`${bank.name} logo`}
      width={30}
      height={30}
      className="object-contain"
      onError={() => setImageError(true)}
    />
  )
}
