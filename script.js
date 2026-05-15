const API_BASE = "https://fringe-api.anyajain110.workers.dev/api";

const quests = [
  {
    title: "Sunset snack crawl",
    description: "Pick a bakery neither of you has tried, rate pastries out of 10, and take one chaotic mirror selfie.",
    xp: "+80 friendship XP",
    badge: "badge: soft launch extrovert"
  },
  {
    title: "Bookstore blind date",
    description: "Choose a book for each other in under five minutes, then compare notes over iced drinks.",
    xp: "+65 friendship XP",
    badge: "badge: local lore keeper"
  },
  {
    title: "Tiny thrift mission",
    description: "You each get a tiny budget and find one iconic object for the other person.",
    xp: "+90 friendship XP",
    badge: "badge: treasure hunter duo"
  },
  {
    title: "Late library lock-in",
    description: "Meet for a focused study sprint, then reward yourselves with matcha after.",
    xp: "+70 friendship XP",
    badge: "badge: study legend"
  },
  {
    title: "Arcade chaos route",
    description: "Take turns choosing games, then let the loser keep the photo booth strip.",
    xp: "+95 friendship XP",
    badge: "badge: joystick soulmate"
  }
];

const profiles = [
  {
    id: "kay-22",
    name: "Kay, 22",
    distance: "1.3 mi",
    about: "museum dates, matcha walks, journaling, and last-minute \"want to go do something?\" energy.",
    interests: ["study buddy", "bookstore run", "cafe crawler"],
    favoriteSpot: "Paper Moon Books"
  },
  {
    id: "nova-23",
    name: "Nova, 23",
    distance: "0.8 mi",
    about: "film cameras, pastries, concert lineups, and tiny plans that become full afternoons.",
    interests: ["concert friend", "cafe crawler", "late-night talker"],
    favoriteSpot: "Honeydew Cafe"
  },
  {
    id: "max-21",
    name: "Max, 21",
    distance: "2.0 mi",
    about: "boba, gym resets, anime nights, and “we should just go” energy.",
    interests: ["gym partner", "gaming duo", "spontaneous adventures"],
    favoriteSpot: "Pixel Palace"
  },
  {
    id: "ari-23",
    name: "Ari, 23",
    distance: "1.7 mi",
    about: "poetry readings, bookstore loops, playlists with endings, and slow walks after dinner.",
    interests: ["bookstore run", "late-night talker", "study buddy"],
    favoriteSpot: "Velvet Room Cafe"
  }
];

const localKeys = {
  token: "fringe-session-token",
  knownAccounts: "fringe-known-accounts"
};

const accountForm = document.querySelector("#account-form");
const nameField = document.querySelector("#name");
const usernameField = document.querySelector("#username");
const emailField = document.querySelector("#email");
const ageField = document.querySelector("#age");
const neighborhoodField = document.querySelector("#neighborhood");
const vibeField = document.querySelector("#vibe");
const spotField = document.querySelector("#spot");
const passwordField = document.querySelector("#password");
const confirmPasswordField = document.querySelector("#confirm-password");
const aboutField = document.querySelector("#about");
const resetFormButton = document.querySelector("#reset-form");
const loginIdentifierInput = document.querySelector("#login-identifier");
const loginPasswordInput = document.querySelector("#login-password");
const verificationCodeInput = document.querySelector("#verification-code");
const accountPicker = document.querySelector("#account-picker");
const signInButton = document.querySelector("#sign-in-account");
const sendCodeButton = document.querySelector("#send-code");
const verifyCodeButton = document.querySelector("#verify-code");
const deleteAccountButton = document.querySelector("#delete-account");
const accountStatus = document.querySelector("#account-status");
const verifyStatus = document.querySelector("#verify-status");

const heroAccountName = document.querySelector("#hero-account-name");
const heroAccountStatus = document.querySelector("#hero-account-status");
const savedAvatar = document.querySelector("#saved-avatar");
const savedName = document.querySelector("#saved-name");
const savedMeta = document.querySelector("#saved-meta");
const savedAbout = document.querySelector("#saved-about");
const savedInterests = document.querySelector("#saved-interests");

const matchName = document.querySelector("#match-name");
const matchDistance = document.querySelector("#match-distance");
const matchAbout = document.querySelector("#match-about");
const matchTags = document.querySelector("#match-tags");
const matchScore = document.querySelector("#match-score");
const skipMatchButton = document.querySelector("#skip-match");
const likeMatchButton = document.querySelector("#like-match");
const likesList = document.querySelector("#likes-list");

