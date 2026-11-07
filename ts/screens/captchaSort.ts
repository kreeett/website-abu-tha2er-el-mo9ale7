// Step 2: sort the placeholder brainrot characters into the right bins.
// Swap the SVGs in assets/brainrot/ for real images any time (keep the file names,
// or edit the list below).

type BinId = "sea" | "food" | "flying";

interface SortCharacter {
  id: string;
  name: string;
  image: string;
  bin: BinId;
}

const SORT_CHARACTERS: SortCharacter[] = [
  { id: "pescolino", name: "Pescolino Occhialini", image: "assets/brainrot/pescolino.svg", bin: "sea" },
  { id: "polpo", name: "Polpo Cappellone", image: "assets/brainrot/polpo.svg", bin: "sea" },
  { id: "pizzaroni", name: "Pizzaroni Camminatore", image: "assets/brainrot/pizzaroni.svg", bin: "food" },
  { id: "bananino", name: "Bananino Baffuto", image: "assets/brainrot/bananino.svg", bin: "food" },
  { id: "tostapane", name: "Tostapane Volante", image: "assets/brainrot/tostapane.svg", bin: "flying" },
  { id: "cactusso", name: "Cactusso Elicottero", image: "assets/brainrot/cactusso.svg", bin: "flying" },
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
  card.draggable = true;
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
