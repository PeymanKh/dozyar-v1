"use client";

import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { OptionCard } from "@/components/ui/OptionCard";
import { Sheet } from "@/components/ui/Sheet";
import { closeSheet, openSheet } from "@/lib/ui-store";
import journalIcon from "../../../../public/app/journal.png";
import tapeIcon from "../../../../public/app/tape.png";
import penIcon from "../../../../public/onboarding/medication.png";
import scaleIcon from "../../../../public/onboarding/weight.png";

function Glass({ src }: { src: StaticImageData }) {
  return <Image src={src} alt="" width={52} height={52} className="size-13 object-contain" />;
}

/** The «+» in the tab bar: everything that can be logged, one tap away. */
export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <Sheet open={open} onClose={onClose} title="چی رو ثبت کنیم؟">
      <div className="flex flex-col gap-3 pb-1">
        <OptionCard
          opens
          icon={<Glass src={penIcon} />}
          title="تزریق"
          line="زمان، دوز و جای تزریق"
          onChoose={() => openSheet("injection")}
        />
        <OptionCard
          opens
          icon={<Glass src={journalIcon} />}
          title="حال و علائم"
          line="حال امروزت و علائمی که داری"
          onChoose={() => {
            closeSheet();
            router.push("/check-in");
          }}
        />
        <OptionCard
          opens
          icon={<Glass src={scaleIcon} />}
          title="وزن"
          line="وزن امروز یا یه روز دیگه"
          onChoose={() => openSheet("weight")}
        />
        <OptionCard
          opens
          icon={<Glass src={tapeIcon} />}
          title="دور کمر"
          line="با متر، هم‌سطح ناف"
          onChoose={() => openSheet("waist")}
        />
      </div>
    </Sheet>
  );
}
