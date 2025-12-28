const fallbackQuotes = [
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "You are capable of amazing things.", author: "Unknown" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Difficult roads often lead to beautiful destinations.", author: "Zig Ziglar" },
  { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "You don’t have to be perfect to be amazing.", author: "Unknown" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The harder you work for something, the greater you’ll feel when you achieve it.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
];

export async function getRandomQuote() {
  try {
    const res = await fetch('https://zenquotes.io/api/random');
    const data = await res.json();
    return {
      text: data[0].q,
      author: data[0].a,
    };
  } catch (e) {
    // Fallback to a random local quote if API fails or limit is reached
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    return fallbackQuotes[idx];
  }
}