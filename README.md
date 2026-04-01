# 📚 Mini LMS — React Native Expo

A production-grade Learning Management System mobile app built with React Native Expo, TypeScript strict mode, and modern mobile development best practices.

---

## 📸 Screenshots

> Add screenshots here after first build:
> - Login / Register screens
> - Course catalog with search
> - Course detail with enroll
> - WebView course content
> - Bookmarks tab
> - Profile with stats

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 52 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| State | Zustand |
| Sensitive Storage | Expo SecureStore |
| App Storage | AsyncStorage |
| Forms | React Hook Form + Zod |
| Lists | FlashList (@shopify/flash-list) |
| Animations | React Native Reanimated v3 |
| HTTP Client | Axios + axios-retry |
| Notifications | Expo Notifications |
| Image | Expo Image (with disk cache) |
| Testing | Jest + React Native Testing Library |

---

## 📁 Project Structure

```
mini-lms-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (session restore, notifications)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Login with RHF + Zod
│   │   └── register.tsx          # Register with validation
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # Home feed
│   │   ├── explore.tsx           # Category filter + search
│   │   ├── bookmarks.tsx         # Saved courses
│   │   └── profile.tsx           # User profile + stats
│   └── course/
│       ├── [id].tsx              # Course detail
│       └── webview.tsx           # WebView content viewer
│
├── src/
│   ├── components/
│   │   ├── course/
│   │   │   ├── CourseCard.tsx    # Memoized card with bookmark animation
│   │   │   └── SearchBar.tsx     # Debounced search input
│   │   └── ui/
│   │       ├── OfflineBanner.tsx # Animated offline indicator
│   │       ├── ErrorView.tsx     # Error state with retry
│   │       └── LoadingView.tsx   # Skeleton loading cards
│   │
│   ├── store/
│   │   ├── authStore.ts          # Auth state (Zustand)
│   │   └── courseStore.ts        # Courses, bookmarks, search (Zustand)
│   │
│   ├── services/
│   │   ├── apiClient.ts          # Axios instance with interceptors + retry
│   │   ├── authService.ts        # Auth API + SecureStore operations
│   │   ├── courseService.ts      # Course/product API + caching
│   │   └── notificationService.ts# Expo Notifications + background tasks
│   │
│   ├── hooks/
│   │   ├── useNetworkState.ts    # NetInfo network monitoring
│   │   └── useDebounce.ts        # Search debounce
│   │
│   ├── lib/
│   │   └── schemas.ts            # Zod validation schemas
│   │
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   │
│   └── constants/
│       └── index.ts              # Storage keys, endpoints, config
│
├── __tests__/
│   ├── components/
│   │   └── CourseCard.test.tsx
│   ├── hooks/
│   │   ├── authStore.test.ts
│   │   ├── courseStore.test.ts
│   │   └── useDebounce.test.ts
│   └── services/
│       └── schemas.test.ts
│
├── app.config.ts                 # Expo config
├── babel.config.js
├── tailwind.config.js
├── metro.config.js
├── tsconfig.json                 # Strict TypeScript
└── eas.json                      # EAS build profiles
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Expo Go app (for development) or Android/iOS simulator

### 1. Clone and install

```bash
git clone https://github.com/your-username/mini-lms-app.git
cd mini-lms-app
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.freeapi.app
EAS_PROJECT_ID=your-eas-project-id   # from eas.json after eas init
```

### 3. Start development server

```bash
npx expo start
```

Scan the QR code with Expo Go, or press:
- `a` for Android emulator
- `i` for iOS simulator

### 4. Run tests

```bash
# Watch mode
npm test

# Coverage report
npm run test:ci
```

### 5. Type check

```bash
npm run type-check
```

---

## 📱 Building the APK

### Development build (APK)

```bash
# Login to EAS
eas login

# Initialize project (first time)
eas init