const threadPicker = document.querySelector("#thread-picker");
const threadList = document.querySelector("#thread-list");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const messageStatus = document.querySelector("#message-status");

const questCard = document.querySelector("#quest-card");
const questTitle = document.querySelector("#quest-title");
const questDescription = document.querySelector("#quest-description");
const questXp = document.querySelector("#quest-xp");
const questBadge = document.querySelector("#quest-badge");
const spinQuestButton = document.querySelector("#spin-quest");
const saveQuestButton = document.querySelector("#save-quest");
const questMatchPicker = document.querySelector("#quest-match-picker");
const questHistory = document.querySelector("#quest-history");
const questStatus = document.querySelector("#quest-status");

const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const authRequiredSections = document.querySelectorAll("[data-auth-required]");

let activeAccount = null;
let currentMatches = [];
let currentMatchIndex = 0;
let currentQuestIndex = 0;
let pendingVerificationEmail = "";

function loadLocal(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "");
}

function getToken() {
  return loadLocal(localKeys.token, "");
}

function setToken(token) {
  saveLocal(localKeys.token, token || "");
}

function getKnownAccounts() {
  return loadLocal(localKeys.knownAccounts, []);
}

function setKnownAccounts(accounts) {
  saveLocal(localKeys.knownAccounts, accounts);
}

function addKnownAccount(account) {
  const username = normalizeUsername(account.username || account.email.split("@")[0]);
  const next = getKnownAccounts().filter((entry) => entry.email !== account.email);
  next.push({
    email: account.email,
    username,
    name: account.name || ""
  });
  next.sort((a, b) => a.username.localeCompare(b.username));
  setKnownAccounts(next);
}

function removeKnownAccount(email) {
  setKnownAccounts(getKnownAccounts().filter((entry) => entry.email !== email));
}

function findKnownAccountByEmail(email) {
  return getKnownAccounts().find((entry) => entry.email === email) || null;
}

function resolveLoginEmail(identifier) {
  const value = String(identifier || "").trim().toLowerCase();
  if (!value) {
    return "";
  }

  if (value.includes("@")) {
    return value;
  }

  return getKnownAccounts().find((entry) => entry.username === normalizeUsername(value))?.email || "";
}

function enrichAccount(account, identifier = "") {
  if (!account) {
    return null;
  }

  const known = findKnownAccountByEmail(account.email);
  const derivedUsername = normalizeUsername(
    known?.username || (!String(identifier).includes("@") ? identifier : "") || account.email.split("@")[0]
  );

  return {
    ...account,
    username: derivedUsername
  };
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });

  const raw = await response.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw || "Request failed." };
  }

  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.payload = data;
    throw error;
  }

  return data;
}

function getSelectedInterests() {
  return Array.from(document.querySelectorAll('input[name="interests"]:checked')).map((input) => input.value);
}

function setFormFromAccount(account) {
  nameField.value = account.name;
  usernameField.value = account.username || "";
  emailField.value = account.email;
  ageField.value = account.age;
  neighborhoodField.value = account.neighborhood;
  vibeField.value = account.vibe;
  spotField.value = account.favoriteSpot;
  aboutField.value = account.about;
  passwordField.value = "";
  confirmPasswordField.value = "";

  document.querySelectorAll('input[name="interests"]').forEach((input) => {
    input.checked = account.interests.includes(input.value);
  });
}

function clearFormFields() {
  accountForm.reset();
  document.querySelectorAll('input[name="interests"]').forEach((input) => {
    input.checked = false;
  });
}

function renderKnownAccounts() {
  const accounts = getKnownAccounts();
  accountPicker.innerHTML = "";

  if (!accounts.length) {
    accountPicker.innerHTML = "<option value=\"\">No saved usernames yet</option>";
    return;
  }

  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.username;
    option.textContent = `${account.username} • ${account.email}`;
    accountPicker.appendChild(option);
  });

  if (loginIdentifierInput.value) {
    accountPicker.value = normalizeUsername(loginIdentifierInput.value);
  }
}

