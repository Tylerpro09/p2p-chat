import { makeId, now, isImage, isVideo } from "./utils.js";
import { NAME_KEY, MAX_IMAGE, MAX_VIDEO, MAX_MESSAGES } from "./config.js";
import { getHistory, saveRecord } from "./infrastructure/storage.js";
import { createPeerRoom, createRoomActions, createPortableHistory, getMediaTypeFromFile } from "./infrastructure/peer.js";
import {
  elements,
  setUserInterface,
  setOnlineState,
  setConnectingState,
  updateUsersCount,
  renderSystemMessage,
  renderRecord,
  clearMessages,
  showRegisterOverlay,
  hideRegisterOverlay,
  showFilePreview,
  clearFilePreview
} from "./presentation/ui.js";

let myName = localStorage.getItem(NAME_KEY) || "";
let room = null;
let chatAction = null;
let nameAction = null;
let historyAction = null;
let fileAction = null;
let selectedFile = null;
const peerNames = new Map();
const knownMessageIds = new Set();

function setCurrentName(name) {
  myName = name;
  localStorage.setItem(NAME_KEY, myName);
  setUserInterface(myName);
}

async function addRecord(record, mine = false) {
  if (knownMessageIds.has(record.id)) {
    return;
  }
  knownMessageIds.add(record.id);
  await saveRecord(record);
  renderRecord(record, mine);
}

async function loadLocalHistory() {
  const history = await getHistory();
  clearMessages();
  if (history.length === 0) {
    renderSystemMessage("Bienvenido al chat global.");
    return;
  }
  history.forEach((record) => {
    knownMessageIds.add(record.id);
    renderRecord(record, record.username === myName);
  });
}

function refreshUserCount() {
  if (!room) {
    updateUsersCount(1);
    return;
  }
  const peers = Object.keys(room.getPeers());
  updateUsersCount(peers.length + 1);
}

function validateFile(file) {
  if (isImage(file) && file.size > MAX_IMAGE) {
    alert("La imagen supera el tamaño máximo de 10 MB.");
    return false;
  }
  if (isVideo(file) && file.size > MAX_VIDEO) {
    alert("El video supera el tamaño máximo de 50 MB.");
    return false;
  }
  if (!isImage(file) && !isVideo(file)) {
    alert("Solo se permiten imágenes y videos.");
    return false;
  }
  return true;
}

async function startChat() {
  if (!myName || room) {
    return;
  }
  setConnectingState();
  room = createPeerRoom();
  const actions = createRoomActions(room);
  chatAction = actions.chatAction;
  nameAction = actions.nameAction;
  historyAction = actions.historyAction;
  fileAction = actions.fileAction;

  chatAction.onMessage = async (data, { peerId }) => {
    if (!data || !data.id) {
      return;
    }
    const record = {
      id: data.id,
      type: "text",
      username: data.username || peerNames.get(peerId) || "Usuario",
      text: data.text || "",
      timestamp: data.timestamp || now()
    };
    await addRecord(record, false);
  };

  nameAction.onMessage = (data, { peerId }) => {
    peerNames.set(peerId, String(data || "Usuario"));
  };

  historyAction.onMessage = async (data) => {
    if (!Array.isArray(data)) {
      return;
    }
    const history = data.slice(-MAX_MESSAGES).sort((a, b) => a.timestamp - b.timestamp);
    for (const record of history) {
      if (!record.id) {
        continue;
      }
      await addRecord(record, record.username === myName);
    }
  };

  fileAction.onMessage = async (data, { metadata, peerId }) => {
    if (!metadata || !metadata.id) {
      return;
    }
    const blob = new Blob([data], { type: metadata.mime });
    const record = {
      id: metadata.id,
      type: metadata.mediaType,
      username: metadata.username || peerNames.get(peerId) || "Usuario",
      timestamp: metadata.timestamp || now(),
      filename: metadata.filename,
      mime: metadata.mime,
      size: blob.size,
      blob
    };
    await addRecord(record, false);
  };

  room.onPeerJoin = async (peerId) => {
    refreshUserCount();
    nameAction.send(myName, { target: peerId });
    const history = await getHistory();
    const portableHistory = createPortableHistory(history);
    historyAction.send(portableHistory, { target: peerId });
    setOnlineState();
  };

  room.onPeerLeave = (peerId) => {
    peerNames.delete(peerId);
    refreshUserCount();
  };

  refreshUserCount();
  setOnlineState();
  renderSystemMessage(`Entraste como ${myName}`);
  elements.messageInput.focus();
}

async function saveName() {
  const value = elements.registerName.value.trim();
  if (!value) {
    alert("Escribe un nombre.");
    return;
  }
  setCurrentName(value);
  hideRegisterOverlay();
  if (room && nameAction) {
    nameAction.send(myName);
  }
  if (!room) {
    await startChat();
  }
}

function clearSelectedFile() {
  selectedFile = null;
  clearFilePreview();
}

function handleFileSelection() {
  const file = elements.fileInput.files?.[0];
  if (!file) {
    return;
  }
  if (!validateFile(file)) {
    elements.fileInput.value = "";
    return;
  }
  selectedFile = file;
  showFilePreview(file);
}

async function sendMessage() {
  const text = elements.messageInput.value.trim();
  const peers = room ? Object.keys(room.getPeers()) : [];
  if (!room || peers.length === 0) {
    renderSystemMessage("No hay otros usuarios conectados.");
    return;
  }

  if (selectedFile) {
    await sendFile(selectedFile);
    return;
  }

  if (!text) {
    return;
  }

  const payload = {
    id: makeId(),
    username: myName,
    text,
    timestamp: now()
  };

  await chatAction.send(payload);
  await addRecord(payload, true);
  elements.messageInput.value = "";
  elements.messageInput.focus();
}

async function sendFile(file) {
  if (!fileAction) {
    return;
  }
  const mediaType = getMediaTypeFromFile(file);
  const metadata = {
    id: makeId(),
    username: myName,
    filename: file.name,
    mime: file.type,
    size: file.size,
    timestamp: now(),
    mediaType
  };
  await fileAction.send(file, { metadata });
  const record = {
    ...metadata,
    blob: file
  };
  await addRecord(record, true);
  clearSelectedFile();
}

function bindEvents() {
  elements.avatar.onclick = () => showRegisterOverlay(myName);
  elements.registerButton.onclick = saveName;
  elements.attachButton.onclick = () => elements.fileInput.click();
  elements.fileInput.onchange = handleFileSelection;
  elements.cancelFile.onclick = clearSelectedFile;

  elements.sendButton.onclick = sendMessage;
  elements.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  window.addEventListener("beforeunload", () => {
    room?.leave();
  });
}

async function init() {
  setUserInterface(myName);
  bindEvents();
  await loadLocalHistory();
  if (!myName) {
    showRegisterOverlay(myName);
  } else {
    await startChat();
  }
}

init();
