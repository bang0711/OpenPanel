export type FileNode = {
  name: string;
  type: "dir" | "file" | "link" | "other";
  size: number;
  mode: string;
  mtime: number;
};

export type FileListing = { path: string; entries: FileNode[] };