function renderActiveAccount() {
  if (!activeAccount) {
    heroAccountName.textContent = "No account yet";
    heroAccountStatus.textContent = "Create an account and sign in to unlock saved matches, messages, and sidequests.";
    savedAvatar.textContent = "F";
    savedName.textContent = "No active account";
    savedMeta.textContent = "Create, verify, or sign in to get started";
    savedAbout.textContent = "This panel updates after you create your profile and finish signing in.";
    savedInterests.innerHTML = "<span>nothing saved yet</span>";
    return;
  }

  heroAccountName.textContent = `${activeAccount.name}, ${activeAccount.age}`;
  heroAccountStatus.textContent = `@${activeAccount.username} • ${activeAccount.neighborhood} • verified`;
  savedAvatar.textContent = activeAccount.name.charAt(0).toUpperCase();
  savedName.textContent = `${activeAccount.name}, ${activeAccount.age}`;
  savedMeta.textContent = `@${activeAccount.username} • ${activeAccount.email} • ${activeAccount.favoriteSpot}`;
  savedAbout.textContent = activeAccount.about;
  savedInterests.innerHTML = "";

  activeAccount.interests.forEach((interest) => {
    const chip = document.createElement("span");
    chip.textContent = interest;
    savedInterests.appendChild(chip);
  });
}

function updateAuthGates() {
  const unlocked = Boolean(activeAccount);
  document.body.classList.toggle("is-signed-in", unlocked);
  authRequiredSections.forEach((section) => {
    section.classList.toggle("is-locked", !unlocked);
  });
}

function scoreProfile(profile) {
  if (!activeAccount) {
    return 0;
  }

  return profile.interests.filter((interest) => activeAccount.interests.includes(interest)).length;
}

function getOrderedProfiles() {
  return [...profiles]
    .filter((profile) => !currentMatches.includes(profile.id))
    .sort((a, b) => scoreProfile(b) - scoreProfile(a));
}

function renderCurrentMatch() {
  if (!activeAccount) {
    matchName.textContent = "Sign in to browse";
    matchDistance.textContent = "";
    matchAbout.textContent = "Nearby profiles unlock after you create an account and finish signing in.";
    matchTags.innerHTML = "<span>matching stays locked until you are signed in</span>";
    matchScore.textContent = "0 shared tags";
    return;
  }

  const ordered = getOrderedProfiles();
  const profile = ordered[currentMatchIndex % Math.max(ordered.length, 1)];

  if (!profile) {
    matchName.textContent = "No more profiles";
    matchDistance.textContent = "";
    matchAbout.textContent = "You have already worked through every nearby profile for this account.";
    matchTags.innerHTML = "<span>Keep chatting with your matches or come back later for more people nearby.</span>";
    matchScore.textContent = "0 shared tags";
    return;
  }

  const overlapCount = scoreProfile(profile);
  matchName.textContent = profile.name;
  matchDistance.textContent = profile.distance;
  matchAbout.textContent = profile.about;
  matchScore.textContent = `${overlapCount} shared ${overlapCount === 1 ? "tag" : "tags"}`;
  matchTags.innerHTML = "";

  profile.interests.forEach((interest) => {
    const chip = document.createElement("span");
    chip.textContent = interest;
    if (activeAccount.interests.includes(interest)) {
      chip.style.background = "#fff1d2";
    }
    matchTags.appendChild(chip);
  });
}

function renderLikesList() {
  likesList.innerHTML = "";

  if (!activeAccount || !currentMatches.length) {
    likesList.innerHTML = "<div><strong>No matches yet</strong><span>Sign in, browse nearby people, and match with someone to start a thread.</span></div>";
    return;
  }

  currentMatches
    .map((id) => profiles.find((profile) => profile.id === id))
    .filter(Boolean)
    .forEach((profile) => {
      const row = document.createElement("div");
      const overlapCount = scoreProfile(profile);
      row.innerHTML = `<strong>${profile.name}</strong><span>${profile.favoriteSpot} • ${profile.distance} • ${overlapCount} shared ${overlapCount === 1 ? "tag" : "tags"}</span>`;
      likesList.appendChild(row);
    });
}

function renderPickers() {
  threadPicker.innerHTML = "";
  questMatchPicker.innerHTML = "";

  if (!activeAccount || !currentMatches.length) {
    threadPicker.innerHTML = "<option value=\"\">No matched profiles yet</option>";
    questMatchPicker.innerHTML = "<option value=\"\">No matched profiles yet</option>";
    return;
  }

  currentMatches.forEach((id) => {
    const profile = profiles.find((entry) => entry.id === id);
    if (!profile) {
      return;
    }

    const optionA = document.createElement("option");
    optionA.value = profile.id;
    optionA.textContent = profile.name;
    threadPicker.appendChild(optionA);

    const optionB = document.createElement("option");
    optionB.value = profile.id;
    optionB.textContent = profile.name;
    questMatchPicker.appendChild(optionB);
  });
}

