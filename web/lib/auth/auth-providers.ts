import { SteamIcon } from "@/components/auth/auth-icons";
import { ComponentProps, ElementType } from "react";

export const SUPPORTED_AUTH_PROVIDERS = ["steam"] as const;
export type SupportedAuthProvider = (typeof SUPPORTED_AUTH_PROVIDERS)[number];

export const SUPPORTED_AUTH_PROVIDER_DETAILS: Record<
  SupportedAuthProvider,
  { name: string; Icon: ElementType<ComponentProps<"svg">> }
> = {
  steam: { name: "Steam", Icon: SteamIcon },
};
