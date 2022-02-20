export type ActionResponse = { success: boolean; data: any };

export interface MultiResponse {
  octoPrint?: ActionResponse;
  cache?: ActionResponse;
  service?: ActionResponse;
}
