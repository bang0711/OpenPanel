// Allowlists + validation for the docker module (injection defense).

export const DOCKER_ACTIONS = ["start", "stop", "restart", "rm"] as const;
export type DockerAction = (typeof DOCKER_ACTIONS)[number];

export const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

export function isValidId(id: string): boolean {
  return ID_RE.test(id) && id.length <= 128;
}
