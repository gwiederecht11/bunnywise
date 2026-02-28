"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export function Navbar({ email }: { email: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-foreground/10 bg-background">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            Bunnywise
          </Link>
          <Link
            href="/groups/new"
            className="hidden text-sm text-foreground/60 transition hover:text-foreground sm:block"
          >
            New Group
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/profile"
            className="text-sm text-foreground/60 transition hover:text-foreground"
          >
            {email}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-foreground/60 transition hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-1"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-foreground/10 px-4 py-3 sm:hidden">
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="mb-3 block text-sm text-foreground/60 transition hover:text-foreground"
          >
            {email}
          </Link>
          <div className="flex flex-col gap-2">
            <Link
              href="/groups/new"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-foreground/60 transition hover:text-foreground"
            >
              New Group
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-foreground/60 transition hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
