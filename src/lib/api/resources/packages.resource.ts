import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { PackageList, PackageSearch, PkgCommandResult } from "./packages.type";

export class PackagesResource {
  installed(serverId: string) {
    return request<PackageList>("GET", API_ENDPOINT.PACKAGES.ROOT(serverId));
  }
  search(serverId: string, q: string) {
    return request<PackageSearch>(
      "GET",
      API_ENDPOINT.PACKAGES.SEARCH(serverId),
      { query: { q } },
    );
  }
  install(serverId: string, name: string) {
    return request<PkgCommandResult>(
      "POST",
      API_ENDPOINT.PACKAGES.INSTALL(serverId),
      { body: { name } },
    );
  }
  remove(serverId: string, name: string) {
    return request<PkgCommandResult>(
      "POST",
      API_ENDPOINT.PACKAGES.REMOVE(serverId),
      { body: { name } },
    );
  }
  refresh(serverId: string) {
    return request<PkgCommandResult>(
      "POST",
      API_ENDPOINT.PACKAGES.REFRESH(serverId),
    );
  }
}
