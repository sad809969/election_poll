# JIGAWA PDP POLLWATCH 2027 — Global Light / Dark Theme Execution Plan

## 1. Overview
Implement universal, persistent **Dark / Light Theme** switching across all 13 pages and components.

## 2. Steps
1. Create `ThemeContext` in `web/src/pages/_app.js` with `localStorage` persistence.
2. Update `Header.js` and `Sidebar.js` to consume `ThemeContext`.
3. Update all 13 page components in `web/src/pages/` to apply theme-aware styling.
4. Commit and push changes to GitHub `main` branch to update live Vercel deployment.

---
