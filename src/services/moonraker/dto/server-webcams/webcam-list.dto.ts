export interface WebcamListDto {
  webcams: WebcamDto[];
}

export interface WebcamDto {
  uid: string;
  name: string;
  location: string;
  icon: string | "mdiWebcam";
  enabled: boolean;
  service: string;
  target_fps: number;
  target_fps_idle: number;
  stream_url: string;
  snapshot_url: string;
  flip_horizontal: boolean;
  flip_vertical: boolean;
  rotation: number;
  aspect_ratio: string;
  extra_data: ExtraData;
  source: string | "database";
}

export interface ExtraData {}
