// fetch_boxscores.js
import fs from 'fs';
import path from 'path';

// Αλλάζεις εδώ τα gamecodes που θέλεις να κατεβάσεις
const gamecodes = Array.from({length: 306}, (_, i) => i + 1); // Όλη η σεζόν (1-306)
// Ή για τεστ μπορείς να χρησιμοποιήσεις:
// const gamecodes = Array.from({length: 50}, (_, i) => i + 1); // Πρώτα 50 παιχνίδια

const seasoncode = "E2025";
const outputDir = path.resolve('./samples');

// Δημιουργούμε τον φάκελο αν δεν υπάρχει
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function fetchBoxscore(gamecode) {
  const url = `https://live.euroleague.net/api/Boxscore?gamecode=${gamecode}&seasoncode=${seasoncode}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.error(`Gamecode ${gamecode}: HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    const filePath = path.join(outputDir, `boxscore_${gamecode}_${seasoncode}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved boxscore for gamecode ${gamecode}`);
  } catch (err) {
    console.error(`Error fetching gamecode ${gamecode}:`, err.message);
  }
}

async function main() {
  for (const gamecode of gamecodes) {
    await fetchBoxscore(gamecode);
    // Προαιρετικό delay για να μην μπουκάρει το server
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('All done!');
}

main();
