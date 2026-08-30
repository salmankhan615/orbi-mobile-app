# KBM Training & Recruitment — Mobile App

Expo (React Native) learning management app for **KBM Training & Recruitment**. Learners take courses, book classes, and track sessions; staff manage bookings, groups, coursework, and announcements from the same codebase with role-based navigation.

Built on **Expo SDK 54** (aligned with the team’s Expo Go version).

## Features

### Student

- Dashboard with announcements, notifications, and course overview
- My Courses — search, filters, course detail, lesson video player
- Calendar — month / week / list views, day agenda, session details
- Book class and book training
- My bookings and coursework
- Chat with instructors / support
- Profile, edit profile, privacy, help, and about screens

### Staff

Same login flow, different tab bar and tools (gated by permissions):

- Overview dashboard
- Bookings — view, mark attendance, cancel
- Groups — cohorts, sessions, students
- More — users directory, coursework, submissions, invoices, agreements, announcements, close calendar days, booking shifts

### Shared (auth & account)

- Login, signup (students: first name + last name), forgot / reset password
- Session duration: **7 days** (same as web), then automatic sign-out
- In-app notifications (announcement, upcoming class/training, course progress)

## Demo accounts

Mock auth — any password works.

| Email | Role |
|-------|------|
| `student@kbm.com` | Student |
| `staff@kbm.com` | Staff (email must contain `staff`) |

Signup always creates a **student** account.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Expo 54, React Native 0.81, React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation (native stack + bottom tabs) |
| Server state | TanStack Query |
| Client state | Zustand |
| Video | expo-video |
| Calendar export | expo-calendar |
| UI | Custom components + design tokens in `src/theme/` |

## Getting started

### Prerequisites

- Node.js 18+
- npm
- [Expo Go](https://expo.dev/go) on a device or simulator (SDK 54)

### Install and run

```bash
npm install
npm start
```

Then scan the QR code with Expo Go, or press `i` / `a` for iOS / Android simulator.

Other scripts:

```bash
npm run ios          # Expo start → iOS
npm run android      # Expo start → Android
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check
```

## Project structure

```
src/
  api/           HTTP / mock API functions (no React)
  queries/       TanStack Query hooks
  store/         Zustand (auth, toast)
  theme/         Colors, typography, spacing — single source of design tokens
  components/
    ui/          Primitives (Button, Text, TextField, …)
    custom/      App-specific composition (Screen, Toast, …)
  features/      Feature modules (courses, calendar, bookings, …)
  pages/         Screens wired to navigation
  navigation/    Navigators and route types
  hooks/         Shared hooks
  utils/         Pure helpers
```

Import paths use the `@/` alias (e.g. `@/theme`, `@/pages/home/HomeScreen`).

## Roles and permissions

There are **two roles**: `student` and `staff`.

Staff capabilities are controlled by permission flags on the user (`src/features/auth/permissions.ts`), not by extra roles. The **More** tab and staff shortcuts only show items the signed-in staff user is allowed to use.

## Data and backend

There is **no live API** yet. Mock data and delayed responses live in `src/api/*.ts` and are consumed through `src/queries/*.ts`. Replacing mocks with real endpoints should only require changes under `src/api/` (and query keys as needed).

`src/api/client.ts` is ready for a generic fetch wrapper when the backend is connected.

## Design and conventions

- **Fonts:** Poppins via `@expo-google-fonts/poppins`
- **Colors:** Dark blue (primary), purple (secondary), gold (tertiary) — defined only in `src/theme/`
- **Lint:** Custom rule `local/no-raw-design-values` blocks hardcoded colors and font families outside `src/theme/`

For architecture, navigation patterns, and contribution rules, see:

- [`.claude/skills/app-conventions/SKILL.md`](.claude/skills/app-conventions/SKILL.md) — full app conventions
- [`AGENTS.md`](AGENTS.md) — Expo SDK version and doc links

## Expo SDK note

This repo targets **Expo SDK 54** to match Expo Go on devices. Before upgrading SDK, read [Expo v54 docs](https://docs.expo.dev/versions/v54.0.0/) and run:

```bash
npm install expo@latest
npx expo install --fix
```

Then update `AGENTS.md` with the new SDK version.

## License

See [LICENSE](LICENSE).
