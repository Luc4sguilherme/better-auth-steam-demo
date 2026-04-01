"use client"

import { ComponentProps } from "react"
import { toast } from "sonner"
import { ActionButton } from "../ui/action-button"

export function BetterAuthActionButton({
  action,
  successMessage,
  ...props
}: Omit<ComponentProps<typeof ActionButton>, "action"> & {
  action: () => Promise<{ error: null | { message?: string } }>
  successMessage?: string
}) {
  return (
    <ActionButton
      {...props}
      action={async () => {
        try {
          const res = await action()

          if (res.error) {
            const errorMessage = res.error.message || "Action failed"
            toast.error(errorMessage)
            return { error: true, message: errorMessage }
          } else {
            return { error: false, message: successMessage }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
          toast.error(errorMessage)
          return { error: true, message: errorMessage }
        }
      }}
    />
  )
}
