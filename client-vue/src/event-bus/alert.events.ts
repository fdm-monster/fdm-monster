export const vuexErrorEvent = "store-axios-error";

// message, progress
export const infoMessageEvent = "info-message";
export const uploadMessageEvent = "upload-message";

export enum InfoEventType {
  UPLOAD_BACKEND,
  UPLOAD_FRONTEND
}

export const eventTypeToMessage = (type: InfoEventType, count: number) => {
  if (type === InfoEventType.UPLOAD_BACKEND) {
    return `Server is sending file(s) (${count})`;
  } else if (type === InfoEventType.UPLOAD_FRONTEND) {
    return `Uploading file(s) to server (${count})`;
  } else {
    return `Uploading file(s)`;
  }
};
