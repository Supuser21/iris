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
        className={`max-w-[78%] px-2.5 py-1.5 text-[11px] leading-[1.25] tracking-[-0.01em] ${
          isIncoming
            ? "rounded-[16px] rounded-bl-[4px] bg-[#E9E9EB] text-[#111111]"
            : "rounded-[16px] rounded-br-[4px] bg-[#0A84FF] text-white"
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
      className={`relative mx-auto h-[560px] w-[270px] overflow-hidden rounded-[2.6rem] bg-[#1c1c1e] p-[8px] shadow-[0_30px_80px_rgba(0,0,0,0.22)] ring-1 ring-black/20 sm:h-[610px] sm:w-[300px] sm:rounded-[3rem] sm:p-[9px] ${className}`}
    >
      <div className="absolute left-1/2 top-[14px] z-30 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-[#1c1c1e] sm:top-[18px] sm:h-[26px] sm:w-[92px]" />

      <div
        className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2.1rem] bg-white sm:rounded-[2.35rem]"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        <div className="relative flex h-8 shrink-0 items-center justify-between bg-[#F7F7F7] px-5 pt-1 text-[10px] font-semibold text-black sm:h-[42px] sm:px-6 sm:pt-2 sm:text-[12px]">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <svg
              width="14"
              height="10"
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
            <span className="relative h-2 w-4 rounded-[3px] border border-[#34C759] bg-[#34C759] after:absolute after:right-[-2px] after:top-1/2 after:h-1 after:w-0.5 after:-translate-y-1/2 after:rounded-r-sm after:bg-[#34C759]" />
          </div>
        </div>

        <div className="shrink-0 border-b border-[#D1D1D6] bg-[#F7F7F7] px-3 pb-1.5">
          <div className="grid grid-cols-[36px_1fr_36px] items-end">
            <div className="pb-0.5 text-[#007AFF]">
              <svg
                width="10"
                height="16"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2d5a4a] to-[#18392f] text-[11px] font-semibold text-white shadow-inner sm:h-9 sm:w-9 sm:text-xs">
                I
              </div>
              <span className="mt-0.5 text-[10px] font-medium text-black">
                Iris
              </span>
            </div>
            <div />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden bg-white px-2.5 pb-2 pt-3">
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
          <Bubble variant="incoming">
            Done. Mike has it. Jen got the same note.
          </Bubble>

          <Bubble variant="outgoing">what else changed</Bubble>
          <Bubble variant="incoming">
            Delivery slid to 10. Inspection still 9. Owner wants the deck
            revision today.
          </Bubble>
        </div>

        <div className="shrink-0 border-t border-[#D1D1D6] bg-white px-2 pb-2.5 pt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9E9EB] text-[11px] text-[#8E8E93]">
              +
            </div>
            <div className="flex h-7 flex-1 items-center rounded-full border border-[#C7C7CC] bg-white px-2.5 text-[11px] text-[#C7C7CC]">
              iMessage
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-[10px] font-semibold text-white">
              ↑
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