function updateInteractionStates() {
  const hasAccount = Boolean(activeAccount);
  const hasMatches = hasAccount && currentMatches.length > 0;
  const needsVerification = Boolean(pendingVerificationEmail);

  skipMatchButton.disabled = !hasAccount;
  likeMatchButton.disabled = !hasAccount;
  sendCodeButton.disabled = !needsVerification;
  verifyCodeButton.disabled = !needsVerification;
  threadPicker.disabled = !hasMatches;
  questMatchPicker.disabled = !hasMatches;
  messageInput.disabled = !hasMatches;
  spinQuestButton.disabled = !hasAccount;
  saveQuestButton.disabled = !hasMatches;
}

async function renderMessages() {
  threadList.innerHTML = "";

  if (!activeAccount || !threadPicker.value) {
    threadList.innerHTML = "<div><strong>No messages yet</strong><span>Match with someone first, then start chatting.</span></div>";
    return;
  }

  const { messages } = await api(`/messages?profileId=${encodeURIComponent(threadPicker.value)}`);

  if (!messages.length) {
    threadList.innerHTML = "<div><strong>Start the thread</strong><span>Send your first message to get this conversation going.</span></div>";
    return;
  }

  messages.forEach((entry) => {
    const row = document.createElement("div");
    row.innerHTML = `<strong>${entry.sender}</strong><span>${entry.text}</span>`;
    threadList.appendChild(row);
  });
}

async function renderQuestHistory() {
  questHistory.innerHTML = "";

  if (!activeAccount) {
    questHistory.innerHTML = "<div><strong>No sidequests saved</strong><span>Sign in first to save plans to your matches.</span></div>";
    return;
  }

  const { quests: savedQuests } = await api("/quests");

  if (!savedQuests.length) {
    questHistory.innerHTML = "<div><strong>No sidequests saved</strong><span>Spin one and attach it to a match.</span></div>";
    return;
  }

  savedQuests.forEach((entry) => {
    const row = document.createElement("div");
    row.innerHTML = `<strong>${entry.match_name}</strong><span>${entry.title}</span>`;
    questHistory.appendChild(row);
  });
}

async function loadMatches() {
  if (!activeAccount) {
    currentMatches = [];
    return;
  }

  try {
    const { matches } = await api("/matches");
    currentMatches = matches.map((entry) => entry.profile_id);
  } catch {
    const fallback = await api("/likes");
    const entries = fallback.matches || fallback.likes || [];
    currentMatches = entries.map((entry) => entry.profile_id);
  }
}

async function refreshSignedInState() {
  renderKnownAccounts();
  renderActiveAccount();
  updateAuthGates();
  await loadMatches();
  renderCurrentMatch();
  renderLikesList();
  renderPickers();
  updateInteractionStates();
  await renderMessages();
  await renderQuestHistory();
}

async function loadMe() {
  const token = getToken();
  if (!token) {
    activeAccount = null;
    pendingVerificationEmail = "";
    await refreshSignedInState();
    return;
  }

  try {
    const { account } = await api("/auth/me");
    activeAccount = enrichAccount(account);
    pendingVerificationEmail = "";
    addKnownAccount(activeAccount);
    setFormFromAccount(activeAccount);
  } catch {
    setToken("");
    activeAccount = null;
  }

  await refreshSignedInState();
}

function spinQuest() {
  currentQuestIndex = (currentQuestIndex + 1) % quests.length;
  const quest = quests[currentQuestIndex];
  questTitle.textContent = quest.title;
  questDescription.textContent = quest.description;
  questXp.textContent = quest.xp;
  questBadge.textContent = quest.badge;
  questCard.classList.remove("is-popping");

  window.requestAnimationFrame(() => {
    questCard.classList.add("is-popping");
  });
}

