export type DockerContainer = {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
};

export type DockerImage = {
  id: string;
  repository: string;
  tag: string;
  size: string;
};

export type DockerActionName = "start" | "stop" | "restart" | "rm";

export type DockerStatus = {
  installed: boolean;
  containers: DockerContainer[];
  images: DockerImage[];
};
