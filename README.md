# GradeWise AI

AI-powered CGPA planner — frontend build (Phase 6).

## Getting started
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Build
```bash
npm run build
```
Outputs to `dist/`.

## Notes
- Data is currently mocked in `src/lib/data/mock.ts` — swap this for real API calls when the backend is ready.
- Core grading math lives in `src/lib/grading/engine.ts`, framework-free and unit-testable.
- Deployment intentionally not configured — bring your own hosting.
