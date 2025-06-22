# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"True Beauty" (originally "The Witness is Fractured") is a creative artefact for a university Critical Inquiry course. It explores the theme of "True Beauty" through powerful juxtaposition:
- A beautiful, detailed 3D model of a human eye at the center
- 24 historical war photographs arranged in a sphere around it
- A dystopian forensic analysis interface that gamifies human suffering

The project critiques desensitization and commodification of suffering through video game-like mechanics.

## Technology Stack

- **Three.js r160** - 3D graphics rendering
- **Post-Processing Pipeline**: EffectComposer, UnrealBloomPass, GlitchPass, FilmPass
- **ES6 Modules** with importmap
- **No build tools required** - runs directly in browser

⚠️ **CRITICAL**: The project currently has mixed Three.js loading - both CDN importmap AND local file references that don't exist

## Project Structure

```
├── index.html           # Main entry point (⚠️ has broken local JS references)
├── script.js           # Core 3D scene logic and interaction handling  
├── style.css           # Dystopian, futuristic aesthetic
├── photo-data.js       # Database of 24 war photographs with metadata
└── assets/             # Images and 3D models
    ├── textured_mesh.glb    # Central 3D eye model
    └── *.jpg/*.webp         # Historical war photographs
```

## Development Commands

This is a static web project with no build process:

```bash
# To run locally, use any static file server:
python -m http.server 8000
# or
npx serve .
# Then open http://localhost:8000
```

## Architecture Overview

### Core Features (script.js)
1. **Splash Screen**: Shows beautiful eye photo, fades on click to reveal 3D scene
2. **3D Scene**: 
   - Central rotating eye model
   - 24 photos in spherical arrangement with glowing leader lines
   - Slow auto-rotation of entire scene
3. **Interaction System**:
   - Raycaster for photo click detection
   - 8-second dialogue box with historical data + cynical game stats
   - Persistent experience bar tracking "human experience" points
4. **Post-Processing**: Bloom, glitch on click, film grain for dystopian feel

### Data Structure (photo-data.js)
Each photo object contains:
- `id`: Filename reference
- `title`: Historical photograph name
- `date`: When taken
- `location`: Where taken
- `description`: Well-researched historical context
- `stats`: Game-like statistics
  - `human_experience`: XP points gained
  - `geopolitical_influence`: Political impact
  - `resources_gained`: Resource points
  - `technological_advancement`: Tech progress

### Interaction Flow
1. User starts at splash screen showing "Photo of an Afghan Girl"
2. Enters 3D environment with photos arranged around central eye
3. Hovering highlights photos with bloom effect
4. Clicking shows dialogue and adds XP to Humanity Index
5. Progress tracked in top-left XP bar

## Key Implementation Details

- **Raycasting** for mouse interaction with 3D objects
- **Bloom effect** intensity dynamically adjusted on hover
- **Glitch effect** plays on photo selection for dramatic impact
- **CSS animations** for dialogue box and XP bar updates
- **Local storage** could be added to persist progress

## Recent Issues & Fixes

### CRITICAL: Three.js Loading Error
The `index.html` has conflicting Three.js loading methods:
1. **importmap** correctly points to CDN
2. **Script tags** incorrectly reference local files (`js/three.min.js`, etc.) that don't exist

**Fix needed**: Remove lines 36-44 in index.html (the local script references)

### Known Race Conditions (Resolved)
- Splash screen click handling previously interfered with 3D scene clicks
- Now consolidated into single event system

## Testing Checklist

1. ✓ Splash screen appears on load?
2. ✓ Fades out on first click?
3. ✓ 3D scene visible and auto-rotating?
4. ✓ Photos clickable with dialogue box?
5. ✓ Dialogue disappears after 8 seconds?
6. ✓ Experience bar updates only on first click per photo?
7. ✓ Experience total persists across clicks?

## Common Tasks

### Fix the Loading Error First!
Before any other work, fix the Three.js loading issue in index.html

### Adding Photos (Currently 24, not 26)
1. Add image to `assets/`
2. Add entry to `photoData` array with all required fields
3. Update any hardcoded photo count references