import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/heroui";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg text-center">
          <Image
            src="/bunny-logo.png"
            alt="Bunnywise logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
            Bunnywise
          </h1>
          <p className="mb-8 text-lg text-foreground/60">
            Split expenses with friends and groups. Track who owes what and
            settle up with simplified payments.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button color="primary" size="lg">
                Get started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="bordered" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-16">
        <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-lg">
              +
            </div>
            <h3 className="mb-1 font-semibold">Add expenses</h3>
            <p className="text-sm text-foreground/60">
              Log expenses and split them equally, by exact amounts, or by
              percentage.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-lg">
              =
            </div>
            <h3 className="mb-1 font-semibold">Track balances</h3>
            <p className="text-sm text-foreground/60">
              See who owes whom at a glance with automatic balance
              calculations.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-lg">
              &#10003;
            </div>
            <h3 className="mb-1 font-semibold">Settle up</h3>
            <p className="text-sm text-foreground/60">
              Debts are simplified into the fewest possible payments between
              people.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-foreground/10 px-4 py-6 text-center text-xs text-foreground/40">
        Bunnywise
      </footer>
    </div>
  );
}
