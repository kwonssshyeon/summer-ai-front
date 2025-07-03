import "regenerator-runtime/runtime"; // if needed for async/await in older browsers
import { marked } from "marked";

const chatContainer = document.getElementById("chat-container");
const messageForm = document.getElementById("message-form");
const userInput = document.getElementById("user-input");
const newChatBtn = document.getElementById("new-chat-btn");
const BASE_URL = process.env.API_ENDPOINT;

let db;
marked.setOptions({
  headerIds: true,   // 기본값 true
  headerPrefix: '',  // 접두사 설정
});


async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("myChatDB", 1);
    request.onupgradeneeded = function (e) {
      db = e.target.result;
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    };
    request.onsuccess = function (e) {
      db = e.target.result;
      resolve();
    };
    request.onerror = function (e) {
      reject(e);
    };
  });
}

async function saveMessage(role, content) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readwrite");
    const store = tx.objectStore("chats");
    store.add({ role, content });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

async function getAllMessages() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readonly");
    const store = tx.objectStore("chats");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

async function clearAllData() {
  return new Promise((resolve, reject) => {
    localStorage.removeItem("session_id");
    const tx = db.transaction(["chats", "metadata"], "readwrite");
    tx.objectStore("chats").clear();
    tx.objectStore("metadata").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

function createLoadingBubble(sender = "assistant") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("mb-6", "flex", "items-start", "space-x-3");
  wrapper.classList.add("justify-start");

  const avatar = document.createElement("div");
  avatar.classList.add(
    "w-10",
    "h-10",
    "rounded-full",
    "flex-shrink-0",
    "flex",
    "items-center",
    "justify-center",
    "font-bold",
    "text-white"
  );

  avatar.classList.add("bg-gradient-to-br", "from-[#7209b7]", "to-[#7209b7]");
  avatar.innerHTML = ` 
    <svg width="150" height="150" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#7209b7"/>
      <g fill="white" transform="translate(-17, 0) scale(1.3)">
        <path d="M60 30c-16 0-28 12-28 26s12 26 28 26 28-12 28-26-12-26-28-26zm0 48c-12.15 0-22-8.28-22-18s9.85-18 22-18 22 8.28 22 18-9.85 18-22 18z"/>
        <circle cx="50" cy="58" r="4"/>
        <circle cx="70" cy="58" r="4"/>
        <path d="M52 70c2.5 2.5 13.5 2.5 16 0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="60" cy="18" r="6" fill="white"/>
        <line x1="60" y1="24" x2="60" y2="34" stroke="white" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>
  `;

  const bubble = document.createElement("div");
  bubble.classList.add(
    "p-3",
    "rounded-lg",
    "whitespace-pre-wrap",
    "leading-relaxed",
    "text-[#5C5C5C]",
    "inline-block"
  );

  bubble.style.whiteSpace = "normal";
  bubble.style.wordBreak = "break-word";
  bubble.style.maxWidth = "90vw";

  // 프로그레스바 스타일 (간단한 애니메이션)
  bubble.innerHTML = `
    <div style="
      width: 24px;
      height: 24px;
      border: 3px solid #ccc;
      border-top-color: #7209b7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
      display: block;
      white-space: normal;
    "></div>
  `;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  return wrapper;
}

function createMessageBubble(content, sender = "user") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("mb-6", "flex", "items-start", "space-x-3");

  if (sender === "user") {
    wrapper.classList.add("justify-end");
  } else {
    wrapper.classList.add("justify-start");
  }

  const avatar = document.createElement("div");
  avatar.classList.add(
    "w-10",
    "h-10",
    "rounded-full",
    "flex-shrink-0",
    "flex",
    "items-center",
    "justify-center",
    "font-bold",
    "text-white"
  );

  if (sender === "assistant") {
    avatar.classList.add("bg-gradient-to-br", "from-[#7209b7]", "to-[#7209b7]");
    avatar.innerHTML = `
    <svg width="150" height="150" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#7209b7"/>
      <g fill="white" transform="translate(-17, 0) scale(1.3)">
        <path d="M60 30c-16 0-28 12-28 26s12 26 28 26 28-12 28-26-12-26-28-26zm0 48c-12.15 0-22-8.28-22-18s9.85-18 22-18 22 8.28 22 18-9.85 18-22 18z"/>
        <circle cx="50" cy="58" r="4"/>
        <circle cx="70" cy="58" r="4"/>
        <path d="M52 70c2.5 2.5 13.5 2.5 16 0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="60" cy="18" r="6" fill="white"/>
        <line x1="60" y1="24" x2="60" y2="34" stroke="white" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>

    `;
  } else {
    avatar.classList.add("bg-gradient-to-br", "from-[#7209b7]", "to-[#7209b7]");
    avatar.innerHTML = `
    <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22.01C17.5228 22.01 22 17.5329 22 12.01C22 6.48716 17.5228 2.01001 12 2.01001C6.47715 2.01001 2 6.48716 2 12.01C2 17.5329 6.47715 22.01 12 22.01Z" fill="#7209b7"/>
      <path d="M12 6.93994C9.93 6.93994 8.25 8.61994 8.25 10.6899C8.25 12.7199 9.84 14.3699 11.95 14.4299C11.98 14.4299 12.02 14.4299 12.04 14.4299C12.06 14.4299 12.09 14.4299 12.11 14.4299C12.12 14.4299 12.13 14.4299 12.13 14.4299C14.15 14.3599 15.74 12.7199 15.75 10.6899C15.75 8.61994 14.07 6.93994 12 6.93994Z" fill="#FFFFFF"/>
      <path d="M18.7807 19.36C17.0007 21 14.6207 22.01 12.0007 22.01C9.3807 22.01 7.0007 21 5.2207 19.36C5.4607 18.45 6.1107 17.62 7.0607 16.98C9.7907 15.16 14.2307 15.16 16.9407 16.98C17.9007 17.62 18.5407 18.45 18.7807 19.36Z" fill="#FFFFFF"/>
    </svg>

    `;
  }

  const bubble = document.createElement("div");
  bubble.classList.add(
    "max-w-full",
    "md:max-w-2xl",
    "p-3",
    "rounded-lg",
    "whitespace-pre-wrap",
    "leading-relaxed",
    "shadow-sm"
  );

  if (sender === "assistant") {
    bubble.classList.add("bg-[#F2F2F2]", "text-[#5C5C5C]");
    bubble.innerHTML = `<div class="prose" style="
      display: inline-block;
      max-width: 90vw;
      width: fit-content;
      white-space: normal;
    ">
    ${marked.parse(content)}
    </div>`;  
  } else {
    bubble.classList.add(
  "text-white",
    "bg-gradient-to-r",
    "from-[#7209b7]",
    "to-[#7209b7]",
  );
    bubble.textContent = content;
  }

  if (sender === "assistant") {
    // 왼쪽 정렬: 아바타 → 말풍선
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  } else {
    // 오른쪽 정렬: 말풍선 → 아바타
    wrapper.appendChild(bubble);
    // wrapper.appendChild(avatar);
  }
  return wrapper;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function getAssistantResponse(userMessage) {
  const allMsgs = await getAllMessages();

  // 로컬 스토리지에서 session_id 가져오기
  const sessionId = localStorage.getItem("session_id");

  const payload = { message: userMessage, 
    ...(sessionId && { session_id: sessionId })
   };
  const url = `${BASE_URL}/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  
  // 응답에 session_id가 있고 로컬스토리지에 저장 안 되어 있다면 저장
  if (data.session_id && !sessionId) {
    localStorage.setItem("session_id", data.session_id);
  }

  return data.reply;
}

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  chatContainer.appendChild(createMessageBubble(message, "user"));
  await saveMessage("user", message);

  userInput.value = "";
  scrollToBottom();

  // assistant 로딩 말풍선 추가
  const loadingBubble = createLoadingBubble("assistant");
  chatContainer.appendChild(loadingBubble);
  scrollToBottom();


  try {
    const response = await getAssistantResponse(message);
    chatContainer.appendChild(createMessageBubble(response, "assistant"));
    // 로딩 말풍선 제거
    chatContainer.removeChild(loadingBubble);

    // 실제 응답 말풍선 추가
    await saveMessage("assistant", response);
    scrollToBottom();
  } catch (error) {
    console.error("Error fetching assistant response:", error);
    // 로딩 말풍선 제거
    chatContainer.removeChild(loadingBubble);

    const errMsg = `시스템 오류로 인해 응답할 수 없습니다. 잠시 후 다시 시도하세요.`;
    chatContainer.appendChild(createMessageBubble(errMsg, "assistant"));
    await saveMessage("assistant", errMsg);
    scrollToBottom();
  }
});

async function loadExistingMessages() {
  const allMsgs = await getAllMessages();
  for (const msg of allMsgs) {
    chatContainer.appendChild(createMessageBubble(msg.content, msg.role));
  }
  scrollToBottom();
}

newChatBtn.addEventListener("click", async () => {
  // Clear DB data and UI
  await clearAllData();
  chatContainer.innerHTML = "";
  // Now user can start a new chat fresh
});

initDB().then(clearAllData).then(loadExistingMessages);

console.log(BASE_URL);
