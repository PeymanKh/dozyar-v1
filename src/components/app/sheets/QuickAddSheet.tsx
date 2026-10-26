"use client";

import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sheet } from "@/components/ui/Sheet";
import { setWater, readAppData, waterOn } from "@/lib/app-store";
import { toFaDigits } from "@/lib/digits";
import { isoOf } from "@/lib/jalali";
import { closeSheet, haptic, openMeal, openSheet, pickMealPhoto, toast } from "@/lib/ui-store";
import cameraIcon from "../../../../public/app/camera.png";
import dropletIcon from "../../../../public/app/droplet.png";
import journalIcon from "../../../../public/app/journal.png";
import tapeIcon from "../../../../public/app/tape.png";
import penIcon from "../../../../public/onboarding/medication.png";
import scaleIcon from "../../../../public/onboarding/weight.png";

type Action = { key: string; icon: StaticImageData; title: string; line: string; run: () => void };

/**
 * The «+» beside the tab bar: everything that can be logged, one tap away, as a grid so the
 * six read at a glance. The food photo comes first (the most frequent log); a glass of water is
 * logged right here, with undo.
 */
export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  function addWater() {
    const today = isoOf(new Date());
    const before = waterOn(readAppData().water, today);
    setWater(today, before + 1);
    haptic(10);
    closeSheet();
    toast(`یه لیوان آب ثبت شد (${toFaDigits(before + 1)} لیوان امروز)`, {
      label: "برگردون",
      run: () => setWater(today, before),
    });
  }

  const actions: Action[] = [
    {
      key: "food",
      icon: cameraIcon,
      title: "عکس غذا",
      line: "پروتئین و فیبرش رو حساب می‌کنیم",
      run: () => {
        // Inside the tap, so the browser lets the camera open.
        closeSheet();
        pickMealPhoto();
      },
    },
    { key: "injection", icon: penIcon, title: "تزریق", line: "زمان، دوز و جا", run: () => openSheet("injection") },
    {
      key: "checkin",
      icon: journalIcon,
      title: "حال و علائم",
      line: "حال امروز و علائمت",
      run: () => {
        closeSheet();
        router.push("/check-in");
      },
    },
    { key: "weight", icon: scaleIcon, title: "وزن", line: "امروز یا یه روز دیگه", run: () => openSheet("weight") },
    { key: "water", icon: dropletIcon, title: "یه لیوان آب", line: "همین الان ثبت می‌شه", run: addWater },
    { key: "waist", icon: tapeIcon, title: "دور کمر", line: "با متر، هم‌سطح ناف", run: () => openSheet("waist") },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="چی رو ثبت کنیم؟">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <motion.button
            key={a.key}
            type="button"
            onClick={a.run}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={`flex min-h-[124px] flex-col items-start gap-2 rounded-[22px] border p-4 text-start transition-colors ${
              a.key === "food"
                ? "border-border-focus bg-surface-brand-subtle active:bg-violet-100"
                : "border-violet-200 bg-surface active:bg-surface-brand-subtle"
            }`}
          >
            <Image src={a.icon} alt="" width={44} height={44} className="size-11 object-contain" />
            <span>
              <span className="block text-body-strong text-text-primary">{a.title}</span>
              <span className="block text-caption-small text-text-secondary">{a.line}</span>
            </span>
          </motion.button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => openMeal({ kind: "manual" })}
        className="mt-2 h-12 w-full text-label text-text-brand active:opacity-70"
      >
        ثبت غذا بدون عکس
      </button>
    </Sheet>
  );
}
