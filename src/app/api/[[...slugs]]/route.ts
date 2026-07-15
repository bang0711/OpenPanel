import { app } from "@/server/app";

export const runtime = "nodejs";

// Bridge every HTTP verb to the Elysia app's WHATWG fetch handler.
const handle = (request: Request) => app.handle(request);

export {
  handle as DELETE,
  handle as GET,
  handle as HEAD,
  handle as OPTIONS,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};
