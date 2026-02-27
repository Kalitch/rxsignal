"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, AlertCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { ai } from "@/lib/api";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  meta?: { endpoint?: string; total?: number; query?: any };
}

const SUGGESTIONS = [
  "Show me the most common side effects of Ozempic",
  "What are recent Class I drug recalls?",
  "Find adverse events for metformin in elderly patients",
  "What drugs have the most serious adverse event reports?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    try {
      const res: any = await ai.query(prompt);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.summary || "Query executed — no summary generated.",
        meta: {
          endpoint: res.generated_query?.endpoint,
          total: res.total_results,
          query: res.generated_query,
        },
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: "error",
        content: e.message.includes("LM Studio")
          ? "LM Studio is not running. Start it, load a Mistral model, and enable the local server."
          : e.message,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <SectionHeader
        title="AI Assistant"
        subtitle="Ask natural language questions — Mistral translates to FDA queries"
      />

      {/* Messages */}
      <div className="flex-1 card p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#E2E8F0]
              flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-[#1E293B] font-medium">Mistral-powered FDA Intelligence</p>
              <p className="text-sm text-[#64748B] mt-1">Powered by local LM Studio inference — no data leaves your machine</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left text-xs p-3 rounded-lg
                    bg-white border border-[#E2E8F0] hover:border-primary
                    text-[#64748B] hover:text-[#1E293B] transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role !== "user" && (
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
                ${msg.role === "error" ? "bg-[#FEF2F2] border border-[#FECACA]" : "bg-[#EFF6FF] border border-[#E2E8F0]"}`}>
                {msg.role === "error" ? <AlertCircle size={15} className="text-danger" /> : <Bot size={15} className="text-primary" />}
              </div>
            )}

            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-primary text-white border border-transparent"
                : msg.role === "error"
                  ? "bg-[#FEF2F2] border border-[#FECACA] text-danger"
                  : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]"
              }`}>
              {msg.content}
              {msg.meta && (
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex gap-3 text-xs text-[#94A3B8]">
                  {msg.meta.endpoint && <span className="font-mono">{msg.meta.endpoint}</span>}
                  {msg.meta.total !== undefined && (
                    <span>{msg.meta.total.toLocaleString()} results</span>
                  )}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
                <User size={15} className="text-[#94A3B8]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#E2E8F0]
              flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-primary" />
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i}
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask anything about FDA drug data…"
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm rounded-lg
            bg-[#F1F5F9] border border-[#E2E8F0]
            text-[#1E293B] placeholder:text-[#94A3B8]
            focus:outline-none focus:bg-white focus:border-primary
            disabled:opacity-50 transition-all"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-lg bg-primary hover:bg-[#2D8AC8] disabled:opacity-40
            flex items-center justify-center transition-colors"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
