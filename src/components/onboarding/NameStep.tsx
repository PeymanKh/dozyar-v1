"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { StepScreen } from "./StepScreen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { progressFor } from "@/lib/onboarding-flow";
import { setOnboarding, useOnboarding } from "@/lib/onboarding-store";
import nameIcon from "../../../public/onboarding/name.png";

const MAX_LENGTH = 20;

/** Screen 1 (required; product decision, the spec had it optional). Used for greetings like «سلام مریم»; a nickname is just as good. */
export function NameStep() {
  const router = useRouter();
  const saved = useOnboarding().name;
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = draft ?? saved ?? "";
  const filled = name.trim().length > 0;

  // The keyboard opens on arrival, including when this hidden page is shown again.
  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  function next(value: string) {
    setOnboarding({ name: value });
    router.push("/onboarding/journey");
  }

  return (
    <StepScreen
      progress={progressFor(1)}
      backHref="/"
      icon={nameIcon}
      title="چی صدات کنیم؟"
      description="اسم یا اسم مستعار، هرچی دوست داری. فقط خودت می‌بینیش."
      action={
        <Button disabled={!filled} onClick={() => next(name.trim())}>
          ادامه
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (filled) next(name.trim());
        }}
      >
        <TextField
          ref={inputRef}
          name="nickname"
          autoComplete="given-name"
          enterKeyHint="next"
          maxLength={MAX_LENGTH}
          aria-label="اسم یا اسم مستعار"
          placeholder="مثلاً مریم"
          value={name}
          onChange={(e) => setDraft(e.target.value)}
          className="text-center"
        />
      </form>
    </StepScreen>
  );
}
