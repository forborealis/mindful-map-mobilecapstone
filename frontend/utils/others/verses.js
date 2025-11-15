export async function getRandomVerse() {
  try {
    const res = await fetch('https://labs.bible.org/api/?passage=random&type=json');
    const data = await res.json();
    return {
      text: data[0].text,
      reference: `${data[0].bookname} ${data[0].chapter}:${data[0].verse}`,
    };
  } catch (e) {
    return {
      text: "I can do all things through Christ who strengthens me.",
      reference: "Philippians 4:13",
    };
  }
}