async function requestVerificationCode(email) {
  return api("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

async function saveMatch(profileId) {
  try {
    return await api("/matches", {
      method: "POST",
      body: JSON.stringify({ profileId })
    });
  } catch {
    return api("/likes", {
      method: "POST",
      body: JSON.stringify({ profileId })
    });
  }
}

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const interests = getSelectedInterests();
  if (!interests.length) {
    accountStatus.textContent = "Pick at least one interest so Fringe can personalize your matches.";
    return;
  }

  const password = passwordField.value;
  const confirmPassword = confirmPasswordField.value;
  const username = normalizeUsername(usernameField.value);
  const email = emailField.value.trim().toLowerCase();

  if (!username) {
    accountStatus.textContent = "Choose a username before creating your account.";
    return;
  }

  if (password.length < 8) {
    accountStatus.textContent = "Password should be at least 8 characters.";
    return;
  }

  if (password !== confirmPassword) {
    accountStatus.textContent = "Passwords do not match.";
    return;
  }

  const account = {
    name: nameField.value.trim(),
    username,
    email,
    age: ageField.value.trim(),
    neighborhood: neighborhoodField.value.trim(),
    vibe: vibeField.value.trim(),
    favoriteSpot: spotField.value.trim(),
    about: aboutField.value.trim(),
    interests,
    password
  };

  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify(account)
    });

    addKnownAccount(account);
    renderKnownAccounts();
    loginIdentifierInput.value = account.username;
    accountPicker.value = account.username;
    loginPasswordInput.value = password;
    pendingVerificationEmail = "";
    accountStatus.textContent = `${account.name}'s account was created. Sign in with your username and password to finish your first verification.`;
    verifyStatus.textContent = "Your first sign-in will trigger the 6-digit verification step.";
    updateInteractionStates();
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

resetFormButton.addEventListener("click", () => {
  clearFormFields();
  accountStatus.textContent = "Form cleared.";
});

accountPicker.addEventListener("change", () => {
  if (accountPicker.value) {
    loginIdentifierInput.value = accountPicker.value;
  }
});

signInButton.addEventListener("click", async () => {
  const identifier = (loginIdentifierInput.value || accountPicker.value).trim();
  const email = resolveLoginEmail(identifier);
  const password = loginPasswordInput.value;
  pendingVerificationEmail = "";

  if (!email) {
    verifyStatus.textContent = "Enter a known username or a full email address to sign in.";
    return;
  }

  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setToken(result.token);
    activeAccount = enrichAccount(result.account, identifier);
    pendingVerificationEmail = "";
    addKnownAccount(activeAccount);
    setFormFromAccount(activeAccount);
    accountStatus.textContent = `${activeAccount.name} is now signed in.`;
    verifyStatus.textContent = "";
    verificationCodeInput.value = "";
    currentMatchIndex = 0;
    await refreshSignedInState();
  } catch (error) {
    if (error.payload?.needsVerification) {
      try {
        pendingVerificationEmail = email;
        const codeResult = await requestVerificationCode(email);
        const previewSuffix = codeResult.verificationPreviewCode
          ? ` Developer preview code: ${codeResult.verificationPreviewCode}`
          : "";
        verifyStatus.textContent = `This is your first sign-in, so we sent a 6-digit verification code to your email. Enter it below to finish signing in.${previewSuffix}`;
        updateInteractionStates();
      } catch (requestError) {
        verifyStatus.textContent = requestError.message;
      }
    } else {
      verifyStatus.textContent = error.message;
    }
  }
});

sendCodeButton.addEventListener("click", async () => {
  const identifier = (loginIdentifierInput.value || accountPicker.value).trim();
  const email = pendingVerificationEmail || resolveLoginEmail(identifier);

  if (!email) {
    verifyStatus.textContent = "Enter a known username or email before requesting a code.";
    return;
  }

  try {
    const result = await requestVerificationCode(email);
    const username = normalizeUsername(identifier.includes("@") ? email.split("@")[0] : identifier);
    addKnownAccount({ email, username });
    renderKnownAccounts();
    accountPicker.value = username;
    verifyStatus.textContent = result.verificationPreviewCode
      ? `Verification code sent. Developer preview code: ${result.verificationPreviewCode}`
      : "Verification code sent.";
    updateInteractionStates();
  } catch (error) {
    verifyStatus.textContent = error.message;
  }
});

