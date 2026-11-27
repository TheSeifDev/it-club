"use client";
import { useEffect, useState } from "react";

/** Inline hero tile that cycles through each track code in its own colour. */
export function CodeCycle({ items }: { items: Array<{ code: string; color: string }> }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 1500);
    return () => window.clearInterval(timer);
  }, [items.length]);
  return (
    <span className="absolute inset-0 transition-[background-color] duration-700" style={{ backgroundColor: items[index]?.color }}>
      {items.map((item, itemIndex) => (
        <span
          key={item.code}
          className="absolute inset-0 grid place-items-center text-[.62em] leading-none tracking-[-.06em] text-[var(--site-night)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none"
          style={{ transform: `translateY(${itemIndex === index ? 0 : itemIndex < index ? -110 : 110}%)`, opacity: itemIndex === index ? 1 : 0 }}
        >
          {item.code}
        </span>
      ))}
    </span>
  );
}
