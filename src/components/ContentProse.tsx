import { cn } from "@/lib/utils"

const contentProseClasses =
  "[&_p]:mb-2 [&_p]:text-justify [&_ul]:my-2 [&_ul]:pl-8 [&_ul]:pb-1 [&_ul]:list-[circle] [&_ol]:my-2 [&_ol]:pb-1 [&_li]:my-0 [&_li]:text-[14px] [&_li]:leading-[1.75] [&_li::marker]:text-gray-600 [&_a]:no-underline [&_a]:hover:underline [&_h1]:mt-4 [&_h1]:mb-1 [&_h1]:text-jz-salmon [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-jz-salmon [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-jz-salmon [&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-jz-salmon [&_h5]:mt-4 [&_h5]:mb-1 [&_h5]:text-jz-salmon [&_h6]:mt-4 [&_h6]:mb-1 [&_h6]:text-jz-salmon"

type ContentProseProps = {
  children: React.ReactNode
  className?: string
}

export const ContentProse = ({ children, className }: ContentProseProps) => (
  <div className={cn(contentProseClasses, className)}>{children}</div>
)
