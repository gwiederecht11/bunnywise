"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
} from "@heroui/react";
import { useState } from "react";
import { signOut } from "@/lib/actions/auth";

export function Navbar({ email }: { email: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeroNavbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="lg"
      isBordered
    >
      <NavbarContent>
        <NavbarMenuToggle className="sm:hidden" />
        <NavbarBrand>
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
            Bunnywise
            <Image
              src="/bunny-logo.webp"
              alt="Bunnywise logo"
              width={28}
              height={28}
            />
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>
          <Link
            href="/profile"
            className="text-sm text-foreground/60 transition hover:text-foreground"
          >
            {email}
          </Link>
        </NavbarItem>
        <NavbarItem>
          <form action={signOut}>
            <Button type="submit" variant="light" size="sm">
              Sign out
            </Button>
          </form>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-sm text-foreground/60"
          >
            {email}
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <form action={signOut}>
            <Button type="submit" variant="light" size="sm">
              Sign out
            </Button>
          </form>
        </NavbarMenuItem>
      </NavbarMenu>
    </HeroNavbar>
  );
}
