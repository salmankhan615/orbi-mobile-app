---
name: app-conventions
description: Architecture and coding conventions for this Expo/React Native/TypeScript app — folder structure, design tokens, state management, data fetching, navigation, and animation. Use whenever adding or modifying code in src/ (new screens, components, stores, API calls) or when unsure where a file belongs.
---

# App conventions — KBM Training & Recruitment

This is an Expo (React Native) + TypeScript learning/LMS app for KBM Training & Recruitment
(courses, sessions, calendar). Follow these conventions for anything under `src/`.

## Screens

Roles: `student` | `staff` on `useAuthStore().user`. Tabs swap in `MainTabNavigator.tsx`.
Staff screens check `user.permissions` (`src/features/auth/permissions.ts`). Signup is student-only.

- **Auth** (`src/pages/auth/`): `LoginScreen`, `SignupScreen` (first + last name),
  `ForgotPasswordScreen`, `ResetPasswordScreen`. Sessions last 7 days
  (`SESSION_DURATION_MS`); `RootNavigator` signs out when the timer elapses.
  Demo logins: `student@kbm.com`, `staff@kbm.com`.
- **Student Home** (`src/pages/home/HomeScreen.tsx`): greeting, bell (notifications),
  announcement banner, book-class/training/bookings/coursework shortcuts, course
  carousel, stay-on-track, upcoming sessions.
- **Staff Home** (`src/pages/staff/StaffHomeScreen.tsx`): permission-aware overview.
- **Courses** (`src/pages/courses/`): list, detail (visible tabs: Modules + About;
  Resources/Announcements stay in code but are hidden), lesson player.
- **Calendar / Chat**: unchanged student flows; calendar + opens Book Class, staff
  with `close_calendar` can close days.
- **Student extras** (`src/pages/student/`): Book Class, Book Training, My Bookings,
  Coursework.
- **Staff extras** (`src/pages/staff/`): bookings + attendance, groups, directory,
  coursework/submissions, invoices, agreements-by-status, announcements editor,
  close calendar, booking shifts. Gated by permissions; Overview lists only allowed tools.
  Staff tabs: Overview (+ Bookings/Groups when permitted), Profile — no separate Tools tab.
- **Common** (`src/pages/common/`): Notifications, Announcements, Edit Profile,
  Privacy & Security, Help & Support, About KBM.
- **Profile** (`src/pages/ProfileScreen.tsx`): identity + role badge, notification
  toggle, account menu (no enrolled/in-progress/completed stats).

Navigation is a single root native-stack (`RootNavigator.tsx`) that swaps Auth vs
authenticated stacks. `MainTabs` is student (Home, Courses, Calendar, Chat, Profile)
or staff (Overview, Bookings, Groups, Profile). Detail screens are pushed at
the root-stack level.

## Feedback & touch feel

- **Haptics**: `src/utils/haptics.ts` wraps `expo-haptics` (`tap`, `select`, `success`, `warning`).
  `ScalePressable` and `Button` already fire `haptics.tap()` on press by default — pass
  `haptic={false}` to `ScalePressable` to opt out (used for filter chips, where a tap-per-item in a
  fast horizontal scroll would feel noisy). Fire `haptics.success()`/`warning()` manually for
  one-off outcomes (a completed action, a destructive confirmation).
- **Toast**: `src/store/useToastStore.ts` + `<Toast />` (mounted once in `App.tsx`). Call
  `useToastStore.getState().show(message, tone)` from anywhere — screens, hooks, mutations — for a
  transient confirmation; don't build a local toast per screen.
- **Cards**: every surface card (`CourseCard`, `SessionListItem`, `MenuRow`, stat cards, etc.) pairs
  a soft `tokens.shadows.sm/md` with a 1px `borderColor: tokens.colors.border` — the hairline border
  is what keeps cards crisp against the warm off-white background instead of looking washed out;
  keep pairing both on new cards, don't rely on shadow alone.

## Brand

- Logo: real PNG assets in `src/assets/images/` (`logo.png` — full lockup, "KBM" mark + "Training &
  Recruitment" wordmark, black text: only use on a light background; `logo-mark.png` — just the KBM
  lettermark + red graphic, no black text: safe on dark backgrounds; `logo-legal.png` — full lockup
  plus "Company No." line, kept in case a legal/footer context needs it, not currently used).
  Always go through `src/components/ui/Logo.tsx` (`variant: 'full' | 'mark'`, `size: 'sm'|'md'|'lg'`)
  rather than `<Image>`-ing these directly, so sizing stays consistent.
