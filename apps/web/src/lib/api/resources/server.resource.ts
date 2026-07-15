import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { Server, ServerCreateInput, TestResult } from "./server.type";

export class ServerResource {
  list() {
    return request<Server[]>("GET", API_ENDPOINT.SERVERS.ROOT);
  }
  get(id: string) {
    return request<Server>("GET", API_ENDPOINT.SERVERS.BY_ID(id));
  }
  create(input: ServerCreateInput) {
    return request<Server>("POST", API_ENDPOINT.SERVERS.ROOT, { body: input });
  }
  remove(id: string) {
    return request<{ ok: true }>("DELETE", API_ENDPOINT.SERVERS.BY_ID(id));
  }
  test(id: string) {
    return request<TestResult>("POST", API_ENDPOINT.SERVERS.TEST(id));
  }
  setTags(id: string, tags: string[]) {
    return request<Server>("PATCH", `${API_ENDPOINT.SERVERS.BY_ID(id)}/tags`, {
      body: { tags },
    });
  }
}
