import type { ReactNode } from "react";

function Bubble({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "incoming" | "outgoing";
}) {
  const isIncoming = variant === "incoming";
  return (
    <div className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
      <div
        className={`relative max-w-[78%] px-3.5 py-2 text-[14px] leading-[1.3] tracking-[-0.015em] ${
          isIncoming
            ? "rounded-[19px] rounded-bl-[5px] bg-[#E9E9EB] text-[#111111] after:absolute after:bottom-0 after:left-[-5px] after:h-3 after:w-3 after:rounded-br-full after:bg-[#E9E9EB]"
            : "rounded-[19px] rounded-br-[5px] bg-[#0A84FF] text-white after:absolute after:bottom-0 after:right-[-5px] after:h-3 after:w-3 after:rounded-bl-full after:bg-[#0A84FF]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto w-[300px] rounded-[3rem] bg-[#0f0f10] p-[9px] shadow-[0_40px_120px_rgba(0,0,0,0.75)] ring-1 ring-white/10 ${className}`}
    >
      <div className="absolute left-1/2 top-[18px] z-30 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#0f0f10]" />

      <div
        className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[2.35rem] bg-white"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        <div className="relative flex h-[42px] items-center justify-between bg-[#F7F7F7] px-6 pt-2 text-[12px] font-semibold text-black">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              aria-hidden
              className="text-black"
            >
              <path
                d="M1.5 4.2C5.1 1.1 10.9 1.1 14.5 4.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M4.2 7C6.3 5.3 9.7 5.3 11.8 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M7.9 9.8H8.1"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="relative h-2.5 w-5 rounded-[3px] border border-[#34C759] bg-[#34C759] after:absolute after:right-[-3px] after:top-1/2 after:h-1.5 after:w-0.5 after:-translate-y-1/2 after:rounded-r-sm after:bg-[#34C759]" />
          </div>
        </div>

        <div className="border-b border-[#D1D1D6] bg-[#F7F7F7] px-3 pb-2">
          <div className="grid grid-cols-[44px_1fr_44px] items-end">
            <div className="pb-1 text-[#007AFF]">
              <svg
                width="12"
                height="20"
                viewBox="0 0 10 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M9 1L2 8L9 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8a54b] to-[#b06f1c] text-sm font-semibold text-black shadow-inner">
                I
              </div>
              <span className="mt-1 text-[11px] font-medium text-black">
                Iris
              </span>
            </div>
            <div />
          </div>
        </div>

        <div className="flex-1 space-y-2 bg-white px-3 pb-4 pt-5">
          <p className="pb-2 text-center text-[11px] font-semibold text-[#8E8E93]">
            Today 9:41 AM
          </p>

          <Bubble variant="incoming">
            Riverside owner call just wrapped. Pour moved to Thursday 6am.
          </Bubble>
          <Bubble variant="incoming">
            Mike wasn&apos;t on the call. I drafted the recap and flagged rebar.
          </Bubble>

          <div className="h-1" />

          <Bubble variant="outgoing">send it and cc Jen</Bubble>
          <Bubble variant="incoming">
            Done. Mike has it. Jen got the same note.
          </Bubble>

          <Bubble variant="outgoing">what else changed</Bubble>
          <Bubble variant="incoming">
            Delivery slid to 10. Inspection still 9. Owner wants the deck
            revision today.
          </Bubble>
        </div>

        <div className="border-t border-[#D1D1D6] bg-white px-2 pb-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9E9EB] text-[#8E8E93]">
              +
            </div>
            <div className="flex h-8 flex-1 items-center rounded-full border border-[#C7C7CC] bg-white px-3 text-[14px] text-[#C7C7CC]">
              iMessage
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-xs font-semibold text-white">
              ↑
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlainBubble({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "incoming" | "outgoing";
}) {
  const isIncoming = variant === "incoming";
  return (
    <div className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-[15px] leading-snug tracking-[-0.01em] ${
          isIncoming
            ? "rounded-[19px] rounded-bl-[5px] bg-[#26262a] text-[#f4f1ea]"
            : "rounded-[19px] rounded-br-[5px] bg-[#0A84FF] text-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

const SCENE: Array<{
  variant: "incoming" | "outgoing";
  text: ReactNode;
  meta?: string;
}> = [
  {
    variant: "incoming",
    text: "Riverside owner call just wrapped. Pour moved to Thursday 6am.",
  },
  {
    variant: "incoming",
    text: "Mike wasn’t on the call. I drafted the recap and flagged rebar.",
  },
  { variant: "outgoing", text: "send it and cc Jen" },
  {
    variant: "incoming",
    text: "Done. Mike has it. Jen got the same note.",
    meta: "Sent after you approved it.",
  },
  { variant: "outgoing", text: "what else changed" },
  {
    variant: "incoming",
    text: "Delivery slid to 10. Inspection still 9. Owner wants the deck revision today.",
  },
];

export function TextScene({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6 ${className}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
      }}
    >
      <div className="space-y-2.5">
        {SCENE.map((m, i) => (
          <div key={i}>
            <PlainBubble variant={m.variant}>{m.text}</PlainBubble>
            {m.meta ? (
              <p className="mt-1 pl-1 text-[11px] text-white/40">{m.meta}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
