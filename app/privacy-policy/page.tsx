import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/shared/ui/button";

export const dynamic = "force-static";

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1">
      <header className="container sticky top-0 z-10 flex gap-2 bg-background py-4 shadow-sm">
        <Link href="/">
          <Button
            className="h-full px-2 py-1 md:px-4 md:py-2"
            variant="outline"
          >
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Privacy Policy
        </h1>
      </header>
      <section className="container">
        <ul className="mt-4 flex flex-col gap-2 text-xl">
          <li>
            This privacy policy describes how your personal information is
            collected, used, and shared when you use our website.
          </li>
          <li>
            We collect personal information when you register for an account.
            This includes your name, email address, language preferences, and
            profile picture. We do not collect personal information when you
            using this website or using it unregistered. The only information
            this website needs is an email address, which is used for creating a
            website user for you. Other information that described above is
            provided by default by Google OAuth Service and cannot be disabled.
          </li>
          <li>
            We do not share your personal information with any third parties.
          </li>
          <li>
            Your personal information is kept confidential and is only
            accessible to authorized individuals.
          </li>
          <li>
            We take reasonable steps to protect your personal information from
            unauthorized access, use, or disclosure.
          </li>
        </ul>
      </section>
    </main>
  );
}
