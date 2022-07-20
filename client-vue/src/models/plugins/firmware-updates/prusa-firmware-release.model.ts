export interface GithubPerson {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: false;
}

export interface GithubReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
  url: string;

  content_type: string;
  created_at: string;
  download_count: number;
  id: number;
  label: string;
  node_id: number;
  updated_at: string;
  uploader: GithubPerson;
}

export interface PrusaFirmwareReleaseModel {
  id: number;
  tag_name: string;
  prerelease: boolean;

  assets: GithubReleaseAsset[];
  assets_url: string;
  draft: boolean;
  created_at: string;
  published_at: string;
  author: GithubPerson;
  body: string;
  html_url: string;
  node_id: number;
  tarball_url: string;
  target_commitish: string;
  upload_url: string;
  url: string;
  zipball_url: string;
}
