import { t } from "elysia";

export const pathQuery = t.Object({ path: t.String({ minLength: 1 }) });

export const writeBody = t.Object({
  path: t.String({ minLength: 1 }),
  content: t.String(),
});

export const mkdirBody = t.Object({ path: t.String({ minLength: 1 }) });

export const chmodBody = t.Object({
  path: t.String({ minLength: 1 }),
  mode: t.String({ pattern: "^[0-7]{3,4}$" }),
});

export const renameBody = t.Object({
  from: t.String({ minLength: 1 }),
  to: t.String({ minLength: 1 }),
});

export const uploadBody = t.Object({
  path: t.String({ minLength: 1 }),
  file: t.File(),
});
