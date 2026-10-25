import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import journeyIcon from "../../public/onboarding/journey.png";

export const metadata: Metadata = { title: "پیدا نشد | دوزیار" };

/** A wrong address: same calm frame as the rest of the app, and one way back. */
export default function NotFound() {
  return (
    <main className="bg-step flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-4 grid size-[104px] place-items-center">
        <div aria-hidden="true" className="halo absolute -inset-6" />
        <Image src={journeyIcon} alt="" width={96} height={96} className="relative size-24 object-contain" />
      </div>
      <h1 className="text-title-large text-text-primary">این صفحه پیدا نشد</h1>
      <p className="mt-1.5 text-body-small text-balance text-text-secondary">
        شاید آدرسش عوض شده. از اول مسیر ادامه بده.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-[52px] w-full max-w-[20rem] items-center justify-center rounded-full bg-brand-gradient text-label-button text-text-on-brand shadow-glow"
      >
        برگشت به دوزیار
      </Link>
    </main>
  );
}
