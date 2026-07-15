"use client";

import "@xterm/xterm/css/xterm.css";

import { useEffect, useRef } from "react";
import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";

import { api, ApiError } from "@/lib/api";

import { useT } from "@/components/common/i18n-provider";

export function TerminalView({ serverId }: { serverId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  // Ref so a locale switch doesn't re-run the effect and drop the session.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let disposed = false;
    let term: Terminal | null = null;
    let fit: FitAddon | null = null;
    let ws: WebSocket | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      // Load xterm only in the browser (avoids SSR referencing `self`/DOM).
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed || !ref.current) return;

      term = new Terminal({
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 12,
        cursorBlink: true,
        theme: { background: "#0a0a0a" },
      });
      fit = new FitAddon();
      term.loadAddon(fit);
      term.open(ref.current);
      fit.fit();

      let ticket: string;
      try {
        ticket = (await api.terminal.ticket(serverId)).ticket;
      } catch (err) {
        term.writeln(
          err instanceof ApiError ? err.message : tRef.current("terminal.ticketFailed"),
        );
        return;
      }
      if (disposed) return;

      const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
      ws = new WebSocket(`${base}?ticket=${encodeURIComponent(ticket)}`);
      ws.binaryType = "arraybuffer";

      const sendResize = () => {
        if (ws?.readyState === WebSocket.OPEN && term) {
          ws.send(JSON.stringify({ t: "r", cols: term.cols, rows: term.rows }));
        }
      };

      ws.onopen = sendResize;
      ws.onmessage = (ev) => {
        if (!term) return;
        if (typeof ev.data === "string") term.write(ev.data);
        else term.write(new Uint8Array(ev.data as ArrayBuffer));
      };
      ws.onclose = () =>
        term?.writeln(`\r\n\x1b[31m${tRef.current("terminal.closed")}\x1b[0m`);

      term.onData((d) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ t: "i", d }));
        }
      });

      ro = new ResizeObserver(() => {
        try {
          fit?.fit();
          sendResize();
        } catch {
          /* ignore */
        }
      });
      ro.observe(ref.current);
    })();

    return () => {
      disposed = true;
      ro?.disconnect();
      ws?.close();
      term?.dispose();
    };
  }, [serverId]);

  return (
    <div
      ref={ref}
      className="h-[70vh] w-full overflow-hidden rounded-md border bg-[#0a0a0a] p-2"
    />
  );
}
