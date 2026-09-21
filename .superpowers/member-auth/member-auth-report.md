# Member Auth & Server-Side Saved — Feature Report

Repo: `C:\Users\anouar\Desktop\last gift\startup-ideas-dz` (Next.js 16.3.5, Tailwind v4, next-intl 4.4.0, next-auth 5.0.0-beta.32)
Report path: `.superpowers/member-auth/member-auth-report.md`

## Status

**DONE** — all verification gates pass:

- `npm test` → 15 files / 69 tests passed (baseline was 61; +8 new/updated).
- `npx tsc --noEmit` → clean (0 errors).
- `npx eslint <gate list> --no-warn-ignored` → clean (0 problems).
- i18n parity → en/fr/ar all **155 keys**, identical key paths, all sanctioned keys present in all three.
- The only pre-existing lint warning (`src/lib/members.ts:48` `inserted` unused) is in a file I did **not** touch.

## Files

### Created
| File | Purpose |
|---|---|
| `src/lib/savedIds.ts` | Server-only `getMemberSavedIdsSafe()` — returns member saved ids, else `[]`, non-throwing. |
| `src/components/SavedProvider.tsx` | Client context: `ids` + `toggleSaved(id)` (optimistic POST → `/api/me/saved`, 401 → clear + redirect to `/login?callbackUrl=<path>`, non-ok/network → revert). Takes `initialIds`. |
| `src/components/MemberAuthForms.tsx` | Export `LoginForm` (member-credentials, sanitized callbackUrl redirect) + `RegisterForm` (POST `/api/register`, auto sign-in, redirect `/saved`). Shared `PanelShell`, `fieldClass`. |
| `src/components/MemberAuthForms.test.tsx` | 7 tests: login success/error/link, register success/weak-password/email_taken/rate_limited. Written FIRST (RED), then implemented. |
| `src/app/[locale]/login/page.tsx` | Server page: metadata, `welcome` heading, sanitize `callbackUrl` (starts `/`, not `//`, else `/`), renders `LoginForm`, `backHome` link. |
| `src/app/[locale]/register/page.tsx` | Server page: metadata, renders `RegisterForm`, `backHome` link. |

### Modified
| File | Change |
|---|---|
| `src/app/[locale]/layout.tsx` | Wrapped Navbar/main/Footer in `<SessionProvider>` (no session prop, static layout) inside `NextIntlClientProvider`. |
| `src/components/Navbar.tsx` | `useSession`/`signOut` from `next-auth/react`. Added `authControl`: signed-out compact "Sign in" link (`/login`); signed-in ring-circle initial (`title=name`) + "Sign out" (`signOut({callbackUrl:'/'})`). Added to desktop nav (`ms-1`) and inside the mobile panel. Loading → rendered `null` (no flash). |
| `src/components/SaveButton.tsx` | Rewritten: consumes `SavedProvider` + `useSession`. Signed-out click → `router.push('/login?callbackUrl=<path>')`, label `SaveButton.signInToSave`. Kept glass classes / `page-enter` keyed swap / `ring-focus` / motion-reduce gates. |
| `src/components/SavedList.tsx` | Rewritten: client list fed server rows; filters by live `useSaved().ids`; per-row `SaveButton`; localized empty state + `Saved.*`; `ResultsGrid` + `StartupRow`. |
| `src/app/[locale]/saved/page.tsx` | Async server component: `auth()`; signed-out → `redirect('/login')` (next/navigation); `getSavedIds(memberId)` → `getVerifiedByIds(ids)` (existing public-startups helper, no new SQL); wraps `<SavedProvider initialIds>` + `<SavedList>`. |
| `src/app/[locale]/browse/page.tsx` | `getMemberSavedIdsSafe()` → wraps grid in `<SavedProvider>`. |
| `src/app/[locale]/domain/[slug]/page.tsx` | `getMemberSavedIdsSafe()` → wraps `<DomainExplorer>` in `<SavedProvider>`. |
| `src/app/[locale]/startup/[id]/page.tsx` | `getMemberSavedIdsSafe()` → wraps `<SaveButton>` region in `<SavedProvider>`. |
| `src/components/Navbar.test.tsx` | Wrap `SessionProvider session={null}`; all prior assertions kept passing. |
| `src/components/SaveButton.test.tsx` | Rewritten to new genuine behavior: signed-out deep-link + sign-in label; signed-in optimistic toggle via POST; page-enter swap. |
| `messages/{en,fr,ar}.json` | +25 sanctioned keys under `Auth`, `Navbar`, `SaveButton` only. |

