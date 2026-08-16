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
        className={`max-w-[85%] px-2.5 py-1.5 text-[12px] leading-snug ${
          isIncoming
            ? "rounded-2xl rounded-bl-md bg-[#E9E9EB] text-[#111111]"
            : "rounded-2xl rounded-br-md bg-[#0A84FF] text-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative h-[620px] w-[300px] rounded-[42px] bg-[#1c1c1e] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.22)] ring-1 ring-black/25">
        <div className="absolute left-1/2 top-[18px] z-20 h-[24px] w-[86px] -translate-x-1/2 rounded-full bg-[#1c1c1e]" />

        <div
          className="flex h-full flex-col overflow-hidden rounded-[30px] bg-white"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-3 text-[11px] font-semibold text-black">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg width="14" height="10" viewBox="0 0 16 12" fill="none" aria-hidden>
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
              <span className="h-2 w-4 rounded-sm bg-[#34C759]" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center border-b border-[#E5E5EA] px-4 pb-2">
            <div className="flex w-full items-end">
              <div className="w-8 text-[#007AFF]">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
                  <path
                    d="M9 1L2 8L9 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2d5a4a] to-[#18392f] text-[11px] font-semibold text-white">
                  I
                </div>
                <span className="mt-0.5 text-[10px] font-medium text-black">Iris</span>
              </div>
              <div className="w-8" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden px-4 py-3">
            <p className="pb-1 text-center text-[10px] font-semibold text-[#8E8E93]">
              Today 9:41 AM
            </p>
            <Bubble variant="incoming">
              Riverside owner call just wrapped. Pour moved to Thursday 6am.
            </Bubble>
            <Bubble variant="incoming">
              Mike wasn&apos;t on the call. I drafted the recap and flagged rebar.
            </Bubble>
            <Bubble variant="outgoing">send it and cc Jen</Bubble>
            <Bubble variant="incoming">Done. Mike has it. Jen got the same note.</Bubble>
            <Bubble variant="outgoing">what else changed</Bubble>
            <Bubble variant="incoming">
              Delivery slid to 10. Inspection still 9. Owner wants the deck revision today.
            </Bubble>
          </div>

          <div className="shrink-0 px-4 pb-5 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9E9EB] text-sm text-[#8E8E93]">
                +
              </div>
              <div className="flex h-8 min-w-0 flex-1 items-center rounded-full border border-[#C7C7CC] px-3 text-[12px] text-[#C7C7CC]">
                iMessage
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-[11px] font-semibold text-white">
                ↑
              </div>
            </div>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-[#1c1c1e]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
