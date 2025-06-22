# The Witness is Fractured

*The Witness is Fractured* is a browser-based artwork that fuses a photorealistic, AI-rendered human eye with a carousel of historically significant war photographs. A dystopian heads-up display turns each image into a collectible, challenging the viewer to confront how beauty and horror coexist—and how easily digital interfaces can turn atrocity into data.

This repository contains the full source code, media assets, and written reflection (artist statement) for a postgraduate Creative Inquiry assessment.

---

## Live Demo
After enabling GitHub Pages on the `main` branch of this repo, the project will be available at:
```
https://jehmal.github.io/Fractured/
```
Until then you can run it locally (see below).

---

## Project Structure
```
├── index.html              # Entry point
├── style.css               # HUD & layout styles
├── script.js               # Three.js scene + UI logic
├── photo-data.js           # JSON-like array describing each photograph
├── assets/                 # Image and 3D-model assets
├── ARTIST_STATEMENT.md     # 500-word critical reflection with APA references
└── README.md               # You are here
```

---

## Running Locally
1. Clone the repo and `cd` into it.
2. Start a simple static server:
   ```bash
   # Python 3 (built-in)
   python -m http.server 8000
   # or with Node
   npx serve
   ```
3. Open `http://localhost:8000` in your browser.

No build step is required—the project uses native ES modules.

---

## Technical Notes
- **Three.js r160** for WebGL rendering of the eye model.
- **Vanilla JS** for state management and HUD interactions; no frameworks.
- **Responsive CSS** keeps the experience consistent across desktop and mobile.
- All photographs are public-domain or used under educational fair-use; metadata lives in `photo-data.js`.

---

## Assessment Brief Alignment
This artefact answers *Option 1: True Beauty* of the marking key:
1. **Truly beautiful**: the AI-rendered eye, echoing Kant's notion of purposeless beauty.
2. **Truly ugly**: archival war photographs depicting human suffering.
3. **Combination**: a gamified interface that overlays stats and progress bars, inspired by Cubist fragmentation and analysed through Baudrillard, Debord, Burke and others. The 500-word reflection in `ARTIST_STATEMENT.md` defends these choices with authoritative sources.

---

## License
All original code is released under the MIT License. Historical photographs remain under their respective licenses/public-domain status; see source links in `photo-data.js`.

---

## Author & Course Details

- **Name:** Jehmal Pitt  
- **Student Number:** 1012294  
- **Student Email:** 1012294@student.sae.edu.au  
- **Course:** Master of Creative Industries  
- **Lecturer:** Lola Montgomery  
- **Assessment:** Assessment 1 – Critical and Creative Response: Truth and Beauty

---

© 2024 Jehmal Pitt