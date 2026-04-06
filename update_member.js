const fs = require('fs');
const path = require('path');

// Gunakan URL asli langsung di GitHub Action karena tidak terkena CORS
const TARGET_URL = "https://sakurazaka46.com/s/s46/search/artist";

async function scrapeSakurazaka() {
  try {
    console.log("Memulai fetch data dari Sakurazaka46...");
    const response = await fetch(TARGET_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const htmlText = await response.text();
    // Regex untuk mengambil blok list member
    const memberBlocks = htmlText.match(/<li class="box"[\s\S]*?<\/li>/g);
    
    if (!memberBlocks) {
      console.error("Gagal menemukan blok member. Struktur web mungkin berubah.");
      process.exit(1);
    }

    const filePath = path.join(__dirname, 'blogprofil.json');
    let blogProfil = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Regex untuk membersihkan tag HTML
    const cleanTag = /<[^>]*>/g;

    for (const block of memberBlocks) {
      const nameMatch = block.match(/<p class="name">([\s\S]*?)<\/p>/);
      if (nameMatch) {
        const nameRomaji = nameMatch[1].replace(cleanTag, '').trim();
        const imgMatch = block.match(/<img src="([\s\S]*?)"/);
        const linkMatch = block.match(/<a href="([\s\S]*?)"/);
        const kanaMatch = block.match(/<p class="kana">([\s\S]*?)<\/p>/);

        let imgFullUrl = "";
        if (imgMatch) {
          const imgPath = imgMatch[1];
          imgFullUrl = imgPath.startsWith('http') ? imgPath : "https://sakurazaka46.com" + imgPath;
        }

        let linkFullUrl = "";
        if (linkMatch) {
          linkFullUrl = "https://sakurazaka46.com" + linkMatch[1].split('?')[0];
        }

        for (let key in blogProfil) {
          // Normalisasi perbandingan nama
          if (blogProfil[key].name_romaji.trim().toLowerCase() === nameRomaji.toLowerCase()) {
            blogProfil[key].img = imgFullUrl;
            blogProfil[key].link = linkFullUrl;
            if (kanaMatch) {
              blogProfil[key].name_jp = kanaMatch[1].replace(cleanTag, '').trim();
            }
            console.log(`✅ Updated: ${nameRomaji}`);
          }
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(blogProfil, null, 2), 'utf8');
    console.log("🎉 Berhasil memperbarui blogprofil.json");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

scrapeSakurazaka();
