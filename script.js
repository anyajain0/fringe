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
  activeEmail: "fringe-active-email",
  knownEmails: "fringe-known-emails"
};

const accountForm = document.querySelector("#account-form");
const resetFormButton = document.querySelector("#reset-form");
const lookupEmailInput = document.querySelector("#lookup-email");
const accountPicker = document.querySelector("#account-picker");
const signInButton = document.querySelector("#sign-in-account");
const deleteAccountButton = document.querySelector("#delete-account");
const accountStatus = document.querySelector("#account-status");

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

let activeAccount = null;
let currentMatchIndex = 0;
let currentQuestIndex = 0;
let currentLikes = [];

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

function getKnownEmails() {
  return loadLocal(localKeys.knownEmails, []);
}

function setKnownEmails(emails) {
  saveLocal(localKeys.knownEmails, emails);
}

function addKnownEmail(email) {
  const emails = getKnownEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    setKnownEmails(emails);
  }
}

function removeKnownEmail(email) {
  setKnownEmails(getKnownEmails().filter((entry) => entry !== email));
}

function setActiveEmail(email) {
  saveLocal(localKeys.activeEmail, email || "");
}

function getActiveEmail() {
  return loadLocal(localKeys.activeEmail, "");
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function getSelectedInterests() {
  return Array.from(document.querySelectorAll('input[name="interests"]:checked')).map((input) => input.value);
}

function setFormFromAccount(account) {
  accountForm.name.value = account.name;
  accountForm.email.value = account.email;
  accountForm.age.value = account.age;
  accountForm.neighborhood.value = account.neighborhood;
  accountForm.vibe.value = account.vibe;
  accountForm.spot.value = account.favoriteSpot;
  accountForm.about.value = account.about;

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

function renderKnownEmails() {
  const emails = getKnownEmails();
  accountPicker.innerHTML = "";

  if (!emails.length) {
    accountPicker.innerHTML = "<option value=\"\">No known accounts yet</option>";
    return;
  }

  emails.forEach((email) => {
    const option = document.createElement("option");
    option.value = email;
    option.textContent = email;
    accountPicker.appendChild(option);
  });

  const activeEmail = getActiveEmail();
  if (activeEmail) {
    accountPicker.value = activeEmail;
  }
}

function renderActiveAccount() {
  if (!activeAccount) {
    heroAccountName.textContent = "No account yet";
    heroAccountStatus.textContent = "Create an account to unlock saved matches, messages, and quests.";
    savedAvatar.textContent = "F";
    savedName.textContent = "No active account";
    savedMeta.textContent = "Create or sign in to get started";
    savedAbout.textContent = "This panel updates when you save or sign in to an account.";
    savedInterests.innerHTML = "<span>nothing saved yet</span>";
    return;
  }

  heroAccountName.textContent = `${activeAccount.name}, ${activeAccount.age}`;
  heroAccountStatus.textContent = `${activeAccount.neighborhood} • ${activeAccount.vibe} • ${activeAccount.email}`;
  savedAvatar.textContent = activeAccount.name.charAt(0).toUpperCase();
  savedName.textContent = `${activeAccount.name}, ${activeAccount.age}`;
  savedMeta.textContent = `${activeAccount.neighborhood} • ${activeAccount.favoriteSpot}`;
  savedAbout.textContent = activeAccount.about;
  savedInterests.innerHTML = "";

  activeAccount.interests.forEach((interest) => {
    const chip = document.createElement("span");
    chip.textContent = interest;
    savedInterests.appendChild(chip);
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
    .filter((profile) => !currentLikes.includes(profile.id))
    .sort((a, b) => scoreProfile(b) - scoreProfile(a));
}

function renderCurrentMatch() {
  const ordered = getOrderedProfiles();
  const profile = ordered[currentMatchIndex % Math.max(ordered.length, 1)];

  if (!profile) {
    matchName.textContent = "No more profiles";
    matchDistance.textContent = "";
    matchAbout.textContent = "You have already liked every demo profile for this account.";
    matchTags.innerHTML = "<span>Try another account or keep messaging your matches.</span>";
    return;
  }

  matchName.textContent = profile.name;
  matchDistance.textContent = profile.distance;
  matchAbout.textContent = profile.about;
  matchTags.innerHTML = "";

  profile.interests.forEach((interest) => {
    const chip = document.createElement("span");
    chip.textContent = interest;
    if (activeAccount && activeAccount.interests.includes(interest)) {
      chip.style.background = "#fff15a";
    }
    matchTags.appendChild(chip);
  });
}

function renderLikesList() {
  likesList.innerHTML = "";

  if (!activeAccount || !currentLikes.length) {
    likesList.innerHTML = "<div><strong>No likes yet</strong><span>Save an account and like someone nearby.</span></div>";
    return;
  }

  currentLikes
    .map((id) => profiles.find((profile) => profile.id === id))
    .filter(Boolean)
    .forEach((profile) => {
      const row = document.createElement("div");
      row.innerHTML = `<strong>${profile.name}</strong><span>${profile.favoriteSpot} • ${profile.distance}</span>`;
      likesList.appendChild(row);
    });
}

function renderPickers() {
  threadPicker.innerHTML = "";
  questMatchPicker.innerHTML = "";

  if (!activeAccount || !currentLikes.length) {
    threadPicker.innerHTML = "<option value=\"\">No liked profiles yet</option>";
    questMatchPicker.innerHTML = "<option value=\"\">No liked profiles yet</option>";
    return;
  }

  currentLikes.forEach((id) => {
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

async function renderMessages() {
  threadList.innerHTML = "";

  if (!activeAccount || !threadPicker.value) {
    threadList.innerHTML = "<div><strong>No messages yet</strong><span>Like someone first, then start chatting.</span></div>";
    return;
  }

  const { messages } = await api(`/messages?email=${encodeURIComponent(activeAccount.email)}&profileId=${encodeURIComponent(threadPicker.value)}`);

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
    questHistory.innerHTML = "<div><strong>No sidequests saved</strong><span>Spin one and attach it to a liked profile.</span></div>";
    return;
  }

  const { quests: savedQuests } = await api(`/quests?email=${encodeURIComponent(activeAccount.email)}`);

  if (!savedQuests.length) {
    questHistory.innerHTML = "<div><strong>No sidequests saved</strong><span>Spin one and attach it to a liked profile.</span></div>";
    return;
  }

  savedQuests.forEach((entry) => {
    const row = document.createElement("div");
    row.innerHTML = `<strong>${entry.match_name}</strong><span>${entry.title}</span>`;
    questHistory.appendChild(row);
  });
}

async function loadLikes() {
  if (!activeAccount) {
    currentLikes = [];
    return;
  }

  const { likes } = await api(`/likes?email=${encodeURIComponent(activeAccount.email)}`);
  currentLikes = likes.map((entry) => entry.profile_id);
}

async function refreshSignedInState() {
  renderKnownEmails();
  renderActiveAccount();
  await loadLikes();
  renderCurrentMatch();
  renderLikesList();
  renderPickers();
  await renderMessages();
  await renderQuestHistory();
}

async function signInWithEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();

  if (!normalized) {
    accountStatus.textContent = "Enter or choose an email to sign in.";
    return;
  }

  const { account } = await api(`/accounts?email=${encodeURIComponent(normalized)}`);

  if (!account) {
    accountStatus.textContent = "No saved account exists for that email on the backend yet.";
    return;
  }

  activeAccount = account;
  addKnownEmail(account.email);
  setActiveEmail(account.email);
  setFormFromAccount(account);
  accountStatus.textContent = `${account.name} is now signed in.`;
  currentMatchIndex = 0;
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

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const interests = getSelectedInterests();
  if (!interests.length) {
    accountStatus.textContent = "Pick at least one interest so Fringe can personalize your matches.";
    return;
  }

  const account = {
    name: accountForm.name.value.trim(),
    email: accountForm.email.value.trim().toLowerCase(),
    age: accountForm.age.value.trim(),
    neighborhood: accountForm.neighborhood.value.trim(),
    vibe: accountForm.vibe.value.trim(),
    favoriteSpot: accountForm.spot.value.trim(),
    about: accountForm.about.value.trim(),
    interests
  };

  try {
    await api("/accounts", {
      method: "POST",
      body: JSON.stringify(account)
    });

    activeAccount = account;
    addKnownEmail(account.email);
    setActiveEmail(account.email);
    currentMatchIndex = 0;
    accountStatus.textContent = `${account.name}'s account is saved on the backend and active here.`;
    await refreshSignedInState();
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

resetFormButton.addEventListener("click", () => {
  clearFormFields();
  accountStatus.textContent = "Form cleared.";
});

signInButton.addEventListener("click", async () => {
  try {
    await signInWithEmail(lookupEmailInput.value || accountPicker.value);
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

deleteAccountButton.addEventListener("click", async () => {
  const targetEmail = (lookupEmailInput.value || accountPicker.value || getActiveEmail()).trim().toLowerCase();

  if (!targetEmail) {
    accountStatus.textContent = "Choose an email to delete.";
    return;
  }

  try {
    await api(`/accounts?email=${encodeURIComponent(targetEmail)}`, {
      method: "DELETE"
    });

    removeKnownEmail(targetEmail);

    if (activeAccount && activeAccount.email === targetEmail) {
      activeAccount = null;
      setActiveEmail("");
      clearFormFields();
    }

    accountStatus.textContent = "Selected account deleted from the backend.";
    currentMatchIndex = 0;
    await refreshSignedInState();
  } catch (error) {
    accountStatus.textContent = error.message;
  }
});

skipMatchButton.addEventListener("click", () => {
  currentMatchIndex += 1;
  renderCurrentMatch();
});

likeMatchButton.addEventListener("click", async () => {
  if (!activeAccount) {
    accountStatus.textContent = "Create or sign in to an account before liking profiles.";
    return;
  }

  const ordered = getOrderedProfiles();
  const profile = ordered[currentMatchIndex % Math.max(ordered.length, 1)];

  if (!profile) {
    accountStatus.textContent = "There are no more new profiles left for this account.";
    return;
  }

  try {
    await api("/likes", {
      method: "POST",
      body: JSON.stringify({
        email: activeAccount.email,
        profileId: profile.id
      })
    });

    accountStatus.textContent = `${profile.name} was saved to your likes.`;
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
    messageStatus.textContent = "Like someone first, then choose them to send a message.";
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
        email: activeAccount.email,
        profileId: profile.id,
        sender: activeAccount.name,
        text
      })
    });

    await api("/messages", {
      method: "POST",
      body: JSON.stringify({
        email: activeAccount.email,
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
    questStatus.textContent = "Like someone first, then choose who should get this sidequest.";
    return;
  }

  const profile = profiles.find((entry) => entry.id === questMatchPicker.value);

  try {
    await api("/quests", {
      method: "POST",
      body: JSON.stringify({
        email: activeAccount.email,
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

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

(async () => {
  renderKnownEmails();
  const activeEmail = getActiveEmail();

  if (activeEmail) {
    try {
      await signInWithEmail(activeEmail);
      return;
    } catch {
      setActiveEmail("");
    }
  }

  await refreshSignedInState();
})();
