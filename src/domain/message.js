export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video"
};

export function createTextRecord({ id, username, text, timestamp }) {
  return {
    id,
    type: MESSAGE_TYPES.TEXT,
    username,
    text,
    timestamp
  };
}

export function createFileRecord({ id, username, type, filename, mime, size, timestamp, blob }) {
  return {
    id,
    type,
    username,
    filename,
    mime,
    size,
    timestamp,
    blob
  };
}
