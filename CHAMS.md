# CHAMS — Startup Ideas DZ (دليل / Guide)

**Build (بناء):** T. Chams — Tebessa Incubator (حاضنة تبسة)

A trilingual directory of deep-tech initiatives. This file tells you how to host it, test it, and what it can do — in English and Arabic.

مجلّد تعريفي ثنائي اللغة يشرح كيفية استضافة المنصة واختبارها وأبرز مزاياها.

---

## 1. English — Hosting / How to run it

### 1.1 Requirements (المتطلبات)

| Tool | Version |
|------|---------|
| Node.js | **>= 20.9** (tested on v24) |
| PostgreSQL | **>= 13** (tested on v15) |
| npm | bundled with Node |

### 1.2 One-time setup (التثبيت)

```bash
# 1. Install dependencies
npm install

# 2. Create the database, then restore the full dump
#    (schema + seed data + translations + demo accounts). Run as postgres superuser:
psql -U postgres -c "CREATE DATABASE startup_ideas_dz;"
psql -U postgres -d startup_ideas_dz -f db/startup_ideas_dz.sql
```

### 1.3 Environment variables (ملف المتغيرات)

Create `.env.local` at the project root (copy from `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/startup_ideas_dz?schema=public"
AUTH_SECRET="generate_a_random_base64_string_with_openssl_rand_-base64_32"
AUTH_TRUST_HOST=true

# Plain HTTP on localhost only:
AUTH_USE_SECURE_COOKIES=false
```

### 1.4 Run (التشغيل)

```bash
# Development server (hot reload)
npm run dev

# Production build + start
npm run build
npm run start
```

Open: `http://localhost:3000` (or `http://localhost:8080` if you run `npm run dev -- -p 8080`).

### 1.5 Demo accounts (حسابات التجربة)

The restored database ships with ready accounts. Try these:

| Role | URL | Email | Password |
|------|-----|-------|----------|
| Admin | `/admin/login` | `admin@deeptech.dz` | `Admin123!` |
| Admin | `/admin/login` | `admin@mpme.gov.dz` | `Admin#2026` |
| Reviewer | `/admin/login` | `verifier@deeptech.dz` | `Admin123!` |
| Team (AI) | `/admin/login` | `team01@deeptech.dz` | `Admin123!` |

Public visitors can also **register** a member account at `/register`.

> Tip (نصيحة): use the **admin** account to see the whole dashboard, review queue, teams, users, and import tools.

---

## 2. English — Testing / How to verify it works

### 2.1 Automated checks (الاختبارات الآلية)

```bash
npm test                  # Vitest — unit & component suite (currently 76 tests)
npx tsc --noEmit          # TypeScript type check (0 errors)
npx eslint src            # Lint (0 warnings)
npm run build             # Production build must succeed
```

All four must pass. Exact current results: **76/76 tests green**, `tsc` clean, `eslint --max-warnings 0` clean, `next build` succeeds.

### 2.2 Manual walkthrough (فحص يدوي)

1. Open `/` (Arabic, default locale) → hero stats, animated background, domain marquee, 15 domain cards.
2. Switch languages via the top-right switcher — `/en` and `/fr` fully translated (UI + startup content).
3. `/browse` → search by keyword, filter by domain, country, year, priority.
4. Domain page `/domain/ai-computing` → DomainExplorer with live filters.
5. Startup details `/startup/kabas-ai` → meta table, why-relevant, official site, Save button.
6. `/register` a member account → `/saved` shows your bookmarks; Save from any card.
7. `/analytics` → stats dashboard (per-domain breakdowns).
8. `/admin/login` with the admin account → dashboard, review queue, submit form, users, teams, domains, import.
9. `/policy` → Terms & Privacy.
10. Theme toggle (light / dark / night) + responsive mobile menu.

---

## 3. English — Features (المزايا)

**Public site (public)**
- Trilingual: Arabic (default, RTL), French, English — full UI + per-locale startup content.
- Animated design: drifting ambient background orbs, scrolling domain marquee, shimmer gradient heading, glass card system, scroll reveals, live stats strip.
- Browse, full-text search, and filters (domain / country / year / priority A-B-C).
- Domain explorer with 15 deep-tech domains (AI, robotics, biotech, space, energy, medtech, cybersecurity…).
- Startup profile page: meta data, relevance note, official site + source links.
- Member accounts: register, log in, save/bookmark startups, saved page.
- Analytics dashboard for public insights.
- Terms & Privacy page.
- Theme toggle (light / dark / night) + reduced-motion support; responsive mobile nav.
- Security headers (HSTS, CSP-style, frame deny), rate-limited login, session auth.

**Admin console (admin)**
- Dashboard with live KPIs.
- Review queue: verify / reject submissions with priorities.
- Submit an idea (team flow), import tool (bulk).
- Users & teams management (roles: team / reviewer / admin; team domains).
- Domain management with validation status.

**Data layer**
- PostgreSQL: `members`, `startups`, `startup_translations` (fr/ar), `teams`, `domain_meta`, `users`, `audit_log`, `saved_startups`.
- Backups script: `scripts/backup-db.ps1`.

---

## 1. العربية — طريقة الاستضافة (Hosting)

### المتطلبات
- Node.js **20.9 أو أحدث** (اختُبر على v24)، PostgreSQL **13+** (15)، و npm.

### التثبيت
```bash
npm install
psql -U postgres -c "CREATE DATABASE startup_ideas_dz;"
psql -U postgres -d startup_ideas_dz -f db/startup_ideas_dz.sql
```

### ملف المتغيرات `.env.local`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/startup_ideas_dz?schema=public"
AUTH_SECRET="مفتاح_عشوائي_طويل_يُنشأ_بـ_openssl_rand_-base64_32"
AUTH_TRUST_HOST=true
AUTH_USE_SECURE_COOKIES=false
```

### التشغيل
```bash
npm run dev        # التطوير — ثم افتح http://localhost:3000
npm run build      # الإنتاج
npm run start
```

### حسابات جاهزة للتجربة
| الدور | الرابط | البريد | كلمة المرور |
|-------|--------|--------|--------------|
| مشرف Admin | `/admin/login` | `admin@deeptech.dz` | `Admin123!` |
| مشرف Admin | `/admin/login` | `admin@mpme.gov.dz` | `Admin#2026` |
| مراجع Reviewer | `/admin/login` | `verifier@deeptech.dz` | `Admin123!` |
| فريق (AI) | `/admin/login` | `team01@deeptech.dz` | `Admin123!` |

يمكن للزائر أيضًا **إنشاء حساب عضو** من `/register`.

---

## 2. العربية — طرق الاختبار

### فحوصات آلية
```bash
npm test                  # 76 اختبارًا ناجحًا
npx tsc --noEmit          # فحص الأنواع — بدون أخطاء
npx eslint src            # فحص الكود — بدون تحذيرات
npm run build             # نجاح بناء الإنتاج
```

### تجربة يدوية
1. افتح `/` (العربية افتراضيًا): إحصاءات، خلفية متحركة، شريط مجالات، 15 بطاقة مجال.
2. بدّل اللغة من الأعلى يمينًا: `/fr` و `/en` مترجمتان بالكامل.
3. `/browse`: بحث نصي + تصفية (المجال/الدولة/السنة/الأولوية).
4. صفحة مجال: `/domain/ai-computing` مع فلاتر مباشرة.
5. صفحة شركة ناشئة: `/startup/kabas-ai`.
6. سجّل حسابًا جديدًا في `/register` ثم احفظ شركات في `/saved`.
7. `/analytics`: لوحة تحليلات.
8. `/admin/login` بحساب المشرف: لوحة التحكم، مراجعة المقترحات، الفرق، المستخدمون، استيراد.
9. `/policy`: الشروط والخصوصية.
10. تبديل المظهر (فاتح/داكن/ليلي) والقائمة للجوال.

---

## 3. العربية — أبرز المزايا

**الموقع العام**
- ثلاثي اللغة (العربية RTL افتراضيًا + الفرنسية + الإنجليزية) مع ترجمة كاملة للمحتوى.
- تصميم متحرك: خلفية بأشكال متوهجة متحركة، شريط مجالات متحرك، عنوان متدرج لامع، بطاقات زجاجية، تأثيرات ظهور عند التمرير.
- بحث نصي وتصفية شاملة حسب المجال/الدولة/السنة/الأولوية.
- مستكشف لـ 15 مجالاً للتكنولوجيا العميقة.
- صفحة تفاصيل لكل شركة ناشئة مع مصدرها وموقعها.
- حسابات أعضاء مع إمكانية حفظ الشركات والمفضلة.
- لوحة تحليلات عامة.
- صفحة شروط وخصوصية.
- تبديل مظهر (فاتح/داكن/ليلي)، دعم تقليل الحركة، قائمة جوال، رؤوس أمان، تقييد محاولات الدخول.

**لوحة المشرف**
- لوحة مؤشرات حية، قائمة مراجعة المقترحات، إرسال فكرة، أداة استيراد جماعي، إدارة المستخدمين والفرق والمجالات.

**طبقة البيانات**
- PostgreSQL: فرق، مجالات، شركات ناشئة، ترجمات، مستخدمون، سجل تدقيق، حسابات.
- سكربت نسخ احتياطي: `scripts/backup-db.ps1`.

---

*Guide / دليل — T. Chams, Tebessa Incubator.*