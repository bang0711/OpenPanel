import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { CatalogInstallResult, CatalogStatus } from "./catalog.type";

export class CatalogResource {
  status(serverId: string) {
    return request<CatalogStatus>("GET", API_ENDPOINT.CATALOG.ROOT(serverId));
  }
  install(serverId: string, id: string) {
    return request<CatalogInstallResult>(
      "POST",
      API_ENDPOINT.CATALOG.INSTALL(serverId),
      { body: { id } },
    );
  }
}
