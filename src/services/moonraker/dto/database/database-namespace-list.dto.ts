export type Namespaces = "gcode_metadata" | "history" | "moonraker" | "test_namespace" | string;

export interface DatabaseNamespaceListDto {
  namespaces: Namespaces[];
}
