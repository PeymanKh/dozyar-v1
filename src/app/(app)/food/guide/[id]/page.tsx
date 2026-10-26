import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideScreen } from "@/components/app/food/GuideScreen";
import { findGuide, GUIDES } from "@/lib/food-guide";

// Device data only: see the note in (app)/layout.tsx.
export const instant = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/food/guide/[id]">): Promise<Metadata> {
  const guide = findGuide((await params).id);
  return { title: guide ? `${guide.title}: چی بخورم؟ | دوزیار` : "راهنمای غذا | دوزیار" };
}

export default async function Page({ params }: PageProps<"/food/guide/[id]">) {
  const { id } = await params;
  if (!findGuide(id)) notFound();
  return <GuideScreen id={id} />;
}
