# CLAUDE.md

## Project Overview
Wedding website for Hoan & Thy (January 17, 2027, Nha Trang, Vietnam). Bilingual (en/vi) with locale detection via Vercel geo headers.

## Tech Stack
- Next.js 16 (App Router) with `[locale]` dynamic routing
- Tailwind CSS v4 with `@theme inline` custom colors
- Framer Motion for animations
- Lenis for smooth scrolling (manual RAF sync with framer-motion)

## Key Constraints

### Browser Autoplay Policy
**This is a hard browser constraint, not a bug.**

Only these events count as "user activation" and can trigger `audio.play()`:
- `click`, `touchstart`, `keydown`, `pointerdown`

These do NOT count as user activation:
- `wheel`, `scroll`, `mousemove`, `pointermove`

**Current design:**
- Preloader dismisses on: `click`, `touchstart`, `keydown`, `pointerdown` (all trigger music autoplay)
- Wheel also dismisses preloader, but music will start on the **next** activation event (tap, click, keypress)
- Lenis is stopped while preloader is visible to prevent background scrolling
- MusicPlayer listens for activation events and retries `audio.play()` until it succeeds

Do not attempt to make wheel/scroll trigger audio playback — it will silently fail due to browser policy.

## Architecture Notes
- Lenis smooth scroll uses `autoRaf: false` with manual framer-motion `frame.update` sync
- Gallery horizontal scroll uses `useScroll`/`useTransform` with dynamic pixel-based overflow measurement
- Gallery section height: `h-[600vh]` mobile / `h-[300vh]` desktop to accommodate different image widths
- Music files in `public/music/` (vi.mp3, en.mp3)
- Locale detection: Vercel `x-vercel-ip-country` header → Accept-Language fallback
