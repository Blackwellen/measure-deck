"use client";

import { cn } from "@/lib/utils";
import { Loader2, MapPin, Send, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SLASH_COMMANDS = [
  { cmd: "/summarise", desc: "Summarise this project" },
  { cmd: "/cvr", desc: "Explain the current CVR" },
  { cmd: "/application", desc: "Draft a payment application" },
  { cmd: "/change", desc: "Log a change event" },
  { cmd: "/risk", desc: "Identify project risks" },
  { cmd: "/cashflow", desc: "Show cash flow forecast" },
  { cmd: "/evidence", desc: "List evidence gaps" },
  { cmd: "/retention", desc: "Calculate retention" },
  { cmd: "/programme", desc: "Review programme delays" },
  { cmd: "/dispute", desc: "Help with a dispute" },
  { cmd: "/final-account", desc: "Assist with final account" },
  { cmd: "/supplier", desc: "Supplier query" },
  { cmd: "/help", desc: "Show help topics" },
];

const MAX_CREDITS = 100;

export function CopilotView() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Hi! I'm your MeasureDeck AI Copilot. Ask me anything about your project — or type **/** to see available commands.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(12);
  const [showCommands, setShowCommands] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredCommands = input.startsWith("/")
    ? SLASH_COMMANDS.filter((c) =>
        c.cmd.startsWith(input.split(" ")[0].toLowerCase())
      )
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowCommands(val.startsWith("/") && filteredCommands.length > 0);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowCommands(false);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: { pathname },
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content ?? "";
              assistantText += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m))
              );
            } catch { /* ignore parse errors */ }
          }
        }
      }

      setCreditsUsed((prev) => Math.min(prev + 2, MAX_CREDITS));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
    if (e.key === "Escape") setShowCommands(false);
  };

  const selectCommand = (cmd: string) => {
    setInput(cmd + " ");
    setShowCommands(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context chip */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <MapPin className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <span className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
          {pathname ?? "/"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" ? (
              <div
                className="max-w-[90%] rounded-xl p-3 border"
                style={{
                  borderColor: "var(--violet, #7c3aed)",
                  background: "var(--violet-bg, #f5f3ff)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--violet, #7c3aed)" }} />
                  <span className="text-[11px] font-600" style={{ color: "var(--violet, #7c3aed)" }}>
                    MeasureDeck AI
                  </span>
                </div>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                  {msg.content || (isLoading ? "…" : "")}
                </p>
              </div>
            ) : (
              <div
                className="max-w-[85%] rounded-xl px-3 py-2"
                style={{ background: "var(--primary)", color: "white" }}
              >
                <p className="text-[13px] whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="rounded-xl p-3 border" style={{ borderColor: "var(--violet, #7c3aed)", background: "var(--violet-bg, #f5f3ff)" }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--violet, #7c3aed)" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Slash command dropdown */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          className="mx-3 mb-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ background: "white", borderColor: "var(--border)" }}
        >
          {filteredCommands.map((c) => (
            <button
              key={c.cmd}
              type="button"
              onClick={() => selectCommand(c.cmd)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <span className="text-[12px] font-600 font-mono" style={{ color: "var(--primary)" }}>
                {c.cmd}
              </span>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {c.desc}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-end gap-2 rounded-xl border p-2"
          style={{ borderColor: "var(--border)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… or type / for commands"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] outline-none"
            style={{ color: "var(--text-primary)", maxHeight: 80 }}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 btn btn-primary btn-icon btn-sm"
            aria-label="Send"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Usage meter */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(creditsUsed / MAX_CREDITS) * 100}%`,
                background: creditsUsed > 80 ? "var(--danger)" : "var(--primary)",
              }}
            />
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {creditsUsed}/{MAX_CREDITS} credits
          </span>
        </div>
      </div>
    </div>
  );
}

export default CopilotView;
