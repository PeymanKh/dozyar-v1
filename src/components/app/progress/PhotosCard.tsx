"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, ShieldCheck, Trash } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { formatJalali, isoOf } from "@/lib/jalali";
import { addPhoto, deletePhoto, restorePhoto, usePhotos, type PhotoWithUrl } from "@/lib/photo-store";
import { haptic, toast } from "@/lib/ui-store";
import cameraIcon from "../../../../public/app/camera.png";

/**
 * Optional progress photos. They never leave the phone (said plainly on the card). With two
 * or more, «مقایسه» puts the first and the latest side by side under a slider.
 */
export function PhotosCard() {
  const photos = usePhotos();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<PhotoWithUrl | null>(null);
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await addPhoto(file, isoOf(new Date()));
      haptic(12);
      toast("عکس اضافه شد");
    } catch {
      toast("عکس ذخیره نشد؛ دوباره امتحان کن");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const add = (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={busy}
      className="grid aspect-[3/4] w-24 shrink-0 place-items-center rounded-[16px] border-[1.5px] border-dashed border-violet-300 bg-surface-brand-subtle text-text-brand transition-colors active:bg-violet-100 disabled:opacity-50"
    >
      <span className="flex flex-col items-center gap-1 text-caption">
        <Plus size={22} />
        عکس جدید
      </span>
    </button>
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <Image src={cameraIcon} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <h3 className="text-body-strong text-text-primary">عکس‌های پیشرفت</h3>
          <p className="flex items-center gap-1 text-caption text-text-secondary">
            <ShieldCheck size={14} className="shrink-0 text-violet-400" />
            فقط روی همین گوشی می‌مونه
          </p>
        </div>
        {photos && photos.length > 1 ? (
          <button
            type="button"
            onClick={() => setCompare(true)}
            className="h-10 shrink-0 rounded-full bg-surface-brand-subtle px-4 text-label text-text-brand active:bg-violet-100"
          >
            مقایسه
          </button>
        ) : null}
      </div>

      <div className="-mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {add}
        {[...(photos ?? [])].reverse().map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(p)}
            aria-label={`عکس ${formatJalali(p.date)}`}
            className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-[16px] bg-violet-100"
          >
            {/* Object URLs from the device; next/image can't optimize them */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/60 to-transparent px-2 pt-4 pb-1.5 text-center text-caption-small text-white">
              {formatJalali(p.date, false)}
            </span>
          </button>
        ))}
      </div>
      {photos && !photos.length ? (
        <p className="mt-3 text-caption text-pretty text-text-secondary">
          هر چند هفته یه عکس با همون لباس و همون نور بگیر؛ تغییرها توی عکس بهتر از عدد دیده می‌شن.
        </p>
      ) : null}

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? formatJalali(open.date) : ""}>
        {open ? (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt={`عکس ${formatJalali(open.date)}`}
              className="max-h-[55dvh] w-full rounded-[20px] object-contain"
            />
            <Button
              variant="plain"
              className="!text-danger"
              onClick={async () => {
                const photo = open;
                setOpen(null);
                await deletePhoto(photo.id);
                toast("عکس حذف شد", { label: "برگردون", run: () => restorePhoto(photo) });
              }}
            >
              <Trash size={18} />
              حذف این عکس
            </Button>
          </div>
        ) : null}
      </Sheet>

      {photos && photos.length > 1 ? (
        <CompareSheet open={compare} onClose={() => setCompare(false)} before={photos[0]} after={photos.at(-1)!} />
      ) : null}
    </Card>
  );
}

/** The first and the latest photo on top of each other; the slider reveals one over the other. */
function CompareSheet({
  open,
  onClose,
  before,
  after,
}: {
  open: boolean;
  onClose: () => void;
  before: PhotoWithUrl;
  after: PhotoWithUrl;
}) {
  const [split, setSplit] = useState(50);
  return (
    <Sheet open={open} onClose={onClose} title="قبل و بعد">
      <div className="flex flex-col gap-4">
        <div
          className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[20px] bg-violet-100"
          dir="ltr"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before.url} alt="" className="absolute inset-0 size-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={after.url}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          />
          <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
          <span
            dir="rtl"
            className="absolute top-2 left-2 rounded-full bg-ink-900/55 px-2.5 py-1 text-caption-small text-white"
          >
            {formatJalali(before.date, false)}
          </span>
          <span
            dir="rtl"
            className="absolute top-2 right-2 rounded-full bg-ink-900/55 px-2.5 py-1 text-caption-small text-white"
          >
            {formatJalali(after.date, false)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="مقایسه‌ی قبل و بعد"
          dir="ltr"
          className="w-full accent-[var(--color-brand)]"
        />
      </div>
    </Sheet>
  );
}
