import { formatTime, formatSize } from "../utils.js";

const registerOverlay = document.getElementById("registerOverlay");
const registerName = document.getElementById("registerName");
const registerButton = document.getElementById("registerButton");
const avatar = document.getElementById("avatar");
const currentUser = document.getElementById("currentUser");
const statusElement = document.getElementById("status");
const statusText = document.getElementById("statusText");
const usersElement = document.getElementById("users");
const messagesElement = document.getElementById("messages");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const attachButton = document.getElementById("attach");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const previewMedia = document.getElementById("previewMedia");
const previewName = document.getElementById("previewName");
const previewSize = document.getElementById("previewSize");
const cancelFile = document.getElementById("cancelFile");

export const elements = {
  registerOverlay,
  registerName,
  registerButton,
  avatar,
  currentUser,
  statusElement,
  statusText,
  usersElement,
  messagesElement,
  messageInput,
  sendButton,
  attachButton,
  fileInput,
  preview,
  previewMedia,
  previewName,
  previewSize,
  cancelFile
};

export function setUserInterface(name) {
  currentUser.textContent = name || "Usuario";
  avatar.textContent = (name || "U").charAt(0).toUpperCase();
}

export function setOnlineState() {
  statusElement.classList.add("online");
  statusText.textContent = "En línea";
}

export function setConnectingState() {
  statusElement.classList.remove("online");
  statusText.textContent = "Conectando...";
}

export function updateUsersCount(count) {
  usersElement.textContent = `👥 ${count} usuario${count === 1 ? "" : "s"}`;
}

export function clearMessages() {
  messagesElement.innerHTML = "";
}

export function renderSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "systemMessage";
  div.textContent = text;
  messagesElement.appendChild(div);
  scrollBottom();
}

function scrollBottom() {
  requestAnimationFrame(() => {
    messagesElement.scrollTop = messagesElement.scrollHeight;
  });
}

export function renderRecord(record, mine = false) {
  if (document.querySelector(`[data-message-id="${record.id}"]`)) {
    return;
  }

  const row = document.createElement("div");
  row.className = "messageRow";
  if (mine) {
    row.classList.add("mine");
  }
  row.dataset.messageId = record.id;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "messageMeta";

  const name = document.createElement("span");
  name.className = "messageName";
  name.textContent = record.username || "Usuario";

  const time = document.createElement("span");
  time.className = "messageTime";
  time.textContent = formatTime(record.timestamp);

  meta.append(name, time);
  bubble.appendChild(meta);

  if (record.type === "text") {
    const body = document.createElement("div");
    body.className = "messageText";
    body.textContent = record.text || "";
    bubble.appendChild(body);
  }

  if (record.type === "image") {
    if (record.blob) {
      const img = document.createElement("img");
      img.className = "media";
      img.loading = "lazy";
      img.src = URL.createObjectURL(record.blob);
      bubble.appendChild(img);
    }
    const metaFile = document.createElement("div");
    metaFile.className = "fileMeta";
    metaFile.textContent = record.filename || "Imagen";
    bubble.appendChild(metaFile);
  }

  if (record.type === "video") {
    if (record.blob) {
      const video = document.createElement("video");
      video.className = "media";
      video.controls = true;
      video.preload = "metadata";
      video.src = URL.createObjectURL(record.blob);
      bubble.appendChild(video);
    }
    const metaFile = document.createElement("div");
    metaFile.className = "fileMeta";
    metaFile.textContent = record.filename || "Video";
    bubble.appendChild(metaFile);
  }

  row.appendChild(bubble);
  messagesElement.appendChild(row);
  scrollBottom();
}

export function showRegisterOverlay(initialName = "") {
  registerOverlay.classList.add("show");
  registerName.value = initialName;
  setTimeout(() => registerName.focus(), 100);
}

export function hideRegisterOverlay() {
  registerOverlay.classList.remove("show");
}

export function showFilePreview(file) {
  previewMedia.innerHTML = "";
  previewName.textContent = file.name;
  previewSize.textContent = formatSize(file.size);
  const url = URL.createObjectURL(file);

  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = url;
    previewMedia.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    previewMedia.appendChild(video);
  }

  preview.classList.add("show");
}

export function clearFilePreview() {
  preview.classList.remove("show");
  previewMedia.innerHTML = "";
  elements.fileInput.value = "";
}