verifyCodeButton.addEventListener("click", async () => {
  const identifier = (loginIdentifierInput.value || accountPicker.value).trim();
  const email = pendingVerificationEmail || resolveLoginEmail(identifier);
  const code = verificationCodeInput.value.trim();

  if (!email || !code) {
    verifyStatus.textContent = "Enter your username or email plus the verification code.";
    return;
  }

  try {
    const result = await api("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email, code })
    });

    setToken(result.token);
    activeAccount = enrichAccount(result.account, identifier);
    pendingVerificationEmail = "";
    addKnownAccount(activeAccount);
    setFormFromAccount(activeAccount);
    verifyStatus.textContent = "Account verified and signed in.";
    accountStatus.textContent = `${activeAccount.name}'s account is now active.`;
    verificationCodeInput.value = "";
    currentMatchIndex = 0;
    await refreshSignedInState();
  } catch (error) {
    verifyStatus.textContent = error.message;
  }
});

deleteAccountButton.addEventListener("click", async () => {
  if (!activeAccount) {
    verifyStatus.textContent = "Sign in before deleting the current account.";
    return;
  }

  try {
    await api("/accounts", { method: "DELETE" });
    removeKnownAccount(activeAccount.email);
    setToken("");
    activeAccount = null;
    pendingVerificationEmail = "";
    clearFormFields();
    loginIdentifierInput.value = "";
    loginPasswordInput.value = "";
    verificationCodeInput.value = "";
    verifyStatus.textContent = "";
    accountStatus.textContent = "Current account deleted.";
    currentMatchIndex = 0;
    await refreshSignedInState();
  } catch (error) {
    verifyStatus.textContent = error.message;
  }
});

skipMatchButton.addEventListener("click", () => {
  currentMatchIndex += 1;
  renderCurrentMatch();
});

likeMatchButton.addEventListener("click", async () => {
  if (!activeAccount) {
    accountStatus.textContent = "Sign in to start matching.";
    return;
  }

  const ordered = getOrderedProfiles();
  const profile = ordered[currentMatchIndex % Math.max(ordered.length, 1)];

  if (!profile) {
    accountStatus.textContent = "There are no more new profiles left for this account.";
    return;
  }

  try {
    await saveMatch(profile.id);
    accountStatus.textContent = `It's a match with ${profile.name}. You can message them now.`;
    currentMatchIndex = 0;
    await refreshSignedInState();
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

threadPicker.addEventListener("change", async () => {
  try {
    await renderMessages();
  } catch (error) {
    messageStatus.textContent = error.message;
  }
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeAccount || !threadPicker.value) {
    messageStatus.textContent = "Match with someone first, then choose them to send a message.";
    return;
  }

  const text = messageInput.value.trim();
  if (!text) {
    messageStatus.textContent = "Write a message before sending.";
    return;
  }

  const profile = profiles.find((entry) => entry.id === threadPicker.value);

  try {
    await api("/messages", {
      method: "POST",
      body: JSON.stringify({
        profileId: profile.id,
        sender: activeAccount.name,
        text
      })
    });

    await api("/messages", {
      method: "POST",
      body: JSON.stringify({
        profileId: profile.id,
        sender: profile.name.split(",")[0],
        text: `That sounds fun. ${profile.favoriteSpot} could work for me.`
      })
    });

    messageInput.value = "";
    messageStatus.textContent = `Message saved to your thread with ${profile.name}.`;
    await renderMessages();
  } catch (error) {
    messageStatus.textContent = error.message;
  }
});

spinQuestButton.addEventListener("click", () => {
  spinQuest();
});

saveQuestButton.addEventListener("click", async () => {
  if (!activeAccount || !questMatchPicker.value) {
    questStatus.textContent = "Match with someone first, then choose who should get this sidequest.";
    return;
  }

  const profile = profiles.find((entry) => entry.id === questMatchPicker.value);

  try {
    await api("/quests", {
      method: "POST",
      body: JSON.stringify({
        profileId: profile.id,
        matchName: profile.name,
        title: questTitle.textContent,
        description: questDescription.textContent,
        xp: questXp.textContent,
        badge: questBadge.textContent
      })
    });

    questStatus.textContent = `${questTitle.textContent} was saved for ${profile.name}.`;
    await renderQuestHistory();
  } catch (error) {
    questStatus.textContent = error.message;
  }
});

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-scroll-target");
    const target = document.getElementById(targetId);

    if (target?.hasAttribute("data-auth-required") && !activeAccount) {
      accountStatus.textContent = "Create an account and sign in first to unlock Fringe.";
      document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

(async () => {
  renderKnownAccounts();
  spinQuest();
  await loadMe();
})();
