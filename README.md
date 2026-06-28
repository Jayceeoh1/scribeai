# 🎬 YT → Trello

Extrage transcriptul unui video YouTube, îl traduce cu Claude AI și creează automat un card pe Trello cu scriptul atașat ca fișier `.txt`.

## Deploy pe Vercel (1 click)

1. **Fork sau upload** acest folder pe GitHub
2. Mergi pe [vercel.com](https://vercel.com) → **New Project** → importă repo-ul
3. La pasul **Environment Variables** adaugă:

| Variabilă | Unde o găsești |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `TRELLO_API_KEY` | [trello.com/app-key](https://trello.com/app-key) |
| `TRELLO_TOKEN` | Același link, butonul **Token** |
| `TRELLO_LIST_ID` | Deschide board-ul Trello, adaugă `.json` la URL, caută `"lists"` și copiază `"id"` |

4. Click **Deploy** — gata!

## Rulare locală

```bash
npm install
cp .env.example .env.local
# completează .env.local cu cheile tale
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## Cum funcționează

```
URL YouTube
    ↓
youtube-transcript (extrage subtitrarile)
    ↓
Claude Sonnet (curăță + traduce + structurează) — streaming live în UI
    ↓
Trello API (card nou + fișier .txt atașat)
```

## Limitări
- Videoclipul trebuie să aibă subtitare activate (manuale sau auto-generate)
- Transcripturi foarte lungi sunt tăiate la ~14.000 caractere înainte de a fi trimise la Claude
