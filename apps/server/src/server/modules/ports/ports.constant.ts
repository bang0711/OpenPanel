export type OpenPort = {
  proto: string;
  localAddress: string;
  port: number;
  process: string;
};

/**
 * Parse one row of `ss -tulpnH` or `netstat -tulpn` into an OpenPort.
 * Best-effort: process may be empty. Returns null for headers/blank rows.
 *
 * ss:      Netid State  Recv-Q Send-Q Local:Port Peer:Port users:(("name",pid=..))
 * netstat: Proto Recv-Q Send-Q Local:Port Foreign:Port State PID/name
 */
export function parsePortRow(line: string): OpenPort | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const proto = parts[0];
  if (!/^(tcp|udp)/i.test(proto)) return null;

  // netstat has a numeric Recv-Q at index 1 (local addr at 3); ss has a state
  // keyword there (local addr at 4).
  const local = /^\d+$/.test(parts[1]) ? parts[3] : parts[4];
  if (!local || !local.includes(":")) return null;

  const idx = local.lastIndexOf(":");
  const port = Number(local.slice(idx + 1));
  if (!Number.isInteger(port)) return null;

  const process =
    line.match(/users:\(\("([^"]+)"/)?.[1] ?? line.match(/\d+\/(\S+)/)?.[1] ?? "";

  return { proto, localAddress: local.slice(0, idx), port, process };
}
