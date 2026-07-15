import { CatalogResource } from "./resources/catalog.resource";
import { CronResource } from "./resources/cron.resource";
import { FilesResource } from "./resources/files.resource";
import { FirewallResource } from "./resources/firewall.resource";
import { MetricsResource } from "./resources/metrics.resource";
import { PackagesResource } from "./resources/packages.resource";
import { ServerResource } from "./resources/server.resource";
import { ServicesResource } from "./resources/services.resource";
import { TerminalResource } from "./resources/terminal.resource";

export class ApiClient {
  server = new ServerResource();
  metrics = new MetricsResource();
  services = new ServicesResource();
  files = new FilesResource();
  terminal = new TerminalResource();
  packages = new PackagesResource();
  catalog = new CatalogResource();
  cron = new CronResource();
  firewall = new FirewallResource();
}

export const api = new ApiClient();
