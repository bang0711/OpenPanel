import { CatalogResource } from "./resources/catalog.resource";
import { CronResource } from "./resources/cron.resource";
import { DockerResource } from "./resources/docker.resource";
import { Fail2banResource } from "./resources/fail2ban.resource";
import { FilesResource } from "./resources/files.resource";
import { FirewallResource } from "./resources/firewall.resource";
import { LogsResource } from "./resources/logs.resource";
import { MetricsResource } from "./resources/metrics.resource";
import { PackagesResource } from "./resources/packages.resource";
import { PortsResource } from "./resources/ports.resource";
import { PowerResource } from "./resources/power.resource";
import { ServerResource } from "./resources/server.resource";
import { ServicesResource } from "./resources/services.resource";
import { SshKeysResource } from "./resources/ssh-keys.resource";
import { SslResource } from "./resources/ssl.resource";
import { TerminalResource } from "./resources/terminal.resource";
import { UsersResource } from "./resources/users.resource";
import { VhostResource } from "./resources/vhost.resource";

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
  ports = new PortsResource();
  fail2ban = new Fail2banResource();
  sshKeys = new SshKeysResource();
  logs = new LogsResource();
  power = new PowerResource();
  users = new UsersResource();
  ssl = new SslResource();
  docker = new DockerResource();
  vhost = new VhostResource();
}

export const api = new ApiClient();
