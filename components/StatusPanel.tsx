"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEchoStore } from "../store/useEchoStore";

function StatusPanel() {
  const { connectionState } = useEchoStore();

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const error = connectionState === "error";

  return (
    <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-4 z-20 pointer-events-none">
      {error && (
        <div className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-4 py-2 rounded-full text-sm border border-red-200 dark:border-red-500/20 flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-4 pointer-events-auto">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div
        className={cn(
          "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all duration-500 flex items-center gap-2 backdrop-blur-sm shadow-sm",
          isConnecting
            ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 animate-pulse"
            : isConnected
              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#ffa809]/10 dark:text-[#ffa809] dark:border-[#ffa809]/20",
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isConnecting
              ? "bg-blue-500"
              : isConnected
                ? "bg-emerald-500"
                : "bg-[#ffa809]",
          )}
        />
        {isConnecting
          ? "Connecting..."
          : isConnected
            ? "Live Session"
            : "Ready to Talk"}
      </div>
    </div>
  );
}

export default StatusPanel;