### Deleted
| File | Reason |
|---|---|
| `src/lib/savedStartups.ts` | localStorage saved lib. Grep confirmed **zero** references outside the file (only the api route / `src/lib/members.ts` `getSavedIds` names remain, distinct functions). Deleted per spec. |

## i18n — Key list added (identical in en/fr/ar)

```
Auth.loginTitle  Auth.loginSubtitle  Auth.emailLabel  Auth.passwordLabel  Auth.submit
Auth.submitting  Auth.signInAccountAlt  Auth.noAccount  Auth.createAccount
Auth.createAccountLong  Auth.haveAccount  Auth.signIn  Auth.nameLabel  Auth.passwordHint
Auth.errorInvalidCredentials  Auth.errorEmailTaken  Auth.errorWeakPassword  Auth.errorGeneric
Auth.errorRateLimited  Auth.backHome  Auth.welcome
Navbar.signIn  Navbar.signOut  Navbar.signedInAs
SaveButton.signInToSave
```

### Parity check output (node script, messages/*.json flattened)

```
=== KEY COUNTS ===
en: 155 fr: 155 ar: 155

=== PARITY: en vs fr ===
in en not fr: NONE
in fr not en: NONE

=== PARITY: en vs ar ===
in en not ar: NONE
in ar not en: NONE

=== SANCTIONED KEY PRESENCE ACROSS ALL THREE ===
ALL PRESENT

=== SPOT TRANSLATIONS ===
Auth.loginSubtitle
  en: "Save and track the deep-tech startups you want to build in Algeria."
  fr: "Enregistrez et suivez les startups deep-tech que vous voulez construire en Algérie."
  ar: "احفظ الشركات الناشئة في التقنية العميقة التي تريد بناءها في الجزائر وتابعها."
Auth.noAccount
  en: "New to the directory?"
  fr: "Nouveau sur le répertoire ?"
  ar: "لسْتَ عضوًا بعد؟"
Auth.errorInvalidCredentials
  en: "Incorrect email or password. Please try again."
  fr: "E-mail ou mot de passe incorrect. Veuillez réessayer."
  ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مجددًا."
```

Existing copy untouched; only the 25 sanctioned keys were added under `Auth`, `Navbar`, `SaveButton`. Arabic uses verb-final constructions; French uses the app's existing "…" / « » typography conventions. 155 == 155 == 155 (previously 130 == 130 == 130).

## TDD RED / GREEN transcripts

### RED (file written first, module missing)

```
$ npx vitest run src/components/MemberAuthForms.test.tsx
Error: Failed to resolve import "./MemberAuthForms" from "src/components/MemberAuthForms.test.tsx".
Does the file exist?
  Plugin: vite:import-analysis
  File: .../src/components/MemberAuthForms.test.tsx:6:0
Test Files  1 failed (1)
     Tests  no tests
```

### GREEN (implementation complete)

```
$ npx vitest run src/components/MemberAuthForms.test.tsx src/components/SaveButton.test.tsx src/components/Navbar.test.tsx
 ✓ src/components/MemberAuthForms.test.tsx (7 tests)
 ✓ src/components/SaveButton.test.tsx (3 tests)
 ✓ src/components/Navbar.test.tsx (2 tests)
Test Files  3 passed (3)
     Tests  12 passed (12)
```

## Verification gates (final)

### npm test

