export type PSTATE = string;
export type CATEGORY = string;
export type ColourLabel = "dark" | "success" | "warning" | "danger" | "secondary";

export interface WebsocketState {
  colour: ColourLabel;
  desc: string;
}

export interface VisualState {
  state: PSTATE;
  desc: string;
  colour: {
    name: ColourLabel;
    hex: string;
    category: CATEGORY;
  };
}
