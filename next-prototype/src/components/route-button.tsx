"use client";

import { useRouter } from "next/navigation";
import type { ButtonProps } from "@/components/base/buttons/button";
import { Button } from "@/components/base/buttons/button";

export const backActionClassName =
  "border-accent-400/50 text-accent-300 hover:border-accent-300 hover:bg-accent-950 active:bg-accent-900";

type RouteButtonProps = Omit<ButtonProps, "onClick"> & { href: string };

export function RouteButton({ href, children, ...props }: RouteButtonProps) {
  const router = useRouter();
  return (
    <Button onClick={() => router.push(href)} {...props}>
      {children}
    </Button>
  );
}
