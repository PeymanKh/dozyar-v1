import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/app/learn/LessonScreen";
import { findLesson, LESSONS } from "@/lib/learn";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[id]">): Promise<Metadata> {
  const lesson = findLesson((await params).id);
  return { title: lesson ? `${lesson.title} | دوزیار` : "یادگیری | دوزیار" };
}

export default async function Page({ params }: PageProps<"/learn/[id]">) {
  const { id } = await params;
  if (!findLesson(id)) notFound();
  return <LessonScreen id={id} />;
}
