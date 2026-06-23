import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: '/' pour Vercel / Netlify (déploiement à la racine du domaine).
// Pour GitHub Pages dans un sous-dossier, passer VITE_BASE=/nom-du-repo/
// (ex. `VITE_BASE=/Real-Estate/ npm run build`). Voir README.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
