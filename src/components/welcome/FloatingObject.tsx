"use client";

import Image, { type StaticImageData } from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * A real object (pen, vial, tablet) placed around the welcome scene.
 * It materializes (blur and scale settle together) and can be picked up: it follows the
 * finger with some resistance and springs back home when released.
 */
export function FloatingObject({
  src,
  width,
  rotate = 0,
  delay = 0,
  className = "",
  sizes,
}: {
  src: StaticImageData;
  width: number;
  rotate?: number;
  delay?: number;
  className?: string;
  sizes?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`absolute touch-none select-none ${className}`}
      style={{ width, rotate }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.12, y: 18, filter: "blur(14px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", bounce: 0, duration: 1.1, delay }}
      drag
      dragSnapToOrigin
      dragElastic={0.35}
      dragTransition={{ bounceStiffness: 320, bounceDamping: 24 }}
      whileDrag={{ scale: 1.06 }}
    >
      <Image
        src={src}
        alt=""
        sizes={sizes ?? `${width}px`}
        loading="eager"
        draggable={false}
        className="pointer-events-none h-auto w-full drop-shadow-[0_18px_22px_rgb(30_27_51/0.16)]"
      />
    </motion.div>
  );
}
