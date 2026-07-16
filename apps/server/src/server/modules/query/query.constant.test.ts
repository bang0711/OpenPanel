import { describe, expect, it } from "bun:test";

import { isValidDb, parseQueryOutput } from "./query.constant";

// isValidDb gates a name that IS interpolated into the shell command.
describe("isValidDb", () => {
  it("accepts identifiers and the empty name", () => {
    expect(isValidDb("open_panel")).toBe(true);
    expect(isValidDb("db1")).toBe(true);
    expect(isValidDb("")).toBe(true); // connect without selecting a database
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "db; rm -rf /",
      "db && id",
      "db$(id)",
      "db`id`",
      "db|cat",
      "db 'x'",
      "../etc",
      "db\nid",
    ]) {
      expect(isValidDb(bad)).toBe(false);
    }
  });

  it("rejects an over-long name", () => {
    expect(isValidDb("a".repeat(64))).toBe(true);
    expect(isValidDb("a".repeat(65))).toBe(false);
  });

  // A regex missing anchors would accept "evil; id\ngood" via a newline.
  it("is anchored", () => {
    expect(isValidDb("good\nevil; id")).toBe(false);
  });
});

describe("parseQueryOutput", () => {
  it("parses header + rows", () => {
    const out = "id\tname\n1\talice\n2\tbob\n";
    expect(parseQueryOutput(out)).toEqual({
      columns: ["id", "name"],
      rows: [
        ["1", "alice"],
        ["2", "bob"],
      ],
      raw: out,
    });
  });

  it("handles a header with no rows", () => {
    expect(parseQueryOutput("id\tname\n").rows).toEqual([]);
  });

  it("handles empty output", () => {
    expect(parseQueryOutput("")).toEqual({ columns: [], rows: [], raw: "" });
  });

  it("keeps empty trailing fields", () => {
    expect(parseQueryOutput("a\tb\n1\t").rows).toEqual([["1", ""]]);
  });

  // When the transport capped the stream, the last line is a partial row —
  // rendering it would show a row with missing trailing columns.
  it("drops the partial last row when truncated", () => {
    const out = "id\tname\n1\talice\n2\tbo";
    expect(parseQueryOutput(out, true).rows).toEqual([["1", "alice"]]);
  });

  it("keeps every row when not truncated", () => {
    const out = "id\tname\n1\talice\n2\tbob";
    expect(parseQueryOutput(out, false).rows).toEqual([
      ["1", "alice"],
      ["2", "bob"],
    ]);
  });
});
