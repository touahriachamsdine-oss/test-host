# Admin console — trilingual i18n (en/fr/ar) via next-intl

**Status:** DONE (with documented pre-existing baseline failures outside scope)

## Objective

Refactor the admin console (`/admin`) of the Next.js 16 + Tailwind v4 app at
`startup-ideas-dz` from hardcoded French to a fully trilingual next-intl setup
(en/fr/ar), without affecting the public app, its routes, layout structure, or
server data logic.

## Locale resolution for /admin

`/admin` lives outside any `[locale]` route and is excluded from the middleware
(`src/proxy.ts`), so `src/i18n/request.ts` must not be relied on (its `notFound()`
branch would 404 admin pages). Instead:

- New server-module `src/app/admin/i18n.ts` reads the `NEXT_LOCALE` cookie
  (async `cookies()`), validates it against `routing.locales` via the
  `hasLocale(routing.locales, value)` type guard (accepts `unknown`), and falls
  back to `'fr'` (the console's original language).
- Messages are resolved with a **static** import map (`en`/`fr`/`ar` JSON) — a
  variable-path dynamic `import()` is not allowed by bundler/type constraints.
- `src/app/admin/layout.tsx` is the single mount point (the login page has no
  layout of its own, so it inherits the provider): it renders
  `<NextIntlClientProvider locale={locale} messages={messages}>`, sets
  `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`, and returns the
  translated metadata title through `generateMetadata()` +
  `getTranslations({ locale, namespace: 'Admin' })`.

Server pages use the overloaded `getTranslations({ locale, namespace: 'Admin' })`
(verified in installed next-intl 4.14.4) — the plain `getTranslations('Admin')`
form would invoke request.ts and call `notFound()`.

## Verified facts (deviations from task assumptions)

- `src/i18n/routing.ts`: `locales: ['ar', 'fr', 'en']`, `defaultLocale: 'ar'`
  (the task assumed `'en'`). Admin fallback is therefore **`'fr'`** regardless.
- Real public message key count is **154** per locale, not the 155 stated in the
  task. Verified flat-key count for en/fr/ar before the change: 154 each.
- Installed next-intl is **4.14.4** (package.json constraint `^4.4.0`).
- The three message files contain mojibake (double-encoded UTF-8) in public
  values; untouched bytes preserved. `messages/en.json`, `fr.json`, `ar.json`
  all parse as valid JSON and type as plain string maps.
- Baseline `npm test` already fails 6 tests (see Concerns).

## Files changed

Added `Admin` namespace (188 keys, identical flat key set in all three locales):

- `messages/fr.json`
- `messages/en.json`
- `messages/ar.json`

New shared server helper:

- `src/app/admin/i18n.ts` — `getAdminLocale()`, `getAdminMessages()`, static
  message map with `'fr'` fallback.

Provider / metadata:

- `src/app/admin/layout.tsx` — `NextIntlClientProvider`, `lang`/`dir`,
  `generateMetadata` with `Admin.metadata.title`.

Client components → `useTranslations('Admin')`:

- `src/app/admin/AdminNav.tsx` — nav labels, brand, role, sign-out
- `src/app/admin/login/LoginForm.tsx` — login card, errors, placeholders
- `src/app/admin/(protected)/dashboard/DashboardCards.tsx` — stat cards, tables,
  team quotas
- `src/app/admin/(protected)/review/ReviewQueue.tsx` — filters, status pills,
  actions, `useFormatter` for dates
- `src/app/admin/(protected)/import/ImportSheet.tsx` — field/delimiter/reason
  maps (from `FIELD_LABELS`/`DELIM_LABELS`/`translateReason`), ICUs plurals
- `src/app/admin/(protected)/submit/SubmitForm.tsx` — form labels, errors
- `src/app/admin/(protected)/submit/MySubmissions.tsx` — section title, status
- `src/app/admin/(protected)/users/UsersManager.tsx` — invite form, role selects
- `src/app/admin/(protected)/teams/TeamsManager.tsx` — table headers, save OK
- `src/app/admin/(protected)/domains/DomainManager.tsx` — headers, status map

Server pages → `getTranslations({ locale: await getAdminLocale(), namespace: 'Admin' })`:

- `src/app/admin/(protected)/domains/page.tsx`
- `src/app/admin/(protected)/import/page.tsx`
- `src/app/admin/(protected)/teams/page.tsx`

(dashboard/review/submit/users pages and the login page render only client
components and needed no server-side text.)

Smoke + parity test:

- `src/app/admin/AdminI18n.test.tsx` — 4 tests (see Gates below)

## Test file (RED → GREEN)

- **RED (before refactor):** the English `AdminNav` assertion (`Dashboard`,
  `Sign out`) failed because components rendered hardcoded French regardless of
  locale. Logged failure: "Unable to find an accessible element with the role
  link and name Dashboard" (1 failed / 3 passed).
- **GREEN (after refactor):** 4/4 pass.
  - French `AdminNav` renders `Tableau de bord`, `Soumettre une idée`,
    `Plateforme officielle`, `Administrateur`, `Site public`, `Déconnexion`.
  - English `AdminNav` renders `Dashboard`, `Submit an idea`, `Sign out`.
  - Flat key sets of en/fr/ar are identical.
  - Public keys equal the pre-change reference (154 keys), Admin namespace
    contains exactly 188 keys in all three locales.
  - Mocks: `next/link` (default → `<a>`), `next/navigation` (`usePathname`),
    `next-auth/react` (`signOut`).

## Parity output

Before refactor (baseline): en 154 keys, fr 154 keys, ar 154 keys.

After adding `Admin`:

- en 342 = 154 public + 188 Admin
- fr 342 = 154 public + 188 Admin
- ar 342 = 154 public + 188 Admin
- `en == fr == ar` flat key sets: `true`
- public keys match pre-change set (154): `true`

## Gates

| Gate | Result |
| --- | --- |
| `npm test` (full suite) | 73 tests → **67 passed / 6 failed**. New admin file 4/4. All 6 failures are the pre-existing baseline set. |
| `npx tsc --noEmit` | **2 errors, both in untouched public `src/app/[locale]/saved/page.tsx`** (pre-existing; see Concerns). Admin tree: 0 errors. |
| `npx eslint src/app/admin --no-warn-ignored` | **0 problems** (after adding `t` to `useEffect` deps in ReviewQueue + UsersManager). |

Not run (per task): `next build`.

## Concerns

1. **Pre-existing failing tests (6):** `SaveButton.test.tsx` (2), `FilterPanel.test.tsx`
   (2), `DomainExplorer.test.tsx` (1), `MemberAuthForms.test.tsx` (1). Same set
   before this work (63/69 baseline). Root cause: mojibake message values and one
   mismatched public message text (`MemberAuthForms` expects a different rate-limit
   string). Fixing requires editing public message values, which is out of scope.
2. **Pre-existing tsc errors (2)** in `src/app/[locale]/saved/page.tsx` (locale
   redirect typing + `session` null-narrowing). File untouched by this work;
   noted so `tsc --noEmit` is understood to already fail at baseline.
3. **Public key count is 154, not 155** as the task assumed (verified after
   flattening all three locales).
4. `Admin.brand.title` / `Admin.metadata.title` are deliberately brand-string
   ("Startup Ideas DZ"), left identical across locales by design.
5. Date rendering in the review queue now uses `useFormatter()` and therefore
   follows the active locale (previously hardcoded `fr-FR`).

## Next steps (if continuing)

- None required for this task. Optionally: fix the pre-existing public test
  failures / tsc errors in a separate, scoped change.

## REBUILD (post-corruption)

### Context
The three `messages/{en,fr,ar}.json` files were found to contain a clean sandbox
base (130 public keys) with the `Admin` namespace and the member-auth keys
missing — i.e. the previously-written admin i18n content had been lost. Verified:

- `worktrees/startup-ideas-dz-premium/messages/*.json` = pristine sandbox base
  (no `Admin`, no `Auth`).
- `worktrees/startup-ideas-dz-premium/src/app/admin/**` = the ORIGINAL
  pre-refactor, hardcoded-French admin console → authoritative French source.
- `backups/startup_ideas_dz_20260914-004203.dump` is a **PGDMP PostgreSQL
  dataset dump**, not a messages backup.
- No `messages/*.json` anywhere in the temp tree contains an `Admin` namespace.
- Not a git repository; no history to recover.

Conclusion: **no byte-faithful backup of the Admin content exists.** All Admin
values were therefore **re-derived** (full trilingual list below): French 1:1
from the pre-refactor hardcoded-French worktree components; English as their
natural translation (aligned with values locked in `AdminI18n.test.tsx`, e.g.
Dashboard / Submit an idea / Sign out); Arabic as natural equivalents. The
member-auth EN strings were available verbatim from the reconciliation
spot-translations and passing baseline test assertions; their FR / AR
equivalents were re-derived and are listed below too.

### Reconciliations applied
1. `Auth.errorRateLimited` = `Too many attempts. Please try again in an hour.`
   / `Trop de tentatives. Réessayez dans une heure.` /
   `محاولات كثيرة جداً. أعد المحاولة بعد ساعة.` (applied in all three files)
2. `Navbar.signedInAs` remains deleted (zero usages in `src/`; sandbox base
   already lacks it; no code change).
3. `src/components/MemberAuthForms.test.tsx:197` updated to assert the new
   rate-limit text.

### Rebuild procedure & checks
Node script (`JSON.stringify(obj, null, 2)` + trailing newline, UTF-8 no BOM):
insert `Auth` after `Navbar`, add `Navbar.signIn`/`signOut` and
`SaveButton.signInToSave`, append `Admin` as the last top-level namespace.
Validation before writing (all 12 checks OK): Admin=188, public=154, total=342,
`en==fr==ar` flat key parity, no `signedInAs`, dotted-key / value-mojibake
guards, and structural layout (Auth after Navbar, Admin last).

Note: the two `Admin.review.errors.*` keys were written as a nested
`errors: { load, action }` object (use-intl rejects dotted key segments —
`INVALID_KEY: errors.load (at Admin.review)`), confirmed by a warning-free
test run.

### Final gates (after rebuild)
| Gate | Result |
| --- | --- |
| `npm test` (full suite) | **16 files / 73 tests passed, 0 failed** (no INVALID_KEY warnings) |
| `npx tsc --noEmit` | **0 errors** (fixed `src/app/[locale]/saved/page.tsx` userId narrowing) |
| `npx eslint src --max-warnings 0` | **0 problems** |

Not run (per task): `next build`.

### Re-derived values (complete trilingual list)
`Admin.*` = French sourced from the pre-refactor worktree originals, English and
Arabic translated (brand/title strings identical per design). The 24 member-auth
keys = English exact (test-locked / sandbox), French & Arabic re-translated.

| Key | EN | FR | AR |
| --- | --- | --- | --- |
| `Auth.loginTitle` | Sign in | Connexion | تسجيل الدخول |
| `Auth.loginSubtitle` | Save and track the deep-tech startups you want to build in Algeria. | Enregistrez et suivez les startups deep-tech que vous voulez construire en Algérie. | احفظ الشركات الناشئة في التقنية العميقة التي تريد بناءها في الجزائر وتابعها. |
| `Auth.emailLabel` | Email | E-mail | البريد الإلكتروني |
| `Auth.passwordLabel` | Password | Mot de passe | كلمة المرور |
| `Auth.submit` | Sign in | Se connecter | تسجيل الدخول |
| `Auth.submitting` | Signing in… | Connexion… | جارٍ تسجيل الدخول… |
| `Auth.signInAccountAlt` | Sign-in account icon | Icône de compte de connexion | أيقونة حساب تسجيل الدخول |
| `Auth.noAccount` | New to the directory? | Nouveau sur le répertoire ? | لسْتَ عضوًا بعد؟ |
| `Auth.createAccount` | Create an account | Créer un compte | إنشاء حساب |
| `Auth.createAccountLong` | Create an account | Créer un compte | إنشاء حساب |
| `Auth.haveAccount` | Already have an account? | Vous avez déjà un compte ? | هل لديك حساب بالفعل؟ |
| `Auth.signIn` | Sign in | Se connecter | تسجيل الدخول |
| `Auth.nameLabel` | Full name | Nom complet | الاسم الكامل |
| `Auth.passwordHint` | At least 8 characters | Au moins 8 caractères | 8 أحرف على الأقل |
| `Auth.errorInvalidCredentials` | Incorrect email or password. Please try again. | E-mail ou mot de passe incorrect. Veuillez réessayer. | البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مجددًا. |
| `Auth.errorEmailTaken` | An account with this email already exists. | Un compte existe déjà avec cet e-mail. | يوجد حساب بالفعل بهذا البريد الإلكتروني. |
| `Auth.errorWeakPassword` | Your password must be at least 8 characters. | Votre mot de passe doit contenir au moins 8 caractères. | يجب أن تتكون كلمة المرور من 8 أحرف على الأقل. |
| `Auth.errorGeneric` | Something went wrong. Please try again. | Une erreur est survenue. Veuillez réessayer. | حدث خطأ ما. حاول مجددًا. |
| `Auth.errorRateLimited` | Too many attempts. Please try again in an hour. | Trop de tentatives. Réessayez dans une heure. | محاولات كثيرة جداً. أعد المحاولة بعد ساعة. |
| `Auth.backHome` | Back to home | Retour à l'accueil | العودة إلى الرئيسية |
| `Auth.welcome` | Welcome back! | Bon retour ! | مرحبًا من جديد! |
| `Navbar.signIn` | Sign in | Se connecter | تسجيل الدخول |
| `Navbar.signOut` | Sign out | Se déconnecter | تسجيل الخروج |
| `SaveButton.signInToSave` | Sign in to save | Connectez-vous pour enregistrer | سجّل الدخول للحفظ |
| `Admin.metadata.title` | Startup Ideas DZ — Administration | Startup Ideas DZ — Administration | Startup Ideas DZ — الإدارة |
| `Admin.brand.title` | Startup Ideas DZ | Startup Ideas DZ | Startup Ideas DZ |
| `Admin.nav.dashboard` | Dashboard | Tableau de bord | لوحة القيادة |
| `Admin.nav.submitIdea` | Submit an idea | Soumettre une idée | اقتراح فكرة |
| `Admin.nav.reviewQueue` | Review queue | File de revue | قائمة المراجعة |
| `Admin.nav.domainsValidation` | Domains — validation | Domaines — validation | المجالات — التحقق |
| `Admin.nav.teamsQuotas` | Teams & quotas | Équipes & quotas | الفرق والحصص |
| `Admin.nav.importSheet` | Import an Excel sheet | Importer une feuille Excel | استيراد جدول Excel |
| `Admin.nav.guestAccounts` | Guest accounts | Comptes invités | الحسابات المدعوة |
| `Admin.nav.platformTag` | Official platform | Plateforme officielle | المنصة الرسمية |
| `Admin.nav.publicSite` | Public site | Site public | الموقع العمومي |
| `Admin.nav.signOut` | Sign out | Déconnexion | تسجيل الخروج |
| `Admin.roles.team` | Team | Équipe | فريق |
| `Admin.roles.reviewer` | Reviewer | Reviseur | مراجع |
| `Admin.roles.admin` | Administrator | Administrateur | مشرف |
| `Admin.status.pending` | Pending | En attente | قيد الانتظار |
| `Admin.status.verified` | Validated | Validée | مُتحقَّق منها |
| `Admin.status.rejected` | Rejected | Refusée | مرفوضة |
| `Admin.common.loading` | Loading… | Chargement… | جارٍ التحميل… |
| `Admin.common.saveError` | Could not save (permissions error or server error). | Impossible d’enregistrer (permissions ou erreur serveur). | تعذّر الحفظ (خطأ في الصلاحيات أو في الخادم). |
| `Admin.common.urlPlaceholder` | https://… | https://… | https://… |
| `Admin.login.errorInvalidCredentials` | Invalid credentials. Accounts are reserved for invited staff. | Identifiants invalides. Comptes réservés au personnel invité. | بيانات دخول غير صحيحة. الحسابات مخصصة للموظفين المدعوين فقط. |
| `Admin.login.title` | Secure space | Espace sécurisé | فضاء آمن |
| `Admin.login.subtitle` | Access restricted to invited government accounts | Accès réservé aux comptes invités du gouvernement | الوصول مخصص لحسابات الحكومة المدعوة |
| `Admin.login.emailLabel` | Institutional email | Email institutionnel | البريد المؤسسي |
| `Admin.login.emailPlaceholder` | name@mpme.gov.dz | nom@mpme.gov.dz | name@mpme.gov.dz |
| `Admin.login.passwordLabel` | Password | Mot de passe | كلمة المرور |
| `Admin.login.submitting` | Signing in… | Connexion… | جارٍ تسجيل الدخول… |
| `Admin.login.submit` | Sign in | Se connecter | تسجيل الدخول |
| `Admin.login.footerText` | No public account is created automatically. The administrator invites each user. | Aucun compte public n'est créé automatiquement. L'administrateur invite chaque utilisateur. | لا يتم إنشاء أي حساب عمومي تلقائيًا. يوجه المشرف دعوة إلى كل مستخدم. |
| `Admin.dashboard.cardProposed` | Proposed (pending) | Proposées (pending) | المقترحة (قيد الانتظار) |
| `Admin.dashboard.cardValidated` | Validated | Validées | المُتحقَّق منها |
| `Admin.dashboard.cardRejected` | To check / rejected | À vérifier / refusées | للتحقق / المرفوضة |
| `Admin.dashboard.cardDuplicates` | 2025 duplicates | Doublons 2025 | المكررات 2025 |
| `Admin.dashboard.cardProgress` | Progress | Progression | التقدم |
| `Admin.dashboard.cardTotal` | Total | Total | المجموع |
| `Admin.dashboard.title` | Dashboard | Tableau de bord | لوحة القيادة |
| `Admin.dashboard.subtitle` | Consolidated view of the program, aligned with the government's DASHBOARD sheet. | Vue consolidée du programme, alignée sur la feuille DASHBOARD du gouvernement. | نظرة موحدة على البرنامج، متوافقة مع ورقة DASHBOARD الحكومية. |
| `Admin.dashboard.byDomainTitle` | By technology domain | Par domaine technologique | حسب المجال التقني |
| `Admin.dashboard.colDomain` | Domain | Domaine | المجال |
| `Admin.dashboard.colTotal` | Total | Total | المجموع |
| `Admin.dashboard.colValidated` | Validated | Validées | مُتحقَّق منها |
| `Admin.dashboard.colPending` | Pending | Pending | قيد الانتظار |
| `Admin.dashboard.colRejected` | Rejected | Refusées | مرفوضة |
| `Admin.dashboard.colDuplicates` | Duplicates | Doublons | مكررات |
| `Admin.dashboard.byTeamTitle` | By team | Par équipe | حسب الفريق |
| `Admin.dashboard.colTeam` | Team | Équipe | الفريق |
| `Admin.dashboard.colSubmissions` | Submissions | Soumissions | الطلبات |
| `Admin.dashboard.unassigned` | Unassigned | Non assignée | غير مسندة |
| `Admin.dashboard.teamQuotasTitle` | Team quotas | Quotas par équipe | حصص الفرق |
| `Admin.dashboard.teamQuotasSubtitle` | Progress of the 15 teams toward their reference quota. | Progression des 15 équipes vers leur quota de références. | تقدّم الفرق الخمسة عشر نحو حصتها من المراجع. |
| `Admin.review.errors.load` | Could not load the review queue. | Impossible de charger la file de revue. | تعذّر تحميل قائمة المراجعة. |
| `Admin.review.errors.action` | Action failed (permissions error or server error). | Action impossible (permissions ou erreur serveur). | تعذّرت العملية (خطأ في الصلاحيات أو في الخادم). |
| `Admin.review.title` | Review queue | File de revue | قائمة المراجعة |
| `Admin.review.subtitle` | Approve, reject, set the priority (A/B/C) or flag duplicates. Every action is logged in the audit trail. | Approuvez, refusez, fixez la priorité (A/B/C) ou signalez les doublons. Chaque action est journalisée dans l'audit. | وافق، ارفض، حدّد الأولوية (A/B/C) أو ميّز المكررات. كل عملية تُسجَّل في سجل التدقيق. |
| `Admin.review.filterPending` | To review | À revoir | بانتظار المراجعة |
| `Admin.review.filterVerified` | Validated | Validées | مُتحقَّق منها |
| `Admin.review.filterRejected` | Rejected | Refusées | مرفوضة |
| `Admin.review.empty` | No entries {filter}. | Aucune entrée {filter}. | لا توجد إدخالات {filter}. |
| `Admin.review.duplicateBadge` | 2025 duplicate | Doublon 2025 | مكرر 2025 |
| `Admin.review.technologyLabel` | Technology: | Technologie : | التقنية: |
| `Admin.review.relevanceLabel` | Relevance: | Pertinence : | الأهمية: |
| `Admin.review.submittedOn` | Submitted on {date} | Soumis le {date} | أُرسل في {date} |
| `Admin.review.approve` | Approve | Approuver | اعتماد |
| `Admin.review.reject` | Reject | Refuser | رفض |
| `Admin.review.priorityLabel` | Priority | Priorité | الأولوية |
| `Admin.review.removeDuplicate` | Remove duplicate | Retirer doublon | إزالة المكرر |
| `Admin.review.markDuplicate` | Mark as 2025 duplicate | Marquer doublon 2025 | تحديد كمكرر 2025 |
| `Admin.domainsPage.title` | Domains — validation | Domaines — validation | المجالات — التحقق |
| `Admin.domainsPage.subtitle` | Matches the LISTES sheet: set the validation status and priority tier of each technology domain. Every action is logged. | Correspond à la feuille LISTES : définissez le statut de validation et le palier de priorité de chaque domaine technologique. Chaque action est journalisée. | مطابق لورقة LISTES: حدّد حالة التحقق ومستوى الأولوية لكل مجال تقني. كل عملية تُسجَّل. |
| `Admin.domains.colDomain` | Domain | Domaine | المجال |
| `Admin.domains.colArabic` | Arabic | Arabe | العربية |
| `Admin.domains.colStartups` | Startups | Startups | الشركات الناشئة |
| `Admin.domains.colValidationTier` | Validation + tier | Validation + palier | التحقق + المستوى |
| `Admin.domains.statusToCheck` | To check | À vérifier | للتحقق |
| `Admin.domains.statusInProgress` | In progress | En cours | قيد الإنجاز |
| `Admin.domains.statusValidated` | Validated | Validée | مُتحقَّق منها |
| `Admin.domains.statusRejected` | Rejected | Rejetée | مرفوضة |
| `Admin.domains.noTier` | No tier | Aucun palier | بدون مستوى |
| `Admin.domains.save` | Save | Enregistrer | حفظ |
| `Admin.importPage.title` | Import an Excel sheet | Importer une feuille Excel | استيراد جدول Excel |
| `Admin.importPage.subtitle` | Paste rows copied from the LISTES sheet (or any CSV export of your workbook). Duplicates are detected by name; each row becomes a "to check" proposal in the review queue. Actions are logged. | Collez des lignes copiées depuis la feuille LISTES (ou tout export CSV de votre classeur). Les doublons sont détectés par nom ; chaque ligne devient une proposition « à vérifier » dans la file de revue. Les actions sont journalisées. | الصق الأسطر المنسوخة من ورقة LISTES (أو أي تصدير CSV من دفترك). تُكتشف المكررات حسب الاسم؛ يصبح كل سطر مقترحًا «للتحقق» في قائمة المراجعة. تُسجَّل جميع العمليات. |
| `Admin.import.reason.unknownDomain` | Unknown domain | Domaine inconnu | مجال غير معروف |
| `Admin.import.reason.shortDescription` | Description too short (≥ 10 characters) | Description trop courte (≥ 10 caractères) | الوصف قصير جدًا (≥ 10 أحرف) |
| `Admin.import.reason.invalidName` | Invalid name | Nom invalide | اسم غير صالح |
| `Admin.import.reason.invalidCountry` | Invalid country | Pays invalide | دولة غير صالحة |
| `Admin.import.reason.invalidYear` | Invalid year (≥ 1980) | Année invalide (≥ 1980) | سنة غير صالحة (≥ 1980) |
| `Admin.import.reason.invalidUrl` | Invalid link (URL) | Lien (URL) invalide | رابط (URL) غير صالح |
| `Admin.import.reason.invalidPriority` | Invalid priority (A, B or C) | Priorité invalide (A, B ou C) | أولوية غير صالحة (A أو B أو C) |
| `Admin.import.reason.missingName` | Missing name | Nom manquant | اسم مفقود |
| `Admin.import.reason.duplicateName` | Already registered (identical name) | Déjà enregistré (nom identique) | مسجّل مسبقًا (اسم مطابق) |
| `Admin.import.delim.tab` | tab | tabulation | تبويب |
| `Admin.import.delim.semicolon` | semicolon | point-virgule | فاصلة منقوطة |
| `Admin.import.delim.comma` | comma | virgule | فاصلة |
| `Admin.import.delim.pipe` | vertical bar | barre verticale | شريط عمودي |
| `Admin.import.notice.pasteFirst` | Paste some rows into the area below first. | Collez d'abord des lignes dans la zone ci-dessous. | الصق الأسطر في المنطقة أدناه أولًا. |
| `Admin.import.notice.importFailed` | Import failed (session expired or server error). Sign in again if needed. | Échec de l'import (session expirée ou erreur serveur). Reconnectez-vous si besoin. | فشل الاستيراد (انتهت الجلسة أو خطأ في الخادم). أعد تسجيل الدخول عند الحاجة. |
| `Admin.import.notice.fileTooLarge` | File too large (500 KB limit). Reduce the selection. | Fichier trop volumineux (limite 500 Ko). Réduisez la sélection. | الملف كبير جدًا (الحد الأقصى 500 كيلوبايت). قلّل التحديد. |
| `Admin.import.openFile` | Open a CSV / TSV file | Ouvrir un fichier CSV / TSV | فتح ملف CSV / TSV |
| `Admin.import.or` | or | ou | أو |
| `Admin.import.copyPasteHint` | copy your range from Excel and paste it below | copiez votre plage depuis Excel et collez-la ci-dessous | انسخ نطاقك من Excel والصقه أدناه |
| `Admin.import.textareaPlaceholder` | Name	Country	Domain	Description	Year	Priority
Quantex	Algeria	semiconductors	Quantum reference…	2023	A | Nom	Pays	Domaine	Description	Année	Priorité
Quantex	Algérie	semiconductors	Référenceur quantique…	2023	A | الاسم	البلد	المجال	الوصف	السنة	الأولوية
Quantex	الجزائر	semiconductors	مرجع كمي…	2023	A |
| `Admin.import.analyse` | Analyze rows | Analyser les lignes | تحليل الأسطر |
| `Admin.import.reset` | Reset | Réinitialiser | إعادة تهيئة |
| `Admin.import.linesDetected` | {count, plural, one {# line detected} other {# lines detected}} | {count, plural, one {# ligne détectée} other {# lignes détectées}} | {count, plural, =0 {لا أسطر} one {سطر واحد} two {سطران} few {# أسطر} many {# سطرًا} other {# سطر}} |
| `Admin.import.delimiterLabel` | Delimiter: | Délimiteur : | الفاصل: |
| `Admin.import.headerLabel` | Header: | En-tête : | الترويسة: |
| `Admin.import.headerDetected` | detected | détecté | مُكتشف |
| `Admin.import.headerNotDetected` | not detected | non détecté | غير مُكتشف |
| `Admin.import.noHeaderDetected` | No recognized header: columns are read in the standard order (name, country, domain, description…). The expected result is: {fields} | Aucun en-tête reconnu : les colonnes sont lues dans l'ordre standard (nom, pays, domaine, description…). Le résultat doit être : {fields} | لم يتم التعرف على ترويسة: تُقرأ الأعمدة بالترتيب القياسي (الاسم، البلد، المجال، الوصف…). يجب أن تكون النتيجة: {fields} |
| `Admin.import.unknownDomainWarning` | {count, plural, one {# line with an unrecognized domain} other {# lines with an unrecognized domain}} (they will be skipped without inserting). Accepted values: French/English/Arabic name or code (e.g. AI, RB, BIO, MED, OTH…). | {count, plural, one {# ligne avec un domaine non reconnu} other {# lignes avec un domaine non reconnu}} (ils seront ignorés sans insérer). Valeurs acceptées : nom français/Anglais/Arabe ou code (ex. AI, RB, BIO, MED, OTH…). | {count, plural, one {# سطر بمجال غير معروف} other {# أسطر بمجال غير معروف}} (ستُتجاهل دون إدراج). القيم المقبولة: اسم بالفرنسية/الإنجليزية/العربية أو رمز (مثل AI، RB، BIO، MED، OTH…). |
| `Admin.import.colLine` | Line | Ligne | السطر |
| `Admin.import.moreLines` | + {count} more lines (the first 500 will be imported). | + {count} autres lignes (les 500 premières seront importées). | + {count} أسطر أخرى (ستُستورد أول 500). |
| `Admin.import.importing` | Importing… | Import en cours… | جارٍ الاستيراد… |
| `Admin.import.submitButton` | Import {count, plural, one {# line} other {# lines}} (status: to check) | Importer {count, plural, one {# ligne} other {# lignes}} (statut : à vérifier) | استيراد {count, plural, one {# سطر} other {# أسطر}} (الحالة: للتحقق) |
| `Admin.import.field.name` | Name | Nom | الاسم |
| `Admin.import.field.country` | Country | Pays | البلد |
| `Admin.import.field.domain` | Domain | Domaine | المجال |
| `Admin.import.field.subDomain` | Specialty | Spécialité | التخصص |
| `Admin.import.field.shortDescription` | Description | Description | الوصف |
| `Admin.import.field.technology` | Technology | Technologie | التقنية |
| `Admin.import.field.yearFounded` | Year | Année | السنة |
| `Admin.import.field.officialSite` | Official site | Site officiel | الموقع الرسمي |
| `Admin.import.field.sourceUrl` | Source | Source | المصدر |
| `Admin.import.field.whyRelevant` | Relevance | Pertinence | الأهمية |
| `Admin.import.field.priority` | Priority | Priorité | الأولوية |
| `Admin.import.field.isDuplicate2025` | 2025 duplicate | Doublon 2025 | مكرر 2025 |
| `Admin.import.detail` | Details | Détail | التفاصيل |
| `Admin.import.lineNumber` | Line {line} | Ligne {line} | السطر {line} |
| `Admin.import.moreErrors` | + {count} more. | + {count} autres. | + {count} أخرى. |
| `Admin.import.newImport` | New import | Nouvel import | استيراد جديد |
| `Admin.import.result.imported` | {count, plural, one {# imported} other {# imported}} | {count, plural, one {# importé} other {# importés}} | {count, plural, one {# مُستورد} other {# مُستوردة}} |
| `Admin.import.result.ignored` | {count, plural, one {# ignored} other {# ignored}} (duplicate) | {count, plural, one {# ignoré} other {# ignorés}} (doublon) | {count, plural, one {# مُتجاهل} other {# مُتجاهلة}} (مكرر) |
| `Admin.import.result.errors` | {count, plural, one {# error} other {# errors}} | {count, plural, one {# erreur} other {# erreurs}} | {count, plural, one {# خطأ} other {# أخطاء}} |
| `Admin.submit.errors.invalidData` | Invalid data. | Données invalides. | بيانات غير صالحة. |
| `Admin.submit.errors.domainForbidden` | Domain not allowed for your team. | Domaine non autorisé pour votre équipe. | المجال غير مسموح به لفريقك. |
| `Admin.submit.errors.submitFailed` | Submission failed. | Échec de la soumission. | فشل الإرسال. |
| `Admin.submit.successCreated` | Submission created successfully ({id}). It is awaiting review. | Soumission créée avec succès ({id}). Elle attend la revue. | تم إنشاء الإرسال بنجاح ({id}). ينتظر المراجعة. |
| `Admin.submit.title` | Submit a startup idea | Soumettre une idée de startup | اقتراح فكرة شركة ناشئة |
| `Admin.submit.domainLocked` | Your team is assigned to the "{domain}" domain. Submissions are restricted to it. | Votre équipe est affectée au domaine «{domain} ». Les soumissions y sont restreintes. | فريقك مُسند إلى مجال "{domain}". الطلبات مقتصرة عليه. |
| `Admin.submit.domainUnlocked` | A "team" account is attached to a specific domain. | Un compte «équipe» est rattaché à un domaine précis. | يرتبط حساب «فريق» بمجال محدّد. |
| `Admin.submit.nameLabel` | Startup name * | Nom de la startup * | اسم الشركة الناشئة * |
| `Admin.submit.countryLabel` | Country | Pays | البلد |
| `Admin.submit.domainLabel` | Technology domain * | Domaine technologique * | المجال التقني * |
| `Admin.submit.subDomainLabel` | Sub-domain | Sous-domaine | المجال الفرعي |
| `Admin.submit.subDomainPlaceholder` | e.g. Diagnostic | ex : Diagnostic | مثال: التشخيص |
| `Admin.submit.yearFoundedLabel` | Year founded * | Année de création * | سنة التأسيس * |
| `Admin.submit.priorityLabel` | Initial priority | Priorité (initiale) | الأولوية (الأولية) |
| `Admin.submit.priorityC` | C — to define | C — à définir | C — يُحدَّد لاحقًا |
| `Admin.submit.technologyLabel` | Technologies * | Technologies * | التقنيات * |
| `Admin.submit.technologyPlaceholder` | e.g. LLM, RAG | ex : LLM, RAG | مثال: LLM, RAG |
| `Admin.submit.shortDescriptionLabel` | Short description * | Description courte * | وصف قصير * |
| `Admin.submit.whyRelevantLabel` | Why is it relevant for Algeria? * | Pourquoi est-ce pertinent pour l'Algérie ? * | لماذا هو مهم للجزائر؟ * |
| `Admin.submit.officialSiteLabel` | Official site | Site officiel | الموقع الرسمي |
| `Admin.submit.sourceUrlLabel` | Source URL | Url source | رابط المصدر |
| `Admin.submit.submitting` | Sending… | Envoi… | جارٍ الإرسال… |
| `Admin.submit.submitButton` | Submit for review | Soumettre pour revue | إرسال للمراجعة |
| `Admin.submit.mySubmissionsTitle` | My submissions | Mes soumissions | طلباتي |
| `Admin.submit.mySubmissionsEmpty` | No submissions yet. | Aucune soumission pour l'instant. | لا توجد طلبات بعد. |
| `Admin.teamsPage.title` | Teams & quotas | Équipes & quotas | الفرق والحصص |
| `Admin.teamsPage.subtitle` | 15 teams, one per domain. The quota indicates the target number of startups each team should reference; only the administrator can adjust the value. | 15 équipes, une par domaine. Le quota indique le nombre cible de startups à référencer par équipe ; l'administrateur seul peut ajuster la valeur. | 15 فريقًا، فريق لكل مجال. تشير الحصة إلى العدد المستهدف من الشركات الناشئة ليقوم كل فريق بترقيمها؛ المشرف وحده يمكنه تعديل القيمة. |
| `Admin.teams.colCode` | Code | Code | الرمز |
| `Admin.teams.colTeamDomain` | Team / Domain | Équipe / Domaine | الفريق / المجال |
| `Admin.teams.colMembers` | Members | Membres | الأعضاء |
| `Admin.teams.colSubmissions` | Submissions | Soumissions | الطلبات |
| `Admin.teams.colQuota` | Quota | Quota | الحصة |
| `Admin.teams.colProgress` | Progress | Progression | التقدم |
| `Admin.teams.saveOk` | OK | OK | موافق |
| `Admin.users.errors.load` | Could not load the accounts. | Impossible de charger les comptes. | تعذّر تحميل الحسابات. |
| `Admin.users.errors.invalidData` | Invalid data (email or password must be at least 8 characters). | Données invalides (email ou mot de passe ≥ 8 caractères). | بيانات غير صالحة (البريد الإلكتروني أو كلمة المرور ≥ 8 أحرف). |
| `Admin.users.errors.alreadyUsed` | Creation failed (email may already be in use). | Création impossible (email peut-être déjà utilisé). | تعذّر الإنشاء (البريد الإلكتروني قد يكون مستخدمًا من قبل). |
| `Admin.users.errors.roleChange` | Role change failed. | Changement de rôle impossible. | تعذّر تغيير الدور. |
| `Admin.users.successCreated` | Guest account created: {email} | Compte invité créé : {email} | تم إنشاء الحساب المدعو: {email} |
| `Admin.users.title` | Guest accounts | Comptes invités | الحسابات المدعوة |
| `Admin.users.subtitle` | No public sign-up: only these accounts can sign in. Every role change is logged. | Aucune inscription publique : seuls ces comptes peuvent se connecter. Tout changement de rôle est journalisé. | لا يوجد تسجيل عمومي: لا يمكن تسجيل الدخول إلا بهذه الحسابات. كل تغيير في الدور يُسجَّل. |
| `Admin.users.inviteTitle` | Invite a new account | Inviter un nouveau compte | دعوة حساب جديد |
| `Admin.users.nameLabel` | Full name | Nom complet | الاسم الكامل |
| `Admin.users.emailLabel` | Institutional email | Email institutionnel | البريد المؤسسي |
| `Admin.users.emailPlaceholder` | name@mpme.gov.dz | nom@mpme.gov.dz | name@mpme.gov.dz |
| `Admin.users.roleLabel` | Role | Rôle | الدور |
| `Admin.users.domainLabel` | Team domain | Domaine de l'équipe | مجال الفريق |
| `Admin.users.passwordLabel` | Temporary password | Mot de passe provisoire | كلمة مرور مؤقتة |
| `Admin.users.passwordPlaceholder` | ≥ 8 characters | ≥ 8 caractères | ≥ 8 أحرف |
| `Admin.users.createButton` | Create guest account | Créer le compte invité | إنشاء الحساب المدعو |
| `Admin.users.colName` | Name | Nom | الاسم |
| `Admin.users.colEmail` | Email | Email | البريد |
| `Admin.users.colRole` | Role | Rôle | الدور |
| `Admin.users.colDomain` | Domain | Domaine | المجال |

## PROVIDER PLACEMENT FIX

### Context
After the rebuild, the whole `/admin` segment was observed to return **404**
during a manual pass on the running `next dev --webpack` server (also
reproduced under dev Turbopack and `next start`). Next's build route table
still listed every `/admin/*` route, `/api/admin/*` kept working, and the
public app was unaffected.

Bisection showed the trigger was `NextIntlClientProvider` rendered inside the
admin **root layout** (`src/app/admin/layout.tsx`), which owns a static
`<html>`/`<body>` (renders its own document for the /admin segment). Even with
a hard-coded `locale="fr"` and a static `fr` import it was sufficient to break
the segment. The public app only works because its provider lives on the
middleware-rewritten dynamic `[locale]` segment.

### Design constraint (applied)
The admin root layout must stay **server-only and provider-free**. Every admin
**client component** that calls `useTranslations('Admin')` now self-wraps with
its own `NextIntlClientProvider`:

```tsx
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { AdminMessages } from '<rel>/i18n';

export function X({ locale, messages, ...rest }: { locale: Locale; messages: AdminMessages; ... }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <XInner {...rest} />
    </NextIntlClientProvider>
  );
}
function XInner({ ...rest }: { ... }) { /* existing component body */ }
```

`AdminMessages = typeof en` was exported from `src/app/admin/i18n.ts` (type-only
imports — erased at compile time, so no server module leaks into the client
bundle). Server pages/layouts fetch both values through the existing helpers:

```ts
const [locale, messages] = await Promise.all([getAdminLocale(), getAdminMessages()]);
```

Components wrapped (10):
`LoginForm`, `AdminNav`, `DashboardCards`, `DomainManager`, `ReviewQueue`,
`ImportSheet`, `SubmitForm`, `MySubmissions`, `TeamsManager`, `UsersManager`.

No `timeZone`/`now` props are passed: next-intl 4 falls back to the runtime
defaults (only a dev-only server-side `ENVIRONMENT_FALLBACK` warning can
appear; `format.dateTime` behavior stays identical).

The scratch `src/app/admin/ping/page.tsx` used for bisecting was deleted.

### Gates (after the fix)
| Gate | Result |
| --- | --- |
| `npm test` (full suite) | **16 files / 73 tests passed, 0 failed** (no INVALID_KEY / MISSING_MESSAGE) |
| `npx tsc --noEmit` | **0 errors** |
| `npx eslint src --max-warnings 0` | **0 problems** |

(`.next/types/validator.ts` still referenced the deleted ping route from a
previous typegen cycle — the stale block was cleared and regenerated cleanly.)

### Runtime proof (next dev --webpack, port 4002)
`curl` (no cookies = French default):

```
GET /admin/login        -> 200  ("Espace sécurisé", "Email institutionnel",
                                 "Mot de passe", "Se connecter",
                                 "Aucun compte public n'est créé
                                 automatiquement. L'administrateur invite…")
GET /admin/login        -> 200  (Cookie: NEXT_LOCALE=en -> "Secure space",
                                 "Sign in"; no French text)
GET /admin/login        -> 200  (Cookie: NEXT_LOCALE=ar -> "تسجيل الدخول" +
                                 Arabic labels; no French/English text)
GET /admin              -> 307  -> /admin/login
GET /admin/dashboard    -> 307  -> /admin/login
GET /admin/review       -> 307  -> /admin/login
GET /admin/users        -> 307  -> /admin/login
```

All protected routes **redirect instead of 404**. Public app re-checked:
`/fr`, `/en`, `/fr/login` all **200** (no regression).

### Concerns
- Each admin page's RSC flight payload now embeds the full 342-key messages
  object (per-provider `messages` prop, as mandated). Server-side
  `getTranslations` titles are unaffected. If payload size ever matters, only
  the `Admin` subtree could be passed instead — not done here to keep the
  mandated `getAdminMessages()` contract and the test typing simple.
- The stale `.next` typegen output after deleting `ping/page.tsx` required
  clearing `.next/dev/types/app/admin/ping` and the `validator.ts` ping block
  once; `next dev` regenerates both thereafter.

### Status
**DONE**
