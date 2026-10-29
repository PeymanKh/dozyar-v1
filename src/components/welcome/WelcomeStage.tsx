"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Button } from "@/components/ui/Button";
import { DoseRing } from "./DoseRing";
import { FloatingObject } from "./FloatingObject";
import pen from "../../../public/welcome/pen-violet.png";
import vial from "../../../public/welcome/vial.png";
import tabletWhite from "../../../public/welcome/tablet-white.png";
import tabletBlush from "../../../public/welcome/tablet-blush.png";

/**
 * Welcome: a live preview of the app's Today card, surrounded by the real things
 * a person on this treatment holds every week. The card is UI, not a picture: it is what
 * they will see after onboarding.
 */
export function WelcomeStage() {
  const router = useRouter();
  const reduce = useReducedMotion();

  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.7 } },
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-surface">
      {/* Soft floor of light under the scene */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent to-bg-canvas"
      />

      {/* Scene */}
      <div className="relative z-0 mx-auto mt-[max(env(safe-area-inset-top),20px)] h-[clamp(330px,52dvh,460px)] w-full max-w-[400px]">
        <FloatingObject src={pen} width={250} rotate={-4} delay={0.15} className="-top-1 -left-10" sizes="250px" />
        <FloatingObject src={tabletBlush} width={74} rotate={-12} delay={0.45} className="top-6 right-4" />

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.3 }}
          className="absolute top-1/2 left-1/2 z-10 w-[218px] -translate-x-1/2 -translate-y-[46%]"
        >
          <TodayCard />
        </motion.div>

        <FloatingObject src={vial} width={96} rotate={0} delay={0.55} className="bottom-0 left-5 z-20" />
        <FloatingObject src={tabletWhite} width={64} rotate={8} delay={0.65} className="right-7 bottom-6 z-20" />
      </div>

      {/* Words and action */}
      <motion.main
        className="relative z-10 mt-auto flex flex-col px-6 pb-[max(env(safe-area-inset-bottom),18px)] text-center"
        initial="hidden"
        animate="show"
        transition={{ delayChildren: 0.7, staggerChildren: 0.07 }}
      >
        <motion.h1 variants={item} className="text-display-large text-text-primary">
          تو مسیر کاهش وزن،
          <br />
          <span className="text-text-brand">تنها نیستی.</span>
        </motion.h1>
        <motion.p variants={item} className="mt-2 text-body-small text-balance text-text-secondary">
          از اولین تزریق تا هر تغییر کوچیک و بزرگ،
          {/* Break after the comma where both halves fit; on very narrow phones let it balance. */}
          <br className="max-[359px]:hidden" />
          اینجا کنارتیم تا مسیرت رو راحت‌تر دنبال کنی.
        </motion.p>
        <motion.div variants={item} className="mt-7 w-full">
          <Button onClick={() => router.push("/onboarding/name")}>شروع</Button>
        </motion.div>
        <motion.p variants={item} className="mt-4 text-caption-small text-text-tertiary">
          شروع به معنی پذیرش{" "}
          <Link href="#" className="text-text-secondary">
            شرایط و قوانین
          </Link>{" "}
          است.
        </motion.p>
      </motion.main>
    </div>
  );
}

/** Preview of the Today card: next dose, last dose, injection site and how they feel. */
function TodayCard() {
  return (
    <div className="rounded-[26px] border border-white bg-white/85 p-4 shadow-[0_24px_50px_rgb(30_27_51/0.12),0_4px_12px_rgb(110_75_245/0.06)] backdrop-blur-xl">
      <div className="flex items-baseline justify-between">
        <span className="text-label text-text-primary">دوز بعدی</span>
        <span className="text-caption-small text-text-tertiary">پنج‌شنبه، ۹ صبح</span>
      </div>
      <div className="mt-3 flex justify-center">
        <DoseRing size={108} progress={0.2} days={5} hours={14} delay={0.6} />
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <Stat label="آخرین دوز" value="۲٫۵ mg" />
        <Stat label="جای تزریق" value="شکم، چپ" />
      </div>
      <div className="mt-2 rounded-[14px] bg-bg-canvas px-3 py-2.5">
        <div className="flex items-center justify-between text-caption-small">
          <span className="text-text-secondary">تهوع</span>
          <span className="font-semibold text-text-primary">خفیف</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
          <motion.div
            className="h-full w-[28%] origin-right rounded-full bg-brand"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 1, delay: 0.9 }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-bg-canvas px-3 py-2">
      <div className="text-caption-small text-text-tertiary">{label}</div>
      <div className="mt-0.5 font-display text-[15px] font-bold text-text-primary">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}
