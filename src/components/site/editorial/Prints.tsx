import Image from "next/image";
import type { CSSProperties } from "react";
import type { Memory } from "@/lib/ui/memories";
import { Grain } from "./kit";

type Slot = { x: number; y: number; r: number; w: string };

/** Hand-placed table layout (desktop): percent positions + rotation. */
const SLOTS: Slot[] = [
  { x: 4, y: 8, r: -7, w: "clamp(250px,27vw,420px)" },
  { x: 37, y: 2, r: 4, w: "clamp(230px,24vw,380px)" },
  { x: 66, y: 12, r: -3, w: "clamp(220px,23vw,360px)" },
  { x: 16, y: 50, r: 5, w: "clamp(210px,21vw,330px)" },
  { x: 47, y: 46, r: -5, w: "clamp(240px,25vw,390px)" },
  { x: 74, y: 52, r: 8, w: "clamp(200px,20vw,310px)" },
];

const DEVELOPING = [
  { caption: "Next session", note: "Developing…" },
  { caption: "Your first event", note: "Not printed yet" },
  { caption: "The next hackathon", note: "Developing…" },
  { caption: "Team night", note: "Waiting for the photo" },
];

function Tape({ side = "c" }: { side?: "c" | "l" | "r" }) {
  const position = side === "l" ? "left-[-14px] top-[10px] -rotate-[38deg]" : side === "r" ? "right-[-14px] top-[10px] rotate-[38deg]" : "left-1/2 -top-3 -translate-x-1/2 -rotate-[3deg]";
  return <span aria-hidden="true" className={`absolute z-[2] h-[26px] w-[92px] bg-[rgb(236_232_220_/_.55)] shadow-[0_1px_2px_rgb(0_0_0_/_.2)] backdrop-blur-[1px] [mask-image:linear-gradient(90deg,transparent_0,#000_6%,#000_94%,transparent_100%)] ${position}`} />;
}

export function PrintPhoto({ memory, index, slot }: { memory?: Memory; index: number; slot: Slot }) {
  const developing = DEVELOPING[index % DEVELOPING.length];
  const number = String(index + 1).padStart(2, "0");
  const style = { "--x": `${slot.x}%`, "--y": `${slot.y}%`, "--w": slot.w, transform: `rotate(${slot.r}deg)` } as CSSProperties;
  return (
    <figure
      data-print
      data-rotate={slot.r}
      style={style}
      className="relative m-0 w-full select-none bg-[#efebe2] p-[clamp(8px,.8vw,12px)] pb-[clamp(46px,4.4vw,64px)] text-[#16191b] shadow-[0_18px_40px_rgb(0_0_0_/_.45)] will-change-transform min-[900px]:absolute min-[900px]:top-[var(--y)] min-[900px]:left-[var(--x)] min-[900px]:w-[var(--w)] group-data-[print-ready=true]/table:cursor-grab group-data-[print-ready=true]/table:active:cursor-grabbing"
    >
      <Tape side={index % 3 === 0 ? "c" : index % 3 === 1 ? "l" : "r"} />
      <div className="relative aspect-[4/3] overflow-hidden bg-[#101417]">
        {memory ? (
          <>
            <Image src={memory.src} alt={memory.alt} fill draggable={false} sizes="(max-width: 900px) 46vw, 26vw" className="object-cover [filter:saturate(.85)_contrast(1.05)_sepia(.08)]" unoptimized={memory.src.startsWith("/manus-storage")} />
            <Grain className="opacity-25" />
          </>
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_40%_35%,rgb(82_232_209_/_.22),transparent_60%),linear-gradient(160deg,#1a2328,#0b0f12)]">
            <span className="text-center text-[.66rem] uppercase tracking-[.2em] text-white/55">{developing.note}</span>
            <Grain className="opacity-30" />
          </span>
        )}
      </div>
      <figcaption className="absolute right-[clamp(10px,1vw,14px)] bottom-[clamp(12px,1.3vw,20px)] left-[clamp(10px,1vw,14px)] flex items-end justify-between gap-3">
        <span className="text-[clamp(.8rem,1.05vw,1rem)] leading-[1.1] tracking-[-.04em]">{memory ? memory.caption : developing.caption}</span>
        <span className="shrink-0 text-[.58rem] uppercase tracking-[.14em] text-[#16191b]/55">{memory?.when || `No. ${number}`}</span>
      </figcaption>
    </figure>
  );
}

/**
 * The Memories table: real prints first, then "developing" prints so the
 * composition stays full without inventing photographs.
 */
export function MemoriesTable({ memories }: { memories: Memory[] }) {
  const count = Math.max(SLOTS.length, memories.length);
  const slots = Array.from({ length: count }, (_, index) => SLOTS[index % SLOTS.length]);
  return (
    <div data-print-table className="group/table relative grid grid-cols-2 gap-x-4 gap-y-8 px-1 max-[520px]:gap-x-3 min-[900px]:block min-[900px]:h-[clamp(720px,62vw,980px)]">
      {slots.map((slot, index) => (
        <PrintPhoto key={index} index={index} memory={memories[index]} slot={slot} />
      ))}
    </div>
  );
}
