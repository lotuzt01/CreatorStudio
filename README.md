# JAJA AI Creator Studio

Studio produksi konten AI berbasis web & Progressive Web App (PWA) dengan **Character Intelligence Engine**, **Character Identity Lock**, **Google Flow Video Prompt Studio**, **UGC & Ads Studio**, **AI Drama & Storyboard Studio**, **AI Podcast Studio**, dan **AI Voice Studio** (Gemini 3.8 TTS).

## Fitur Utama

- **Dashboard & Manajemen Proyek**: CRUD proyek produksi dengan sinkronisasi Firebase Firestore & autentikasi Google.
- **Character Intelligence Engine (Tahap 3)**: Kunci DNA visual karakter (`Identity Lock`), template referensi studio, serta generator pose, ekspresi, outfit, dan adegan terkunci.
- **Video Flow Studio**: Generator prompt video sinematik dengan kontrol shot kamera, motion control, start-frame anchor, dan timeline gerak.
- **UGC, Drama & Podcast Automation**: Paket produksi konten otomatis lengkap dengan transfer 1-klik ke AI Voice Studio.
- **AI Voice Studio**: Sintesis narasi tunggal (`gemini-3.8-flash-lite-tts`) dan dialog dual-speaker (`gemini-3.8-flash-tts`) dalam format WAV 24kHz.
- **Progressive Web App (PWA)**: Mendukung instalasi langsung di Android, iOS Safari, dan Desktop melalui Web App Manifest, Service Worker, ikon adaptif/maskable, serta indikator status offline.

## Menjalankan Lokal

1. Salin `.env.example` menjadi `.env` lalu isi `GEMINI_API_KEY`.
2. Pastikan `firebase-applet-config.json` tersedia di root proyek.
3. Jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Integrasi ke GitHub & Instalasi PWA

1. Gunakan tombol **Save to GitHub** di Google AI Studio, atau unggah repositori secara manual:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: JAJA AI Creator Studio PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/jaja-ai-creator-studio.git
   git push -u origin main
   ```
2. Deploy aplikasi full-stack (`npm run build` lalu `npm run start`) ke platform HTTPS (Google Cloud Run, Render, Railway, atau VPS dengan HTTPS) dengan variabel lingkungan `GEMINI_API_KEY`.
3. Buka URL HTTPS di Chrome/Edge (Android/Desktop) atau Safari (iOS), lalu klik **Install Aplikasi (PWA)** di sidebar atau menu **Tambahkan ke Layar Utama**.
