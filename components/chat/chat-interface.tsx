"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatInterface() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) setMessages(d.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages((m) => [...m, { role: "assistant", content: data.text }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-accent text-white"
                    : "rounded-tl-sm bg-card border border-border"
                }`}
              >
                {m.role === "assistant" && (
                  <span className="mb-1 block text-xs font-semibold text-accent">
                    Iris
                  </span>
                )}
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-muted">Iris is typing…</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="border-t border-border bg-card p-4">
        <div className="mx-auto flex max-w-lg gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Message Iris…"
            className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <Button onClick={send} disabled={loading}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
