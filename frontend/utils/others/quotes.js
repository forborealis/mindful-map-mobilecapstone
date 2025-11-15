export async function getRandomQuote() {
  try {
    const res = await fetch('https://api.quotable.io/random?tags=inspirational|motivational|success|life');
    const data = await res.json();
    return {
      text: data.content,
      author: data.author,
    };
  } catch (e) {
    return {
      text: "Stay positive and keep moving forward!",
      author: "Unknown",
    };
  }
}