"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { Screen } from "@/components/app/Screen";
import { HEIGHTS, YEARS } from "@/components/onboarding/AboutStep";
import { BigNumber } from "@/components/ui/BigNumber";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import {
  AppleIcon,
  Bell,
  BookOpen,
  Cake,
  ChevronBack,
  Database,
  Download,
  EyeOff,
  FileText,
  Height,
  MessageSquare,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash,
  User,
} from "@/components/ui/icons";
import { Ruler } from "@/components/ui/Ruler";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { Toggle } from "@/components/ui/Toggle";
import { WheelPicker } from "@/components/ui/WheelPicker";
import { resetAppData, useAppData } from "@/lib/app-store";
import { clearChat } from "@/lib/chat-store";
import { resetLearn } from "@/lib/learn-store";
import { clearMealPhotos } from "@/lib/meal-photos";
import { defaultTargets, targetsFor, type Targets } from "@/lib/nutrition";
import { clearPhotos } from "@/lib/photo-store";
import { loadDemoData } from "@/lib/demo-data";
import { toFaDigits } from "@/lib/digits";
import { isoOf } from "@/lib/jalali";
import {
  readOnboarding,
  resetOnboarding,
  setOnboarding,
  useOnboarding,
  type ReminderAnswer,
} from "@/lib/onboarding-store";
import { formatKg } from "@/lib/plan";
import { toast } from "@/lib/ui-store";

type ProfileSheet = "name" | "year" | "height" | "goal" | "targets" | "demo" | "erase" | "restart" | null;

const DEFAULT_REMINDERS: ReminderAnswer = { discreet: true, nightBefore: false, smsBackup: false, channel: "off" };

/**
 * The person and their settings, in grouped rows like iOS Settings: about me (each row
 * opens a small sheet), daily food targets, reminders (switches), help (the assistant and the
 * lessons), data (report, export, sample data, erase),
 * and starting over. The one disclaimer that matters closes the page.
 */
