const quests = [
  {
    title: "Sunset snack crawl",
    description: "Pick a bakery neither of you has tried, rate pastries out of 10, and snap one chaotic mirror selfie.",
    xp: "+80 friendship XP",
    badge: "Badge: soft launch extrovert"
  },
  {
    title: "Bookstore blind date",
    description: "Choose a book for each other in under five minutes, then trade your most unhinged margin-note opinions over coffee.",
    xp: "+65 friendship XP",
    badge: "Badge: local lore keeper"
  },
  {
    title: "Tiny thrift mission",
    description: "You each have a $12 budget to find one iconic item for the other person and defend the pick with full sincerity.",
    xp: "+90 friendship XP",
    badge: "Badge: treasure hunter duo"
  },
  {
    title: "Late library lock-in",
    description: "Meet for a focused study sprint, reward yourselves with matcha after, and build a playlist for your next session.",
    xp: "+70 friendship XP",
    badge: "Badge: study legend"
  },
  {
    title: "Arcade chaos route",
    description: "Hit a nearby arcade, alternate game picks, and crown the loser keeper of the friendship photo booth strips.",
    xp: "+95 friendship XP",
    badge: "Badge: joystick soulmate"
  }
];

const questButton = document.querySelector("#quest-button");
const questCard = document.querySelector("#quest-card");
const questTitle = document.querySelector("#quest-title");
const questDescription = document.querySelector("#quest-description");
const questXp = document.querySelector("#quest-xp");
const questBadge = document.querySelector("#quest-badge");
const waitlistForm = document.querySelector(".waitlist-form");

let questIndex = 0;

if (questButton && questCard) {
  questButton.addEventListener("click", () => {
    questIndex = (questIndex + 1) % quests.length;
    const quest = quests[questIndex];

    questCard.classList.remove("is-popping");
    window.requestAnimationFrame(() => {
      questTitle.textContent = quest.title;
      questDescription.textContent = quest.description;
      questXp.textContent = quest.xp;
      questBadge.textContent = quest.badge;
      questCard.classList.add("is-popping");
    });
  });
}

if (waitlistForm) {
  waitlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = waitlistForm.querySelector("button");
    const input = waitlistForm.querySelector("input");

    if (!button || !input) {
      return;
    }

    button.textContent = "You're in the circle";
    button.disabled = true;
    input.value = "";
    input.placeholder = "Invite sent to your future besties";
  });
}
