export interface ApiSettingsDto {
  plugins: Plugins;
  feature: Feature;
  webcam: Webcam;
}

export interface Plugins {
  UltimakerFormatPackage: UltimakerFormatPackage;
}

export interface UltimakerFormatPackage {
  align_inline_thumbnail: boolean;
  inline_thumbnail: boolean;
  inline_thumbnail_align_value: string;
  inline_thumbnail_scale_value: string;
  installed: boolean;
  installed_version: string;
  scale_inline_thumbnail: boolean;
  state_panel_thumbnail: boolean;
}

export interface Feature {
  sdSupport: boolean;
  temperatureGraph: boolean;
}

export interface Webcam {
  flipH: boolean;
  flipV: boolean;
  rotate90: boolean;
  streamUrl: string;
  webcamEnabled: boolean;
}
