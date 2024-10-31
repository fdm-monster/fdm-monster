export interface NockRecordingEntry {
  scope: string; // The base URL (e.g., "http://example.com")
  method: string; // HTTP method (e.g., "GET", "POST")
  path: string; // URL path (e.g., "/api/users")
  body: any; // Request body (if present)
  status: number; // Response status code
  response: any; // Response body
  rawHeaders: string[]; // Array of raw headers
  reqheaders?: {
    // Request headers (if enable_reqheaders_recording is true)
    [key: string]: string;
  };
  headers: {
    // Response headers
    [key: string]: string;
  };
  timestamp?: number; // Unix timestamp of when the request was made
}