# Build dev APK
eas build --platform android --profile development
```

### Preview build (APK for sharing)

```bash
eas build --platform android --profile preview
```

The APK download link will appear in the EAS dashboard and terminal output.

---

## 🏛️ Key Architectural Decisions

### 1. Zustand over Redux / Context API
Zustand provides a minimal, boilerplate-free global state API. It integrates seamlessly with React hooks and doesn't require providers. Selectors (`selectFilteredCourses`, `selectBookmarkedCourses`) are co-located with the store for efficient re-renders — components only re-render when their selected slice changes.

### 2. SecureStore for tokens, AsyncStorage for app data
Sensitive data (access/refresh tokens, user object) is stored in Expo SecureStore which uses the device Keychain (iOS) and Keystore (Android) — encrypted at rest. Non-sensitive app data (bookmarks, enrollments, cached courses) uses AsyncStorage, which is faster for bulk reads and doesn't require the overhead of secure encryption.

### 3. Axios interceptors for token refresh
The API client handles 401 responses with a queue-based token refresh pattern. When the access token expires, inflight requests are queued while a single refresh call is made. After a successful refresh, all queued requests are replayed with the new token. This prevents race conditions during concurrent requests.

### 4. FlashList over FlatList
`@shopify/flash-list` provides significantly better scroll performance for large lists by recycling cells more aggressively. With `estimatedItemSize`, it eliminates the layout calculation overhead that causes FlatList jank on initial load.

### 5. Expo Router (file-based routing)
File-based routing provides type-safe navigation with `typed routes` enabled in `tsconfig`. Routes map directly to the file system, making the navigation structure self-documenting and easier to maintain than a centralized navigator config.

### 6. Bidirectional WebView communication
The WebView course viewer uses `postMessage` / `onMessage` for two-way communication. The native app injects auth context and enrollment state via `injectedJavaScript` on load. The web page sends progress updates and navigation events back via `window.ReactNativeWebView.postMessage`. This pattern keeps the web content loosely coupled from native state.

### 7. Course data strategy
The freeapi.app `/randomproducts` endpoint is used as course data and `/randomusers` as instructors. Products and users are fetched in parallel (`Promise.all`) and merged client-side — each product is assigned an instructor by index modulo. The first page is cached in AsyncStorage with a 5-minute TTL to reduce redundant network calls.

### 8. React Hook Form + Zod
Forms use `react-hook-form` with `@hookform/resolvers/zod` for schema-based validation. Zod schemas are the single source of truth for both runtime validation and TypeScript types (via `z.infer`). This eliminates the common pattern of duplicate type definitions alongside manual validation logic.

### 9. Reanimated for all animations
All animations use Reanimated v3 worklets which run on the UI thread, avoiding the JS bridge bottleneck. This ensures 60fps animations even under heavy JS load. `useSharedValue` + `useAnimatedStyle` is used for imperative animation control (bookmark bounce, form shake, skeleton pulse, enter transitions).

---

## 🔔 Notification Strategy

| Trigger | Notification |
|---|---|
| User bookmarks 5+ courses | Immediate local notification celebrating milestone |
| App unopened for 24 hours | Background task fires re-engagement reminder |

Notification permissions are requested on app launch (in `_layout.tsx`). Background tasks use `expo-background-fetch` + `expo-task-manager` and are registered once, persisting across app restarts.

---

## 🌐 Offline Mode

- `useNetworkState` hook monitors connectivity via `@react-native-community/netinfo`
- `OfflineBanner` component slides in from top with an animated banner when offline
- Cached courses (5-min TTL) are served from AsyncStorage when the network is unavailable
- All API errors are caught and displayed with a retry button — no unhandled promise rejections

---

## 🧪 Testing Coverage

Tests target >70% coverage across:

| File | What's tested |
|---|---|
| `authStore.test.ts` | Login, logout, error states, session restore |
| `courseStore.test.ts` | Fetch, bookmark toggle, milestone trigger, selectors |
| `schemas.test.ts` | All Zod validation rules (valid + invalid cases) |
| `CourseCard.test.tsx` | Render, interactions, conditional UI |
| `useDebounce.test.ts` | Timing, rapid updates, value isolation |

---

## ⚠️ Known Issues / Limitations

- **Mock API data**: The freeapi.app endpoints return random data on each call — courses and instructors will change on hard refresh. A production app would use stable course IDs.
- **No real WebView URL**: Course content is rendered from a local HTML template. A real LMS would load URLs from a CMS.
- **Background tasks on simulators**: `expo-background-fetch` does not work on iOS Simulator. Test on a real device.
- **Image caching**: Expo Image disk cache is limited to ~200MB by default. Consider a custom cache-clearing strategy for long-term use.
- **No pagination reset on search**: Searching filters the already-loaded page. A production app would re-query the API with a search param.

---

## 📦 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Base URL for the freeapi.app API |
| `EAS_PROJECT_ID` | For builds | Your EAS project UUID |

---

## 🔗 API Reference

Base: `https://api.freeapi.app`

| Endpoint | Used as |
|---|---|
| `POST /api/v1/users/login` | Login |
| `POST /api/v1/users/register` | Registration |
| `POST /api/v1/users/logout` | Logout |
| `POST /api/v1/users/refresh-token` | Token refresh |
| `GET /api/v1/users/current-user` | Fetch current user |
| `PATCH /api/v1/users/avatar` | Update avatar |
| `GET /api/v1/public/randomproducts` | Course catalog |
| `GET /api/v1/public/randomusers` | Course instructors |
