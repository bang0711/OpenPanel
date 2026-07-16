import { describe, expect, it } from "bun:test";

import { parsePortRow } from "./ports.constant";

// Input is stdout from a remote host, so every branch must survive junk without
// throwing — a single bad row must not break the listing.
describe("parsePortRow", () => {
  describe("ss -tulpnH", () => {
    it("parses a listening tcp socket with a process", () => {
      expect(
        parsePortRow(
          'tcp    LISTEN 0      4096   0.0.0.0:22     0.0.0.0:*    users:(("sshd",pid=800,fd=3))',
        ),
      ).toEqual({
        proto: "tcp",
        localAddress: "0.0.0.0",
        port: 22,
        process: "sshd",
      });
    });

    it("parses a udp socket with an interface-scoped address", () => {
      expect(
        parsePortRow(
          'udp    UNCONN 0      0      127.0.0.53%lo:53   0.0.0.0:*    users:(("systemd-resolve",pid=700,fd=12))',
        ),
      ).toEqual({
        proto: "udp",
        localAddress: "127.0.0.53%lo",
        port: 53,
        process: "systemd-resolve",
      });
    });

    // lastIndexOf(":") is what makes bracketed IPv6 literals work.
    it("parses an IPv6 socket", () => {
      expect(
        parsePortRow(
          'tcp6   LISTEN 0      511    [::]:80    [::]:*    users:(("nginx",pid=900,fd=6))',
        ),
      ).toEqual({
        proto: "tcp6",
        localAddress: "[::]",
        port: 80,
        process: "nginx",
      });
      expect(parsePortRow("tcp LISTEN 0 128 [::1]:631 [::]:*")?.localAddress).toBe(
        "[::1]",
      );
    });

    it("leaves process empty when ss ran without permission to see it", () => {
      expect(parsePortRow("tcp    LISTEN 0      128    127.0.0.1:5432   0.0.0.0:*")).toEqual({
        proto: "tcp",
        localAddress: "127.0.0.1",
        port: 5432,
        process: "",
      });
    });

    it("picks the first process of a multi-process socket", () => {
      expect(
        parsePortRow(
          'tcp LISTEN 0 4096 *:9090 *:* users:(("prometheus",pid=1,fd=7),("other",pid=2,fd=8))',
        )?.process,
      ).toBe("prometheus");
    });
  });

  describe("netstat -tulpn", () => {
    // Numeric Recv-Q at index 1 is the only signal that shifts the local
    // address from index 4 to index 3.
    it("parses a listening tcp socket", () => {
      expect(
        parsePortRow(
          "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      800/sshd",
        ),
      ).toEqual({
        proto: "tcp",
        localAddress: "0.0.0.0",
        port: 22,
        process: "sshd",
      });
    });

    it("parses a udp row, which has no LISTEN state", () => {
      expect(
        parsePortRow(
          "udp        0      0 0.0.0.0:68              0.0.0.0:*                           500/dhclient",
        ),
      ).toEqual({
        proto: "udp",
        localAddress: "0.0.0.0",
        port: 68,
        process: "dhclient",
      });
    });

    it("parses a tcp6 row", () => {
      expect(
        parsePortRow(
          "tcp6       0      0 :::80                   :::*                    LISTEN      1234/nginx",
        ),
      ).toEqual({
        proto: "tcp6",
        localAddress: "::",
        port: 80,
        process: "nginx",
      });
    });

    it("leaves process empty when netstat ran unprivileged", () => {
      expect(
        parsePortRow(
          "tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      -",
        ),
      ).toEqual({
        proto: "tcp",
        localAddress: "127.0.0.1",
        port: 3306,
        process: "",
      });
    });

    // netstat truncates long names with a trailing colon; the capture is
    // whitespace-delimited so the colon rides along into the UI string.
    it("keeps netstat's trailing colon on a truncated process name", () => {
      expect(
        parsePortRow(
          "tcp6       0      0 :::443                  :::*                    LISTEN      1234/nginx: master",
        )?.process,
      ).toBe("nginx:");
    });
  });

  describe("rejected rows", () => {
    it("returns null for headers and banners", () => {
      expect(parsePortRow("Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port")).toBeNull();
      expect(parsePortRow("Proto Recv-Q Send-Q Local Address           Foreign Address         State")).toBeNull();
      expect(parsePortRow("Active Internet connections (only servers)")).toBeNull();
    });

    it("returns null for blank and short rows", () => {
      expect(parsePortRow("")).toBeNull();
      expect(parsePortRow("   ")).toBeNull();
      expect(parsePortRow("\n")).toBeNull();
      expect(parsePortRow("tcp LISTEN 0")).toBeNull();
    });

    it("returns null for non-tcp/udp protocols", () => {
      expect(parsePortRow("raw 0 0 0.0.0.0:1 0.0.0.0:* 7")).toBeNull();
      expect(parsePortRow("unix  2  [ ACC ]  STREAM  LISTENING  1234  /run/x.sock")).toBeNull();
      expect(parsePortRow("sctp LISTEN 0 4096 0.0.0.0:9 0.0.0.0:*")).toBeNull();
    });

    it("returns null when the local address has no port", () => {
      expect(parsePortRow("tcp LISTEN 0 4096 0.0.0.0 0.0.0.0:* users")).toBeNull();
      // `*` is not a number, so NaN is filtered out rather than surfaced.
      expect(parsePortRow("tcp LISTEN 0 4096 0.0.0.0:* 0.0.0.0:* users")).toBeNull();
      expect(parsePortRow("tcp 0 0 0.0.0.0:abc 0.0.0.0:* LISTEN 1/x")).toBeNull();
    });
  });

  describe("hostile / degenerate input", () => {
    it("does not throw on an oversized or control-char-laden row", () => {
      expect(parsePortRow("tcp LISTEN 0 4096 " + "0.0.0.0:22 ".repeat(5000))?.port).toBe(22);
      expect(parsePortRow("tcp\tLISTEN\t0\t4096\t0.0.0.0:22\t0.0.0.0:*")?.port).toBe(22);
      expect(parsePortRow("tcp LISTEN 0 4096 0.0.0.0:22\0 0.0.0.0:*")).toBeNull();
    });

    // BUG (low): the proto check `/^(tcp|udp)/i` is unanchored at the end and
    // the raw token is returned as `proto`, so a remote host can put arbitrary
    // trailing text there. It is display data (never shell-interpolated), so the
    // impact is a bogus/spoofed protocol label in the UI, not injection.
    it("passes an attacker-controlled proto token through verbatim", () => {
      expect(parsePortRow("tcpEVIL LISTEN 0 4096 0.0.0.0:22 0.0.0.0:*")?.proto).toBe(
        "tcpEVIL",
      );
      expect(parsePortRow("UDP-x LISTEN 0 4096 0.0.0.0:22 0.0.0.0:*")?.proto).toBe(
        "UDP-x",
      );
    });

    // Same category: a process can name itself anything. Callers must treat
    // `process` as untrusted text (escape on render, never put in a command).
    it("passes an attacker-controlled process name through verbatim", () => {
      expect(
        parsePortRow('tcp LISTEN 0 4096 0.0.0.0:22 0.0.0.0:* users:(("evil; id",pid=1,fd=3))')
          ?.process,
      ).toBe("evil; id");
      expect(
        parsePortRow('tcp LISTEN 0 4096 0.0.0.0:22 0.0.0.0:* users:(("$(id)",pid=1,fd=3))')
          ?.process,
      ).toBe("$(id)");
    });

    // Port is Number()-parsed, so it cannot carry a payload: anything
    // non-numeric becomes NaN and the row is dropped.
    it("never returns a non-numeric port", () => {
      expect(parsePortRow("tcp LISTEN 0 4096 0.0.0.0:22;id 0.0.0.0:*")).toBeNull();
      expect(parsePortRow("tcp LISTEN 0 4096 0.0.0.0:$(id) 0.0.0.0:*")).toBeNull();
      const row = parsePortRow("tcp LISTEN 0 4096 0.0.0.0:99999 0.0.0.0:*");
      // BUG (low): out-of-range ports are not rejected — only integer-ness is
      // checked. Cosmetic; the value is display-only.
      expect(row?.port).toBe(99999);
    });
  });
});
