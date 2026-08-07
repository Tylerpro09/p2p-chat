import { joinRoom } from "https://esm.run/trystero@0.25.3";
import { APP_ID, GLOBAL_ROOM, RELAYS, ACTIONS } from "../config.js";

export function createPeerRoom() {
  return joinRoom(
    {
      appId: APP_ID,
      relayConfig: {
        urls: RELAYS,
        warnOnRelayFailure: false
      }
    },
    GLOBAL_ROOM
  );
}

export function createRoomActions(room) {
  return {
    chatAction: room.makeAction(ACTIONS.CHAT),
    nameAction: room.makeAction(ACTIONS.USERNAME),
    historyAction: room.makeAction(ACTIONS.HISTORY),
    fileAction: room.makeAction(ACTIONS.FILE)
  };
}

export function createPortableHistory(records) {
  return records.map((record) => ({
    id: record.id,
    type: record.type,
    username: record.username,
    text: record.text,
    filename: record.filename,
    mime: record.mime,
    size: record.size,
    timestamp: record.timestamp
  }));
}

export function getMediaTypeFromFile(file) {
  if (file.type.startsWith("image/")) {
    return "image";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }
  return "file";
}
