# StitchCraft Improvement Plan

Based on the audit report (Dec 19, 2024), this plan outlines the steps to bring StitchCraft to a launch-ready state.

## 1. Assets & Branding 🎨
- [x] **Data Icon**: Generate a professional app icon (Gold Scissors/Green Thread 'S').
- [x] **Favicon**: Implement favicon.ico and other web app icons.
- [x] **PWA**: Configure `next-pwa` for installability and offline support.

## 2. Critical Stability Fixes 🛑
- [x] **CSS Fix**: Correct invalid Tailwind v4 media query in `globals.css`.
- [x] **Linting**: Run `npm run lint:fix` to resolve ~175 formatting/unused variable issues.
- [x] **Error Handling**: Create `src/app/error.tsx` and `src/app/global-error.tsx` to prevent white-screen crashes.
- [x] **Middleware**: Ensure `middleware.ts` is correctly placed and protecting routes.

## 3. Market Readiness & UX 🚀
- [ ] **Empty States**: Enhance `DataTable` empty state with visual feedback and CTAs.
- [ ] **Dynamic Titles**: Implement `generatemetadata` for unique page titles.
- [ ] **SEO**: Add Open Graph tags and structured data.

## 4. Technical Debt 🧹
- [ ] Update `baseline-browser-mapping`.
- [ ] Verify `any` type usage removal in critical paths.
