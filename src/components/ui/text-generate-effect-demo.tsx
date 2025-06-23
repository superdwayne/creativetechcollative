"use client";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const words = `Creative Technology Collective is a community for pioneers at the intersection of creativity and technology. We experiment, prototype, and build new ways to engage audiences through emerging tech—whether it's AI, AR, interactive media, or beyond.`;

export function TextGenerateEffectDemo() {
  return <TextGenerateEffect duration={2} filter={false} words={words} />;
}