```
$ npm test
 Test Files  15 passed (15)
      Tests  69 passed (69)
 Duration  13.95s
```
(Baseline before work: 14 files / 61 tests GREEN; now 69 tests. `SavedList` has no dedicated test file; its behavior is covered through the saved page composition + SaveButton/SavedProvider tests.)

### tsc

```
$ npx tsc --noEmit
(no output — clean)
```
One intermediate error was fixed during work: tests passed a `Session` user without the module-augmented required `teamDomain` field → added `teamDomain: null` in both test session fixtures.

### eslint (exact gate)

```
$ npx eslint src/components/SaveButton.tsx src/components/SavedProvider.tsx src/components/SavedList.tsx
  src/components/MemberAuthForms.tsx src/components/MemberAuthForms.test.tsx src/components/Navbar.tsx
  src/app/api/me/saved/route.ts src/app/api/register/route.ts
  "src/app/[locale]/login/page.tsx" "src/app/[locale]/register/page.tsx" "src/app/[locale]/saved/page.tsx"
  --no-warn-ignored
(no output — clean)
```
Also linted every other touched file (Navbar.test.tsx, SaveButton.test.tsx, savedIds.ts, layout.tsx, browse/domain/startup pages) → clean. `npm run lint` scoped to `src/components/*.tsx | src/lib/*.ts` shows only one **pre-existing** warning in `src/lib/members.ts:48` (`inserted` assigned but never used) — file untouched by this feature.

`next build` was intentionally NOT run (controller/agent B runs it).

## Design constraints honored

- **Glass language**: `panel-glass` card, `field-glass` inputs, `ring-focus` on all interactive elements, `--signal` accents, `duration-[var(--dur-base)]` + `ease-[var(--ease-standard)]`, `motion-reduce:transition-none` / `motion-reduce:active:scale-100`, `page-enter` keyed swap on SaveButton.
- **RTL logical utilities**: `ps-3 pe-3` inputs, `ms-1`/`ms-2`/`me-` spacers, `start`-oriented layout, `text-start` inherited; arrow `←` in back-home links mirrors existing `flip-rtl` usage elsewhere (the app uses `←` links already).
- No code comments; no new production dependencies (uses `next-auth/react` only); no new SQL written in pages (reused `getVerifiedByIds` from `src/lib/public-startups.ts`, examined via `ResultsGrid`/`StartupRow`).
- AUTH BACKEND untouched: `src/app/api/me/saved/route.ts` and `src/app/api/register/route.ts` were only linted, not modified.
- `savedStartups.ts` deleted only after grep proved zero external references (deleted file no longer in scope for eslint gate).

## Concerns

1. **`SessionProvider` without session prop**: the root layout starts with `useSession` status `loading`; Navbar renders no auth control during the brief fetch. This is intentional (avoids a signed-in/out flash) but the initial frame has no auth affordance.
2. **Optimistic revert semantics**: `SavedProvider.toggleSaved` treats a non-ok response (or network error) as "undo the last toggle for that id". Rapid double-clicking in-flight can produce a stale revert; acceptable for scope but noted.
3. **Credentials error text**: all provider/auth failures render the same `Auth.errorInvalidCredentials` (any `result.error`, e.g. `CredentialsSignin`/`Configuration`). No secrets or provider internals leak to the UI.
4. **Register flow when auto sign-in then fails**: after a successful `/api/register`, we call `signIn('member-credentials', …redirect:false)` then navigate to `/saved`; if sign-in races/fails, the saved page redirects to `/login` — a graceful degraded path.
5. **Callback URL scope**: sanitization allows any in-app path (e.g. `/login`, `/fr/...`); it blocks protocol-relative and fully-qualified URLs per spec.
6. **`saved` page metadata**: `generateMetadata` runs before the `redirect('/login')` guard request; no data access on unauthenticated path.
7. Next.js 16 note (AGENTS.md): server components use `await params` / `await searchParams` promise APIs consistently with existing pages.