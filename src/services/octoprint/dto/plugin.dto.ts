export interface OP_PluginDto {
  id: string;
  published: string;
  title: string;
  description: string;
  archive: string;
  author: string;
  homepage: string;
  page: string;
  compatibility: Compatibility;
  license: string;
  abandoned: boolean;
  github: Github;
  stats: Stats;
  attributes: any[];
}

export interface Compatibility {
  octoprint: string[];
  os: any[];
  python: string;
}

export interface Github {
  latest_release: LatestRelease;
  releases: number;
  last_push: string;
  stars: number;
  issues: Issues;
}

export interface LatestRelease {
  name: string;
  date: string;
  tag: string;
}

export interface Issues {
  open: number;
  closed: number;
}

export interface Stats {
  instances_month: number;
  install_events_month: number;
  instances_week: number;
  install_events_week: number;
}