- Fonts: Poppins only (geometric LMS feel matching the product reference), loaded via
  `@expo-google-fonts/poppins` and `useFonts()` in `App.tsx`. Family names live in
  `src/theme/typography.ts` — never reference a `Poppins_*` string outside that file.
- Colors: tertiary scheme — dark blue primary (`tokens.colors.primary`), purple secondary
  (`tokens.colors.secondary`, tabs/chips), gold tertiary (`tokens.colors.tertiary`, progress,
  announcement accents, Book CTAs). Buttons: primary = blue squircle, secondary = purple
  block, accent = gold pill, outline = blue stroke. KBM red (`tokens.colors.accent`) is for
  logo/danger only. Course cards may use `tokens.gradients.category*` via `CATEGORY_GRADIENT`.

## Safe area

Every screen renders under a root stack / tab navigator with `headerShown: false`, so none of them
get React Navigation's automatic safe-area insets — wrap each screen's root in
`src/components/custom/Screen.tsx` (default `edges={['top']}`; pass `edges={['top', 'bottom']}` for
screens with no tab bar below them, e.g. auth screens and stack-pushed detail screens like
`CourseDetailScreen`/`SessionDetailsScreen`/`DayAgendaScreen`). A screen with a full-bleed colored
header (`HomeScreen`, `CourseDetailScreen`) instead reads `useSafeAreaInsets()` directly and adds
`insets.top` to the header's own padding, so the color extends behind the status bar; in that case
also set the status bar style for the duration of that screen's focus with `useFocusEffect` +
`setStatusBarStyle('light')` / reset to `'dark'` on cleanup (see `HomeScreen.tsx`) — don't use the
declarative `<StatusBar>` component for this, since tab screens stay mounted when not focused and a
mounted-but-blurred screen's `<StatusBar>` can still win.

## Mock data / backend

There's no real backend yet. `src/api/{auth,courses,sessions,announcements,bookings,notifications,staff}.ts`
each export in-memory mock data plus a `mockDelay()`-wrapped async function. `src/queries/*.ts`
wraps these with TanStack Query.

## Folder structure

```
src/
  api/          Raw HTTP calls only (fetch wrappers, endpoint functions). No caching/state.
  queries/      TanStack Query hooks that wrap src/api functions (useQuery/useMutation, query keys, queryClient).
  store/        Zustand stores for client-side/UI state (not server data — that's queries/).
  theme/        Design tokens — the ONLY place raw colors/fonts/spacing may be defined. See below.
  components/
    ui/         Generic, app-agnostic primitives (Button, Text, Card). Built only from theme tokens.
    custom/     Composed, app-specific but feature-agnostic components (e.g. FadeInView).
  features/     Feature modules, e.g. features/courses/, features/calendar/. Each feature owns its
                own components/ subfolder for UI specific to that feature (not reusable elsewhere),
                plus any feature-local style-lookup helpers (e.g. categoryStyle.ts).
  navigation/   Navigators and route param types (RootNavigator.tsx, types.ts).
  pages/        Screen-level components wired to navigation props. Compose features/ + components/.
  hooks/        Shared, generic custom hooks (useDebouncedValue, etc).
  utils/        Pure helper functions (formatters, etc). No React, no side effects.
  assets/       In-app images/fonts imported directly by components. Static app icons/splash
                referenced only from app.json stay in the root /assets folder instead.
```

Import everything via the `@/` path alias (e.g. `import { tokens } from '@/theme'`), configured
in `tsconfig.json` and `babel.config.js` (babel-plugin-module-resolver). Never use deep relative
paths like `../../../theme`.

Rule of thumb for where new code goes:
- Talks to the network? → `api/` (raw call) + `queries/` (the hook screens actually use).
- Client/UI state shared across screens (auth flag, filters, onboarding)? → `store/` (Zustand).
- Reusable across any future app? → `components/ui/`.
- Reusable in this app but not generic UI (app-specific composition)? → `components/custom/`.
- Only makes sense for one feature (e.g. a course card, a session list item)? → `features/<feature>/components/`.
- A screen? → `pages/`, registered in `navigation/`.