export function ProfileScreen() {
  const router = useRouter();
  const o = useOnboarding();
  const data = useAppData();
  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const reminders = o.reminders ?? DEFAULT_REMINDERS;
  const name = o.name?.trim();
  const close = () => setSheet(null);

  function setReminders(patch: Partial<ReminderAnswer>) {
    setOnboarding({ reminders: { ...reminders, ...patch } });
  }

  async function toggleReminders(on: boolean) {
    if (!on) return setReminders({ channel: "off" });
    if ("Notification" in window && Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      if (result === "granted") return setReminders({ channel: "push" });
    }
    setReminders({ channel: "sms" });
    toast("یادآوری‌ها با پیامک میان");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ onboarding: readOnboarding(), data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dozyar-${isoOf(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const logged = data.injections.length + data.weights.length + data.checkIns.length + data.meals.length;
  const targets = targetsFor(o, data.weights);

  return (
    <Screen pushed>
      <AppHeader title="پروفایل" back />

      <div className="flex flex-col gap-6 px-4">
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-brand-gradient font-display text-[32px] font-bold text-white shadow-hero">
            {name?.charAt(0) || "؟"}
          </span>
          <p className="mt-3 text-title-section text-text-primary">{name || "بدون نام"}</p>
        </div>

        <Group title="درباره‌ی من">
          <Row icon={<User size={18} />} label="نام" value={name || "—"} onClick={() => setSheet("name")} />
          <Row
            icon={<Cake size={18} />}
            label="سال تولد"
            value={o.about ? toFaDigits(o.about.birthYear) : "—"}
            onClick={() => setSheet("year")}
          />
          <Row
            icon={<Height size={18} />}
            label="قد"
            value={o.about ? `${toFaDigits(o.about.height)} سانتی‌متر` : "—"}
            onClick={() => setSheet("height")}
          />
          <Row
            icon={<Target size={18} />}
            label="وزن هدف"
            value={typeof o.goal === "number" ? `${formatKg(o.goal)} کیلوگرم` : "مشخص نشده"}
            onClick={() => setSheet("goal")}
          />
        </Group>

        <Group title="تغذیه">
          <Row
            icon={<AppleIcon size={18} />}
            label="هدف‌های روزانه"
            value={`پروتئین ${toFaDigits(targets.protein)} گرم`}
            onClick={() => setSheet("targets")}
          />
        </Group>

        <Group title="یادآوری‌ها">
          <ToggleRow icon={<Bell size={18} />}>
            <Toggle
              checked={reminders.channel !== "off"}
              onChange={toggleReminders}
              label="یادآوری تزریق"
              helper={reminders.channel === "sms" ? "با پیامک" : reminders.channel === "push" ? "با اعلان" : "خاموش"}
            />
          </ToggleRow>
          <ToggleRow icon={<Moon size={18} />}>
            <Toggle
              checked={reminders.nightBefore}
              onChange={(v) => setReminders({ nightBefore: v })}
              label="شب قبلش هم یادم بنداز"
            />
          </ToggleRow>
          <ToggleRow icon={<EyeOff size={18} />}>
            <Toggle
              checked={reminders.discreet}
              onChange={(v) => setReminders({ discreet: v })}
              label="متن محرمانه"
              helper="اسم دارو توی اعلان نمیاد"
            />
          </ToggleRow>
          <ToggleRow icon={<MessageSquare size={18} />}>
            <Toggle
              checked={reminders.smsBackup}
              onChange={(v) => setReminders({ smsBackup: v })}
              label="پیامک پشتیبان"
              helper="اگه اعلان نرسید، پیامک میاد"
            />
          </ToggleRow>
        </Group>

        <Group title="کمک و یادگیری">
          <Row icon={<Sparkles size={18} />} label="دستیار دوزیار" onClick={() => router.push("/chat")} />
          <Row icon={<BookOpen size={18} />} label="یادگیری" onClick={() => router.push("/learn")} />
        </Group>

        <Group title="داده‌ها">
          <Row icon={<FileText size={18} />} label="گزارش برای پزشک" onClick={() => router.push("/report")} />
          <Row icon={<Download size={18} />} label="خروجی داده‌ها" value="فایل JSON" onClick={exportData} />
          <Row
            icon={<Database size={18} />}
            label="داده‌ی نمونه"
            value="۱۰ هفته، برای نمایش"
            onClick={() => setSheet("demo")}
          />
          <Row icon={<Trash size={18} />} label="پاک کردن ثبت‌ها" danger onClick={() => setSheet("erase")} />
        </Group>

        <Card className="overflow-hidden">
          <Row icon={<RotateCcw size={18} />} label="از اول شروع کن" danger onClick={() => setSheet("restart")} />
        </Card>

        <p className="flex items-start justify-center gap-2 px-4 text-center text-caption text-balance text-text-secondary">
          دوزیار جای پزشکت رو نمی‌گیره. برای هر تصمیمی درباره‌ی دارو و دوز، با پزشکت صحبت کن.
        </p>
        <p className="-mt-4 text-center text-caption-small text-text-tertiary">
          <Database size={12} className="me-1 inline-block align-[-1px]" />
          داده‌هات فعلاً فقط روی همین گوشی ذخیره می‌شن.
          <span className="mt-0.5 block">نسخه‌ی ۰٫۱</span>
        </p>
      </div>

      <NameSheet open={sheet === "name"} onClose={close} />
      <WheelSheet
        open={sheet === "year"}
        onClose={close}
        title="سال تولد"
        items={YEARS}
        initial={o.about?.birthYear ?? 1365}
        onSave={(birthYear) => o.about && setOnboarding({ about: { ...o.about, birthYear } })}
      />
      <WheelSheet
        open={sheet === "height"}
        onClose={close}
        title="قد (سانتی‌متر)"
        items={HEIGHTS}
        initial={o.about?.height ?? 165}
        onSave={(height) => o.about && setOnboarding({ about: { ...o.about, height } })}
      />
      <GoalSheet open={sheet === "goal"} onClose={close} />
      <TargetsSheet open={sheet === "targets"} onClose={close} />
      <ConfirmSheet
        open={sheet === "demo"}
        onClose={close}
        title="داده‌ی نمونه"
        message={
          logged
            ? "۱۰ هفته تزریق، وزن و علائم و دو هفته غذای نمونه جای ثبت‌های فعلیت رو می‌گیره. فقط برای دیدن صفحه‌ها با داده‌ست."
            : "۱۰ هفته تزریق، وزن و علائم و دو هفته غذای نمونه ساخته می‌شه تا همه‌ی صفحه‌ها رو با داده ببینی."
        }
        confirmLabel="ساختن داده‌ی نمونه"
        onConfirm={() => {
          loadDemoData(readOnboarding(), isoOf(new Date()));
          toast("داده‌ی نمونه آماده‌ست");
          router.push("/today");
        }}
      />
      <ConfirmSheet
        open={sheet === "erase"}
        onClose={close}
        title="پاک کردن ثبت‌ها"
        message="همه‌ی تزریق‌ها، وزن‌ها، علائم، غذاها و عکس‌هایی که ثبت کردی پاک می‌شن و برنمی‌گردن. جواب‌های اولیه‌ات می‌مونن."
        confirmLabel="پاک کن"
        danger
        onConfirm={() => {
          resetAppData();
          clearPhotos();
          clearMealPhotos();
          toast("ثبت‌ها پاک شدن");
        }}
      />
      <ConfirmSheet
        open={sheet === "restart"}
        onClose={close}
        title="از اول شروع کن"
        message="همه‌ی جواب‌ها و ثبت‌ها از این گوشی پاک می‌شن و از صفحه‌ی اول شروع می‌کنی."
        confirmLabel="از اول"
        danger
        onConfirm={() => {
          resetAppData();
          clearPhotos();
          clearMealPhotos();
          clearChat();
          resetLearn();
          resetOnboarding();
          router.replace("/");
        }}
      />
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="px-1 pb-2 text-caption text-text-tertiary">{title}</h2>
      <Card className="divide-y divide-violet-100 overflow-hidden">{children}</Card>
    </section>
  );
}

function Glyph({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full ${
        danger ? "bg-danger-subtle text-danger" : "bg-surface-brand-subtle text-text-brand"
      }`}
    >
      {children}
    </span>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-start transition-colors active:bg-surface-brand-subtle"
    >
      <Glyph danger={danger}>{icon}</Glyph>
      <span className={`min-w-0 flex-1 text-body-strong ${danger ? "text-danger" : "text-text-primary"}`}>{label}</span>
      {value ? <span className="shrink-0 text-caption text-text-secondary">{value}</span> : null}
      {danger ? null : <ChevronBack size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />}
    </button>
  );
}

/** A Toggle row with the same leading glyph as the other rows. */
function ToggleRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center ps-4">
      <Glyph>{icon}</Glyph>
      <div className="min-w-0 flex-1 [&>button]:ps-3">{children}</div>
    </div>
  );
}

function NameSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="چی صدات کنیم؟">
      {open ? <NameForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function NameForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(useOnboarding().name ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setOnboarding({ name: name.trim() });
        onDone();
      }}
      className="flex flex-col gap-5"
    >
      <TextField autoFocus maxLength={30} value={name} onChange={(e) => setName(e.target.value)} aria-label="نام" />
      <Button type="submit" disabled={!name.trim()}>
        ذخیره
      </Button>
    </form>
  );
}

function WheelSheet({
  open,
  onClose,
  title,
  items,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { value: number; label: string }[];
  initial: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState<number | null>(null);
  const close = () => {
    setValue(null);
    onClose();
  };
  return (
    <Sheet open={open} onClose={close} title={title}>
      <div className="flex justify-center">
        <WheelPicker items={items} value={value ?? initial} onChange={setValue} label={title} className="w-32" />
      </div>
      <Button
        className="mt-6"
        onClick={() => {
          onSave(value ?? initial);
          close();
        }}
      >
        تأیید
      </Button>
    </Sheet>
  );
}

function GoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="وزن هدف">
      {open ? <GoalForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function GoalForm({ onDone }: { onDone: () => void }) {
  const o = useOnboarding();
  const { weights } = useAppData();
  const current = weights.at(-1)?.kg ?? o.weight?.today ?? 80;
  const [kg, setKg] = useState(typeof o.goal === "number" ? o.goal : Math.round(current - 5));
  const diff = Math.round((current - kg) * 10) / 10;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <BigNumber value={kg} />
        <p className="h-5 text-center text-caption text-text-secondary">
          {diff > 0 ? `${formatKg(diff)} کیلو تا هدف` : diff < 0 ? "بیشتر از وزن فعلیت" : "همین وزن فعلیت"}
        </p>
      </div>
      <Ruler min={40} max={250} value={kg} onChange={setKg} label="وزن هدف به کیلوگرم" />
      <Button
        className="mt-2"
        onClick={() => {
          setOnboarding({ goal: kg });
          toast("وزن هدف ثبت شد");
          onDone();
        }}
      >
        ذخیره
      </Button>
    </div>
  );
}

function TargetsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="هدف‌های روزانه">
      {open ? <TargetsForm onDone={onClose} /> : null}
    </Sheet>
  );
}

const TARGET_ROWS: { key: keyof Targets; label: string; unit: string; step: number; min: number; max: number }[] = [
  { key: "protein", label: "پروتئین", unit: "گرم", step: 5, min: 40, max: 180 },
  { key: "fiber", label: "فیبر", unit: "گرم", step: 1, min: 10, max: 50 },
  { key: "water", label: "آب", unit: "لیوان", step: 1, min: 4, max: 16 },
];

/**
 * Protein, fiber and water per day, each with − and +. Starts from the suggestion (from the
 * goal weight); the person sets their own with their doctor or dietitian. No calorie target.
 */
function TargetsForm({ onDone }: { onDone: () => void }) {
  const o = useOnboarding();
  const { weights } = useAppData();
  const suggested = defaultTargets(o, weights);
  const [values, setValues] = useState<Targets>(() => targetsFor(o, weights));
  const same = TARGET_ROWS.every((r) => values[r.key] === suggested[r.key]);

  return (
    <div className="flex flex-col gap-5">
      <p className="-mt-3 text-center text-caption text-balance text-text-secondary">
        پیشنهادها از روی وزن هدفت حساب شدن. با پزشک یا متخصص تغذیه‌ات تنظیمشون کن.
      </p>
      <div className="flex flex-col divide-y divide-violet-100 rounded-[20px] border border-violet-100">
        {TARGET_ROWS.map((r) => (
          <div key={r.key} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-body-strong text-text-primary">{r.label}</span>
              <span className="block text-caption text-text-secondary">
                پیشنهاد: {toFaDigits(suggested[r.key])} {r.unit}
              </span>
            </span>
            <div className="flex items-center gap-1" role="group" aria-label={r.label}>
              <button
                type="button"
                aria-label={`${r.label} کمتر`}
                disabled={values[r.key] <= r.min}
                onClick={() => setValues((v) => ({ ...v, [r.key]: Math.max(r.min, v[r.key] - r.step) }))}
                className="grid size-9 place-items-center rounded-full bg-surface-brand-subtle text-text-brand active:bg-violet-100 disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-16 text-center text-label text-text-primary" aria-live="polite">
                {toFaDigits(values[r.key])} {r.unit}
              </span>
              <button
                type="button"
                aria-label={`${r.label} بیشتر`}
                disabled={values[r.key] >= r.max}
                onClick={() => setValues((v) => ({ ...v, [r.key]: Math.min(r.max, v[r.key] + r.step) }))}
                className="grid size-9 place-items-center rounded-full bg-surface-brand-subtle text-text-brand active:bg-violet-100 disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <Button
          onClick={() => {
            setOnboarding({ nutritionTargets: same ? undefined : values });
            toast("هدف‌ها ذخیره شد");
            onDone();
          }}
        >
          ذخیره
        </Button>
        {same ? null : (
          <Button variant="plain" onClick={() => setValues(suggested)}>
            برگرد به پیشنهاد
          </Button>
        )}
      </div>
    </div>
  );
}
