// Step 2: sort the Italian brainrot characters into the right bins.

type BinId = "shoes" | "food" | "armed";

interface SortCharacter {
  id: string;
  name: string;
  image: string;
  bin: BinId;
}

const SORT_CHARACTERS: SortCharacter[] = [
  { id: "tralalero", name: "Tralalero Tralala", image: "assets/brainrot/tralalero-tralala.jpg", bin: "shoes" },
  { id: "lirili", name: "Lirilì Larilà", image: "assets/brainrot/lirili-larila.jpg", bin: "shoes" },
  { id: "ballerina", name: "Ballerina Cappuccina", image: "assets/brainrot/ballerina-cappuccina.jpg", bin: "food" },
  { id: "chimpanzini", name: "Chimpanzini Bananini", image: "assets/brainrot/chimpanzini-bananini.jpg", bin: "food" },
  { id: "tung", name: "Tung Tung Tung Sahur", image: "assets/brainrot/tung-tung-tung-sahur.jpg", bin: "armed" },
  { id: "bombardiro", name: "Bombardiro Crocodilo", image: "assets/brainrot/bombardiro-crocodilo.jpg", bin: "armed" },
];

let selectedCard: HTMLElement | null = null;
let sortWired = false;

function startSorting(): void {
  if (!sortWired) wireSorting();
  buildSortCards();
  showScreen("sort");
}

function buildSortCards(): void {
  selectedCard = null;
  document.querySelectorAll(".bin-items").forEach((b) => b.replaceChildren());
  const pool = byId("sort-pool");
  pool.replaceChildren(...shuffle(SORT_CHARACTERS).map(makeCharacterCard));
}

function makeCharacterCard(c: SortCharacter): HTMLElement {
  const card = document.createElement("div");
  card.className = "char-card";
  card.draggable = false; // the drifting cursor only does clicks
  card.dataset.id = c.id;
  card.innerHTML = `<img src="${c.image}" alt="${c.name}" draggable="false"><span>${c.name}</span>`;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer?.setData("text/plain", c.id);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    if (selectedCard) selectedCard.classList.remove("selected");
    selectedCard = selectedCard === card ? null : card;
    selectedCard?.classList.add("selected");
  });
  return card;
}

function wireSorting(): void {
  sortWired = true;

  document.querySelectorAll<HTMLElement>(".bin").forEach((bin) => {
    const items = bin.querySelector<HTMLElement>(".bin-items")!;
    bin.addEventListener("dragover", (e) => { e.preventDefault(); bin.classList.add("over"); });
    bin.addEventListener("dragleave", () => bin.classList.remove("over"));
    bin.addEventListener("drop", (e) => {
      e.preventDefault();
      bin.classList.remove("over");
      const id = e.dataTransfer?.getData("text/plain");
      const card = id ? document.querySelector<HTMLElement>(`.char-card[data-id="${id}"]`) : null;
      if (card) items.appendChild(card);
    });
    bin.addEventListener("click", () => {
      if (!selectedCard) return;
      selectedCard.classList.remove("selected");
      items.appendChild(selectedCard);
      selectedCard = null;
    });
  });

  // Dropping back into the pool is allowed too.
  const pool = byId("sort-pool");
  pool.addEventListener("dragover", (e) => e.preventDefault());
  pool.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer?.getData("text/plain");
    const card = id ? document.querySelector<HTMLElement>(`.char-card[data-id="${id}"]`) : null;
    if (card) pool.appendChild(card);
  });

  byId("sort-verify").addEventListener("click", verifySorting);
  // The big shiny button is "CANCEL". It sends you all the way back.
  byId("sort-reset").addEventListener("click", () => {
    flash("Cancelled. Back to square one 🙂");
    startRobotQuestions();
  });
}

function verifySorting(): void {
  if (byId("sort-pool").children.length > 0) {
    flash("You left some characters homeless. Sort ALL of them.");
    return;
  }
  const allCorrect = Array.from(document.querySelectorAll<HTMLElement>(".bin")).every((bin) => {
    const binId = bin.dataset.bin as BinId;
    return Array.from(bin.querySelectorAll<HTMLElement>(".char-card")).every((card) => {
      const c = SORT_CHARACTERS.find((x) => x.id === card.dataset.id);
      return c?.bin === binId;
    });
  });

  if (allCorrect) {
    flash("✅ Verified human. Probably.");
    startLogin();
  } else {
    flash("❌ Wrong bins. Only a robot would sort like that. Starting over.");
    startRobotQuestions();
  }
}
