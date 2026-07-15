// Immutable app-catalog metadata, shared by client and server.
// Bundled at build time (a pure module import) so the catalog grid renders
// instantly with no round-trip; only live install-status is fetched.

export type CatalogApp = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export const CATALOG_APPS: CatalogApp[] = [
  {
    id: "nginx",
    name: "Nginx",
    description: "High-performance web server & reverse proxy",
    category: "Web",
  },
  {
    id: "docker",
    name: "Docker",
    description: "Container runtime and CLI",
    category: "Runtime",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Advanced relational database",
    category: "Database",
  },
  {
    id: "redis",
    name: "Redis",
    description: "In-memory data store & cache",
    category: "Database",
  },
  {
    id: "nodejs",
    name: "Node.js",
    description: "JavaScript runtime with npm",
    category: "Runtime",
  },
  {
    id: "git",
    name: "Git",
    description: "Distributed version control",
    category: "Tools",
  },
  {
    id: "htop",
    name: "htop",
    description: "Interactive process viewer",
    category: "Tools",
  },
  {
    id: "certbot",
    name: "Certbot",
    description: "Let's Encrypt SSL certificates",
    category: "Web",
  },
];
