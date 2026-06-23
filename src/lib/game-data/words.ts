export interface WordEntry {
  word: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export const WORD_DATABASE: WordEntry[] = [
  // Animals
  { word: "Dolphin", category: "Animals", difficulty: "easy" },
  { word: "Penguin", category: "Animals", difficulty: "easy" },
  { word: "Chameleon", category: "Animals", difficulty: "medium" },
  { word: "Platypus", category: "Animals", difficulty: "medium" },
  { word: "Axolotl", category: "Animals", difficulty: "hard" },
  { word: "Narwhal", category: "Animals", difficulty: "medium" },
  { word: "Fennec Fox", category: "Animals", difficulty: "medium" },
  { word: "Capybara", category: "Animals", difficulty: "medium" },
  { word: "Quokka", category: "Animals", difficulty: "hard" },
  { word: "Pangolin", category: "Animals", difficulty: "hard" },
  { word: "Tiger", category: "Animals", difficulty: "easy" },
  { word: "Elephant", category: "Animals", difficulty: "easy" },
  { word: "Giraffe", category: "Animals", difficulty: "easy" },
  { word: "Octopus", category: "Animals", difficulty: "easy" },
  { word: "Kangaroo", category: "Animals", difficulty: "easy" },

  // Food & Drinks
  { word: "Sushi", category: "Food & Drinks", difficulty: "easy" },
  { word: "Tacos", category: "Food & Drinks", difficulty: "easy" },
  { word: "Fondue", category: "Food & Drinks", difficulty: "medium" },
  { word: "Tiramisu", category: "Food & Drinks", difficulty: "medium" },
  { word: "Kimchi", category: "Food & Drinks", difficulty: "hard" },
  { word: "Pretzels", category: "Food & Drinks", difficulty: "easy" },
  { word: "Croissant", category: "Food & Drinks", difficulty: "medium" },
  { word: "Bubble Tea", category: "Food & Drinks", difficulty: "easy" },
  { word: "Pho", category: "Food & Drinks", difficulty: "medium" },
  { word: "Paella", category: "Food & Drinks", difficulty: "hard" },
  { word: "Gelato", category: "Food & Drinks", difficulty: "medium" },
  { word: "Ramen", category: "Food & Drinks", difficulty: "easy" },
  { word: "Avocado", category: "Food & Drinks", difficulty: "easy" },
  { word: "Espresso", category: "Food & Drinks", difficulty: "easy" },
  { word: "Mochi", category: "Food & Drinks", difficulty: "medium" },

  // Technology
  { word: "Smartphone", category: "Technology", difficulty: "easy" },
  { word: "Blockchain", category: "Technology", difficulty: "hard" },
  { word: "Artificial Intelligence", category: "Technology", difficulty: "medium" },
  { word: "Quantum Computer", category: "Technology", difficulty: "hard" },
  { word: "Virtual Reality", category: "Technology", difficulty: "medium" },
  { word: "Satellite", category: "Technology", difficulty: "medium" },
  { word: "Microchip", category: "Technology", difficulty: "medium" },
  { word: "3D Printer", category: "Technology", difficulty: "medium" },
  { word: "Solar Panel", category: "Technology", difficulty: "easy" },
  { word: "Drone", category: "Technology", difficulty: "easy" },
  { word: "Wi-Fi Router", category: "Technology", difficulty: "easy" },
  { word: "Electric Car", category: "Technology", difficulty: "easy" },
  { word: "Smartwatch", category: "Technology", difficulty: "easy" },
  { word: "Podcast", category: "Technology", difficulty: "easy" },
  { word: "Algorithm", category: "Technology", difficulty: "hard" },

  // Sports
  { word: "Skateboarding", category: "Sports", difficulty: "easy" },
  { word: "Fencing", category: "Sports", difficulty: "medium" },
  { word: "Curling", category: "Sports", difficulty: "medium" },
  { word: "Polo", category: "Sports", difficulty: "hard" },
  { word: "Synchronized Swimming", category: "Sports", difficulty: "medium" },
  { word: "Archery", category: "Sports", difficulty: "easy" },
  { word: "Rock Climbing", category: "Sports", difficulty: "medium" },
  { word: "Bobsled", category: "Sports", difficulty: "medium" },
  { word: "Triathlon", category: "Sports", difficulty: "hard" },
  { word: "Badminton", category: "Sports", difficulty: "easy" },
  { word: "Basketball", category: "Sports", difficulty: "easy" },
  { word: "Surfing", category: "Sports", difficulty: "easy" },
  { word: "Gymnastics", category: "Sports", difficulty: "easy" },
  { word: "Soccer", category: "Sports", difficulty: "easy" },
  { word: "Boxing", category: "Sports", difficulty: "easy" },

  // Places
  { word: "Tokyo", category: "Places", difficulty: "easy" },
  { word: "Machu Picchu", category: "Places", difficulty: "medium" },
  { word: "Great Wall", category: "Places", difficulty: "easy" },
  { word: "Patagonia", category: "Places", difficulty: "hard" },
  { word: "Sahara Desert", category: "Places", difficulty: "easy" },
  { word: "Venice", category: "Places", difficulty: "easy" },
  { word: "Amazon Rainforest", category: "Places", difficulty: "medium" },
  { word: "Everest Base Camp", category: "Places", difficulty: "medium" },
  { word: "Colosseum", category: "Places", difficulty: "easy" },
  { word: "Antarctica", category: "Places", difficulty: "medium" },
  { word: "Las Vegas", category: "Places", difficulty: "easy" },
  { word: "Stonehenge", category: "Places", difficulty: "medium" },
  { word: "Niagara Falls", category: "Places", difficulty: "easy" },
  { word: "Eiffel Tower", category: "Places", difficulty: "easy" },
  { word: "Taj Mahal", category: "Places", difficulty: "easy" },

  // Movies & TV
  { word: "Inception", category: "Movies & TV", difficulty: "easy" },
  { word: "Breaking Bad", category: "Movies & TV", difficulty: "easy" },
  { word: "The Matrix", category: "Movies & TV", difficulty: "easy" },
  { word: "Game of Thrones", category: "Movies & TV", difficulty: "easy" },
  { word: "Black Mirror", category: "Movies & TV", difficulty: "medium" },
  { word: "Parasite", category: "Movies & TV", difficulty: "medium" },
  { word: "Stranger Things", category: "Movies & TV", difficulty: "easy" },
  { word: "The Witcher", category: "Movies & TV", difficulty: "easy" },
  { word: "Interstellar", category: "Movies & TV", difficulty: "medium" },
  { word: "Pulp Fiction", category: "Movies & TV", difficulty: "medium" },
  { word: "Avatar", category: "Movies & TV", difficulty: "easy" },
  { word: "The Dark Knight", category: "Movies & TV", difficulty: "easy" },
  { word: "Forrest Gump", category: "Movies & TV", difficulty: "easy" },
  { word: "Shrek", category: "Movies & TV", difficulty: "easy" },
  { word: "Squid Game", category: "Movies & TV", difficulty: "easy" },

  // Music
  { word: "Guitar", category: "Music", difficulty: "easy" },
  { word: "Jazz", category: "Music", difficulty: "easy" },
  { word: "Symphony Orchestra", category: "Music", difficulty: "medium" },
  { word: "Vinyl Record", category: "Music", difficulty: "easy" },
  { word: "Music Festival", category: "Music", difficulty: "easy" },
  { word: "Beatboxing", category: "Music", difficulty: "medium" },
  { word: "Theremin", category: "Music", difficulty: "hard" },
  { word: "Karaoke", category: "Music", difficulty: "easy" },
  { word: "DJ Turntable", category: "Music", difficulty: "medium" },
  { word: "Accordion", category: "Music", difficulty: "medium" },

  // Science
  { word: "Black Hole", category: "Science", difficulty: "easy" },
  { word: "DNA Helix", category: "Science", difficulty: "medium" },
  { word: "Periodic Table", category: "Science", difficulty: "medium" },
  { word: "Telescope", category: "Science", difficulty: "easy" },
  { word: "Earthquake", category: "Science", difficulty: "easy" },
  { word: "Photosynthesis", category: "Science", difficulty: "medium" },
  { word: "Atom Bomb", category: "Science", difficulty: "easy" },
  { word: "Volcano", category: "Science", difficulty: "easy" },
  { word: "Supernova", category: "Science", difficulty: "medium" },
  { word: "Fossil", category: "Science", difficulty: "easy" },

  // Professions
  { word: "Surgeon", category: "Professions", difficulty: "easy" },
  { word: "Astronaut", category: "Professions", difficulty: "easy" },
  { word: "Sommelier", category: "Professions", difficulty: "hard" },
  { word: "Archaeologist", category: "Professions", difficulty: "medium" },
  { word: "Cryptographer", category: "Professions", difficulty: "hard" },
  { word: "Firefighter", category: "Professions", difficulty: "easy" },
  { word: "Diplomat", category: "Professions", difficulty: "medium" },
  { word: "Marine Biologist", category: "Professions", difficulty: "medium" },
  { word: "Chef", category: "Professions", difficulty: "easy" },
  { word: "Hacker", category: "Professions", difficulty: "easy" },

  // Fantasy & Mythology
  { word: "Dragon", category: "Fantasy & Mythology", difficulty: "easy" },
  { word: "Unicorn", category: "Fantasy & Mythology", difficulty: "easy" },
  { word: "Werewolf", category: "Fantasy & Mythology", difficulty: "easy" },
  { word: "Mermaid", category: "Fantasy & Mythology", difficulty: "easy" },
  { word: "Phoenix", category: "Fantasy & Mythology", difficulty: "easy" },
  { word: "Centaur", category: "Fantasy & Mythology", difficulty: "medium" },
  { word: "Medusa", category: "Fantasy & Mythology", difficulty: "medium" },
  { word: "Minotaur", category: "Fantasy & Mythology", difficulty: "medium" },
  { word: "Kraken", category: "Fantasy & Mythology", difficulty: "medium" },
  { word: "Chimera", category: "Fantasy & Mythology", difficulty: "hard" },

  // Everyday Objects
  { word: "Umbrella", category: "Everyday Objects", difficulty: "easy" },
  { word: "Hourglass", category: "Everyday Objects", difficulty: "easy" },
  { word: "Compass", category: "Everyday Objects", difficulty: "easy" },
  { word: "Magnifying Glass", category: "Everyday Objects", difficulty: "easy" },
  { word: "Metronome", category: "Everyday Objects", difficulty: "medium" },
  { word: "Microscope", category: "Everyday Objects", difficulty: "medium" },
  { word: "Kaleidoscope", category: "Everyday Objects", difficulty: "medium" },
  { word: "Abacus", category: "Everyday Objects", difficulty: "hard" },
  { word: "Polaroid Camera", category: "Everyday Objects", difficulty: "medium" },
  { word: "Typewriter", category: "Everyday Objects", difficulty: "easy" },
];

export const CATEGORIES = [...new Set(WORD_DATABASE.map((w) => w.category))];

export function getRandomWord(excludeCategories?: string[]): WordEntry {
  const available = excludeCategories
    ? WORD_DATABASE.filter((w) => !excludeCategories.includes(w.category))
    : WORD_DATABASE;
  return available[Math.floor(Math.random() * available.length)];
}

export function getWordByCategory(category: string): WordEntry | null {
  const words = WORD_DATABASE.filter((w) => w.category === category);
  if (words.length === 0) return null;
  return words[Math.floor(Math.random() * words.length)];
}

export function getTwoRelatedWords(category: string): [WordEntry, WordEntry] | null {
  const words = WORD_DATABASE.filter((w) => w.category === category);
  if (words.length < 2) return null;
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export function getMisleadingWord(correctWord: WordEntry): string {
  // Get a word from same category that's different
  const sameCategory = WORD_DATABASE.filter(
    (w) => w.category === correctWord.category && w.word !== correctWord.word
  );
  if (sameCategory.length > 0) {
    return sameCategory[Math.floor(Math.random() * sameCategory.length)].word;
  }
  // Fallback: different category
  const different = WORD_DATABASE.filter((w) => w.category !== correctWord.category);
  return different[Math.floor(Math.random() * different.length)].word;
}

export function getChaosWords(): { word1: WordEntry; word2: WordEntry } {
  const cats = [...CATEGORIES].sort(() => Math.random() - 0.5);
  const cat1Words = WORD_DATABASE.filter((w) => w.category === cats[0]);
  const cat2Words = WORD_DATABASE.filter((w) => w.category === cats[1]);
  return {
    word1: cat1Words[Math.floor(Math.random() * cat1Words.length)],
    word2: cat2Words[Math.floor(Math.random() * cat2Words.length)],
  };
}
