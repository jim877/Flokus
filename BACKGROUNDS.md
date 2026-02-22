# Background images (zen, mountains, water)

The app uses background options in **Settings → Background**. Right now all photo options use one verified Unsplash image (zen pebbles) with different overlay tints so every option works.

To use **different photos** (zen gardens, mountains, lakes, pebbles, streams), use high‑resolution images and keep the overlay so the UI stays readable.

## Curated Unsplash searches (free, high quality)

- **Zen garden / raked sand / rocks**  
  https://unsplash.com/s/photos/zen-garden  
- **Pebbles / stones / beach rocks**  
  https://unsplash.com/s/photos/pebbles  
- **Mountain lake / reflection**  
  https://unsplash.com/s/photos/mountain-lake  
- **Misty mountain / fog**  
  https://unsplash.com/s/photos/misty-mountain  
- **Calm water / lake**  
  https://unsplash.com/s/photos/calm-water  
- **Forest stream**  
  https://unsplash.com/s/photos/forest-stream  

## How to use your own image URL

1. Open a photo on Unsplash and right‑click the main image → **Copy image address** (or use the Download button and host the image yourself).
2. In `src/index.css`, find the class for the option you want (e.g. `.zen-bg-mountain-lake`) and replace the `url('...')` with your image URL.
3. Keep the `linear-gradient(...)` overlay so text and UI stay readable.

Example: replace  
`url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1600&q=60')`  
with your copied URL. Add `?auto=format&fit=crop&w=1600&q=80` if using an Unsplash CDN URL for size/quality.