## Design tokens — mandatory, lint-enforced

`src/theme/` is the single source of truth for every visual value: `colors`, `spacing`, `radius`,
`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `shadows`, `duration`, `easing`. Import the
aggregate object and use dot access:

```ts
import { tokens } from '@/theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    ...tokens.shadows.sm,
  },
});
```

**Never hardcode a color (hex/rgb/hsl/named) or a `fontFamily` string outside `src/theme/`.** This
is enforced by a custom ESLint rule, `local/no-raw-design-values`
(`eslint-rules/no-raw-design-values.js`, wired up in `eslint.config.js`), which errors on:
- Any `color`/`backgroundColor`/`borderColor`/`shadowColor`/`tintColor`/etc. property set to a
  string literal instead of a token.
- Any `fontFamily` property set to a string literal instead of `tokens.fontFamily.*`.
- Any bare string literal elsewhere that looks like a color (hex code, `rgb()`/`rgba()`/`hsl()`,
  or a CSS color name).

The rule only exempts `src/theme/**` (where tokens are defined). If you need a new color, spacing
step, or font weight, add it to the relevant file in `src/theme/` — don't inline it and don't
disable the rule. `npm run lint` must pass with zero `local/no-raw-design-values` errors.

## State management — Zustand

Client/UI state (not server data) lives in `src/store/` as one `create()` store per concern, e.g.
`useAuthStore.ts` (current user, `isAuthenticated`, `signIn`/`signOut`). Keep stores small and
focused; don't grow a single store to hold unrelated state. Server data (API responses) belongs in
TanStack Query, not Zustand.

## Data fetching — TanStack Query

- `src/api/*.ts` — plain functions calling `apiClient` (`src/api/client.ts`, a thin fetch wrapper),
  or, until a real backend exists, returning mock data (see "Mock data / backend" below). These
  know nothing about React or caching.
- `src/queries/*.ts` — `useQuery`/`useMutation` hooks that call the `api/` functions, plus a
  `<feature>Keys` object for query keys (see `src/queries/useCourses.ts` for the pattern). Screens
  and feature components import from `queries/`, never call `api/` directly.
- `src/queries/queryClient.ts` holds the shared `QueryClient`; it's provided once in `App.tsx` via
  `QueryClientProvider`.

## Navigation

React Navigation (`@react-navigation/native-stack`). Route params are typed in
`src/navigation/types.ts` (`RootStackParamList`) and consumed via
`NativeStackScreenProps<RootStackParamList, 'ScreenName'>` in each screen under `src/pages/`. Add
new screens by: adding the route to `RootStackParamList`, adding a `<Stack.Screen>` in
`RootNavigator.tsx`, and creating the screen component in `pages/`. Screen chrome (header colors,
fonts) comes from `tokens`, not hardcoded values.

## Animation

Use `react-native-reanimated` for anything beyond a one-off `LayoutAnimation`. Keep it lightweight:
`useSharedValue` + `withTiming`, using `tokens.duration` / `tokens.easing` so motion feels
consistent across the app (see `src/components/ui/Button.tsx` for a press-scale example and
`src/components/custom/FadeInView.tsx` for a reusable entrance animation). Avoid heavier animation
libraries unless a screen has a genuinely complex sequence that reanimated alone can't express
cleanly.

Note: on some `eslint-config-expo` versions (those bundling the React Compiler's
`react-hooks/immutability` rule), `react-native-reanimated` shared-value mutations
(`someValue.value = ...`) legitimately trip that rule — it doesn't know Reanimated's mutable refs
aren't React state. If that happens, silence just that line with
`// eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue, not React state`
rather than disabling the rule file-wide. If the rule isn't part of the current config, `npx
eslint` will instead error with "Definition for rule ... was not found" — in that case remove the
disable comment rather than leaving a stale one.

## Linting & formatting

- `npm run lint` — ESLint (flat config, `eslint-config-expo` + Prettier integration + the local
  design-token rule).
- `npm run lint:fix` — auto-fix.
- `npm run format` / `npm run format:check` — Prettier.
- `npm run typecheck` — `tsc --noEmit`.

All four should pass before considering a change done.
