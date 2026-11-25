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

## Integrasi ke GitHub, GitHub Pages & Instalasi PWA

Proyek ini sudah menyertakan workflow otomatis di `.github/workflows/deploy-pages.yml` yang berjalan pada setiap `push` ke branch `main` (atau manual lewat **Actions → Run workflow**) untuk menjalankan `npm run build` dan men-deploy output statis `dist/` ke **GitHub Pages**.

1. Hubungkan proyek ke GitHub melalui tombol **Save to GitHub** di Google AI Studio, atau push manual:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: JAJA AI Creator Studio PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/jaja-ai-creator-studio.git
   git push -u origin main
   ```
2. Di repositori GitHub, buka **Settings → Pages → Build and deployment → Source** lalu pilih **GitHub Actions**.
3. (Opsional untuk fitur AI di GitHub Pages) Karena endpoint `/api/ai/*` berjalan di server Express (`server.ts`), deploy backend ke layanan HTTPS (seperti Google Cloud Run dengan `GEMINI_API_KEY`) lalu tambahkan Repository Variable `VITE_API_BASE_URL` di **Settings → Secrets and variables → Actions → Variables** yang menunjuk ke URL backend tersebut.
4. Setelah workflow selesai, buka URL HTTPS GitHub Pages di Chrome/Edge (Android/Desktop) atau Safari (iOS), lalu klik **Install Aplikasi (PWA)** di sidebar atau menu **Tambahkan ke Layar Utama**.
