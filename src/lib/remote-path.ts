// Browser-side helpers for remote (posix) paths in the file manager.

export function parentOf(path: string): string {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/");
}

export function joinPath(dir: string, name: string): string {
  return dir === "/" ? `/${name}` : `${dir}/${name}`;
}
