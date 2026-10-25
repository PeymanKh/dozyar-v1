"use client";

import { useRouter } from "next/navigation";
import { SITE_LABEL } from "./BodyMap";
import { CheckInDetails } from "./CheckInSummary";
import { Button } from "@/components/ui/Button";
import { PenInjector, WeightIcon } from "@/components/ui/icons";
import { OptionGlyph } from "@/components/ui/OptionCard";
import { Sheet } from "@/components/ui/Sheet";
import { useAppData } from "@/lib/app-store";
import { formatJalali } from "@/lib/jalali";
import { formatKg, formatMg, formatTime } from "@/lib/plan";

/** Everything logged on one day: injections, weight and the check-in. */
export function DaySheet({ date, today, onClose }: { date: string | null; today: string; onClose: () => void }) {
  return (
    <Sheet open={date !== null} onClose={onClose} title={date ? formatJalali(date) : ""}>
      {date ? <DayDetails date={date} today={today} onClose={onClose} /> : null}
    </Sheet>
  );
}

function DayDetails({ date, today, onClose }: { date: string; today: string; onClose: () => void }) {
  const router = useRouter();
  const { injections, weights, checkIns } = useAppData();
  const shots = injections.filter((i) => i.date === date);
  const weight = weights.find((w) => w.date === date);
  const checkIn = checkIns.find((c) => c.date === date);
  const future = date > today;

  return (
    <div className="flex flex-col gap-4 pb-1">
      {shots.map((s) => (
        <Row key={s.id} icon={<PenInjector size={20} />} title={`تزریق، ساعت ${formatTime(s.time)}`}>
          {[s.mg !== null ? `${formatMg(s.mg)} میلی‌گرم` : "دوز نامشخص", s.site ? SITE_LABEL[s.site] : null]
            .filter(Boolean)
            .join("، ")}
        </Row>
      ))}
      {weight ? (
        <Row icon={<WeightIcon size={20} />} title="وزن">
          {formatKg(weight.kg)} کیلوگرم
        </Row>
      ) : null}

      {checkIn ? (
        <div className="rounded-[20px] border border-violet-100 p-4">
          <CheckInDetails checkIn={checkIn} />
        </div>
      ) : (
        <p className="py-2 text-center text-body-small text-text-secondary">
          {future ? "این روز هنوز نیومده." : "برای این روز حالی ثبت نشده."}
        </p>
      )}

      {future ? null : (
        <Button
          variant={checkIn ? "secondary" : "primary"}
          onClick={() => {
            onClose();
            router.push(`/check-in?date=${date}`);
          }}
        >
          {checkIn ? "ویرایش حال این روز" : "ثبت حال این روز"}
        </Button>
      )}
    </div>
  );
}

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <OptionGlyph>{icon}</OptionGlyph>
      <div className="min-w-0 flex-1">
        <p className="text-body-strong text-text-primary">{title}</p>
        <p className="text-caption text-text-secondary">{children}</p>
      </div>
    </div>
  );
}
