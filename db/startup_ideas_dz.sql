--
-- PostgreSQL database dump
--

\restrict x5578cdcdveDTVEZop7dxMBR5hfQ52lul02cnlDOe2xGCbdLJJbahcG1tk7fWDE

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.startups DROP CONSTRAINT IF EXISTS startups_submitted_by_team_fkey;
ALTER TABLE IF EXISTS ONLY public.startup_translations DROP CONSTRAINT IF EXISTS startup_translations_startup_id_fkey;
ALTER TABLE IF EXISTS ONLY public.saved_startups DROP CONSTRAINT IF EXISTS saved_startups_startup_id_fkey;
ALTER TABLE IF EXISTS ONLY public.saved_startups DROP CONSTRAINT IF EXISTS saved_startups_member_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
DROP INDEX IF EXISTS public.startup_translations_locale_idx;
DROP INDEX IF EXISTS public.saved_startups_member_idx;
DROP INDEX IF EXISTS public.idx_teams_domain;
DROP INDEX IF EXISTS public.idx_startups_team_code;
DROP INDEX IF EXISTS public.idx_startups_submitted_by;
DROP INDEX IF EXISTS public.idx_startups_status;
DROP INDEX IF EXISTS public.idx_startups_domain;
DROP INDEX IF EXISTS public.idx_audit_log_user;
DROP INDEX IF EXISTS public.idx_audit_log_entity;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.startups DROP CONSTRAINT IF EXISTS startups_pkey;
ALTER TABLE IF EXISTS ONLY public.startup_translations DROP CONSTRAINT IF EXISTS startup_translations_pkey;
ALTER TABLE IF EXISTS ONLY public.saved_startups DROP CONSTRAINT IF EXISTS saved_startups_pkey;
ALTER TABLE IF EXISTS ONLY public.members DROP CONSTRAINT IF EXISTS members_pkey;
ALTER TABLE IF EXISTS ONLY public.members DROP CONSTRAINT IF EXISTS members_email_key;
ALTER TABLE IF EXISTS ONLY public.domain_meta DROP CONSTRAINT IF EXISTS domain_meta_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS public.audit_log ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.startups;
DROP TABLE IF EXISTS public.startup_translations;
DROP TABLE IF EXISTS public.saved_startups;
DROP TABLE IF EXISTS public.members;
DROP TABLE IF EXISTS public.domain_meta;
DROP SEQUENCE IF EXISTS public.audit_log_id_seq;
DROP TABLE IF EXISTS public.audit_log;
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    before_data jsonb,
    after_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: domain_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_meta (
    slug text NOT NULL,
    label_en text NOT NULL,
    label_ar text NOT NULL,
    validation_status text DEFAULT 'TO_CHECK'::text NOT NULL,
    priority_tier text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_startups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_startups (
    member_id uuid NOT NULL,
    startup_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: startup_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.startup_translations (
    startup_id text NOT NULL,
    locale text NOT NULL,
    name text NOT NULL,
    country text,
    sub_domain text,
    short_description text NOT NULL,
    technology text NOT NULL,
    why_relevant text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT startup_translations_locale_check CHECK ((locale = ANY (ARRAY['fr'::text, 'ar'::text])))
);


--
-- Name: startups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.startups (
    id text NOT NULL,
    name text NOT NULL,
    country text NOT NULL,
    domain text NOT NULL,
    sub_domain text,
    short_description text NOT NULL,
    technology text NOT NULL,
    year_founded integer,
    official_site text,
    source_url text,
    why_relevant text NOT NULL,
    priority text NOT NULL,
    status text NOT NULL,
    is_duplicate_2025 boolean DEFAULT false NOT NULL,
    submitted_by_team uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_by_team_code text,
    CONSTRAINT startups_priority_check CHECK ((priority = ANY (ARRAY['A'::text, 'B'::text, 'C'::text]))),
    CONSTRAINT startups_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    code text NOT NULL,
    name text NOT NULL,
    domain_slug text NOT NULL,
    quota integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    team_domain text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['team'::text, 'reviewer'::text, 'admin'::text])))
);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, user_id, action, entity_type, entity_id, before_data, after_data, created_at) FROM stdin;
1	6d2d44e6-5ce9-479d-9794-a2358faa160b	seed	startup	kabas-ai	\N	{"name": "KABAS AI", "status": "verified"}	2026-09-13 23:32:37.581929+01
2	34920b99-1474-4983-aafc-17b9aec198bd	seed	startup	yassirt-robotics	\N	{"name": "Yassirt Robotics", "status": "verified"}	2026-09-13 23:32:37.581929+01
3	a3fbcfaa-8bf4-4b53-a924-86d3f1eb5d1c	seed	startup	dz-biomark	\N	{"name": "DZ BioMark", "status": "verified"}	2026-09-13 23:32:37.581929+01
4	\N	seed	startup	sahara-drones	\N	{"name": "Sahara Sky Drones", "status": "verified"}	2026-09-13 23:32:37.581929+01
5	a9771be3-6b95-4854-a93f-72c89764a1e2	seed	startup	maghreb-storage	\N	{"name": "Maghreb Storage Solutions", "status": "verified"}	2026-09-13 23:32:37.581929+01
6	f043bd9e-9d3f-4f63-a0c5-211dfa89c21d	seed	startup	atlas-space	\N	{"name": "Atlas Spaceworks", "status": "verified"}	2026-09-13 23:32:37.581929+01
7	\N	seed	startup	aures-medic	\N	{"name": "Aurès MedTech", "status": "verified"}	2026-09-13 23:32:37.581929+01
8	2ab0c601-f3d6-456e-97f9-271ecaebd445	seed	startup	cybershield-dz	\N	{"name": "CyberShield DZ", "status": "verified"}	2026-09-13 23:32:37.581929+01
9	\N	seed	startup	aurion-semi	\N	{"name": "Aurion Semiconductors", "status": "pending"}	2026-09-13 23:32:37.581929+01
10	\N	seed	startup	graphene-dz	\N	{"name": "GrapheneDZ", "status": "rejected"}	2026-09-13 23:32:37.581929+01
\.


--
-- Data for Name: domain_meta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.domain_meta (slug, label_en, label_ar, validation_status, priority_tier, created_at, updated_at) FROM stdin;
ai-computing	AI & Advanced Computing	الذكاء الاصطناعي والحوسبة المتقدمة	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
robotics	Robotics	الروبوتات	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
biotech-healthtech	Biotech & HealthTech	التقنية الحيوية وتقنية الصحة	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
drones-autonomy	Autonomous Systems & Drones	الأنظمة الذاتية والطائرات المسيّرة	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
nanotech-materials	Nanotech & Advanced Materials	تقنية النانو والمواد المتقدمة	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
energy-storage	Energy & Storage	الطاقة وتخزينها	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
space-aerospace	SpaceTech & Aerospace	تقنية الفضاء والطيران	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
agritech-foodtech	AgriTech & FoodTech	التقنية الزراعية والغذائية	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
medtech	MedTech	التقنية الطبية	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
semiconductors	Semiconductors & Electronics	أشباه الموصلات والإلكترونيات	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
cybersecurity	Cybersecurity	الأمن السيبراني	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
manufacturing-3d	Advanced Manufacturing & 3D Printing	التصنيع المتقدم والطباعة ثلاثية الأبعاد	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
cleantech	Environment, Water & CleanTech	البيئة والماء والتقنية النظيفة	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
cloud-iot	Cloud Computing & Industrial IoT	الحوسبة السحابية وإنترنت الأشياء الصناعي	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
other-deep-tech	Other Deep Tech	تقنيات عميقة أخرى	VALIDATED	A	2026-09-14 21:38:05.010055+01	2026-09-14 21:38:05.010055+01
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.members (id, name, email, password_hash, created_at) FROM stdin;
\.


--
-- Data for Name: saved_startups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.saved_startups (member_id, startup_id, created_at) FROM stdin;
\.


--
-- Data for Name: startup_translations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.startup_translations (startup_id, locale, name, country, sub_domain, short_description, technology, why_relevant, created_at, updated_at) FROM stdin;
aircrop	fr	AirCrop	Algérie	Agriculture de précision par drones et IA	Plateforme « Drone-as-a-Service » qui utilise l'IA pour surveiller en temps réel la santé des cultures : détection de maladies, de ravageurs et de problèmes d'irrigation, plus pulvérisation ciblée. Reconnue dans le cadre du Challenge Startup Algérie 2024.	Drones agricoles, imagerie multispectrale, analyses IA	Lauréate du Challenge Agritech 2024, elle réduit les pertes de récolte et les intrants pour les agriculteurs algériens.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
aircrop	ar	AirCrop	الجزائر	زراعة دقيقة بالطائرات بدون طيار والذكاء الاصطناعي	منصة «الزراعة كخدمة عبر الطائرات» تستخدم الذكاء الاصطناعي لمراقبة صحة المحاصيل في الوقت الفعلي: كشف الأمراض والآفات ومشاكل الري، مع رش موجّه. حصلت على تقدير في تحدي الشركات الناشئة الجزائرية 2024.	طائرات زراعية بدون طيار، تصوير متعدد الأطياف، تحليلات بالذكاء الاصطناعي	حائزة على جائزة تحدي Agritech 2024، تحدّ من خسائر المحاصيل وترشّد المدخلات للمزارعين الجزائريين.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
atlas-space	fr	Atlas Spaceworks	Algérie	CubeSats et stations au sol	Plateformes CubeSat et réseaux de stations au sol à faible coût pour l'observation de la Terre africaine.	Bus CubeSat, stations au sol en bande S, logiciels de télémétrie	Construit une capacité spatiale souveraine pour surveiller l'agriculture et l'eau en Afrique du Nord.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
atlas-space	ar	Atlas Spaceworks	الجزائر	الأقمار المكعبة والمحطات الأرضية	منصات أقمار نانوية (CubeSat) وشبكات محطات أرضية منخفضة التكلفة لمراقبة الأرض في إفريقيا.	حافلات CubeSat، محطات أرضية بالنطاق S، برمجيات قياس عن بُعد	تبني قدرة فضائية سيادية لمراقبة الزراعة والمياه في شمال إفريقيا.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
aures-medic	fr	Aurès MedTech	Algérie	Dispositifs médicaux	Moniteurs de constantes vitales assistés par IA, abordables et adaptés aux cliniques rurales.	ML embarqué, matériel basse consommation, API de télésanté	Réduit la dépendance aux dispositifs médicaux importés et améliore l'accès aux soins en milieu rural.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
aures-medic	ar	Aurès MedTech	الجزائر	الأجهزة الطبية	أجهزة مراقبة للعلامات الحيوية مدعومة بالذكاء الاصطناعي، بأسعار في المتناول ومناسبة للعيادات الريفية.	تعلم آلي مدمج، أجهزة منخفضة الاستهلاك، واجهات برمجية للتطبيب عن بُعد	تقلّل الاعتماد على الأجهزة الطبية المستوردة وتحسّن الوصول إلى الرعاية الصحية في المناطق الريفية.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
badis-ai	fr	BADIS AI	Algérie	Logiciels IA souverains	Éditeur de logiciels IA souverains sur site (OCR, RAG, agents IA, chatbots, assistant de données) basé au Cyberparc de Sidi Abdellah, Alger. Classé dans le Top 10 des startups IA et EdTech en Algérie.	OCR, RAG, agents LLM, suite IA sur site	Fait partie de la première vague de startups algériennes d'IA souveraine incubées au Cyberparc de Sidi Abdellah ; il représente l'écosystème national des logiciels IA.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
badis-ai	ar	BADIS AI	الجزائر	برمجيات الذكاء الاصطناعي السيادية	ناشر برمجيات ذكاء اصطناعي سيادية تُنشر محليًا (OCR، RAG، وكلاء ذكاء اصطناعي، روبوتات محادثة، مساعد بيانات) مقره بمجمع سيدي عبد الله التقني بالجزائر العاصمة. مصنّف ضمن أفضل 10 شركات ناشئة في الذكاء الاصطناعي والتعليم التقني بالجزائر.	OCR، RAG، وكلاء تعلم آلي، مجموعة أدوات ذكاء اصطناعي محلية	ضمن الموجة الأولى من شركات الذكاء الاصطناعي السيادية الجزائرية المحتضنة بمجمع سيدي عبد الله؛ ويمثل منظومة البرمجيات الوطنية للذكاء الاصطناعي.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
bk-fire-icosium	fr	BK Fire (Icosium)	Algérie	Robots de lutte contre l'incendie	PME deeptech industrielle repositionnée sous le nom BK Fire. Icosium est un robot anti-incendie algérien de 480 kg résistant à 2000 °C, projection d'eau à 80 m, portée de commande de 300 m ; la mise à niveau IA de 2026 ajoute la détection autonome.	Robotique, lutte anti-incendie téléopérée, détection et intervention par IA	Seul robot de ce type fabriqué en Afrique/monde arabe, exposé à InterSchutz Hanovre - modèle d'export de hardware deeptech algérien.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
bk-fire-icosium	ar	BK Fire (Icosium)	الجزائر	روبوتات إطفاء الحرائق	شركة صناعية ناشئة أعيدت هيكلتها باسم BK Fire. إيكوسيوم روبوت إطفاء جزائري الصنع يزن 480 كغ يتحمّل حرارة 2000 درجة مئوية، بقذف مائي يصل إلى 80 م ونطاق تحكم 300 م؛ ترقية الذكاء الاصطناعي 2026 تضيف الكشف الذاتي.	روبوتات، إطفاء يعمل بالتحكم عن بُعد، كشف وتدخل بالذكاء الاصطناعي	الروبوت الوحيد من نوعه المصنّع في إفريقيا/العالم العربي، عُرض في معرض Interschutz هانوفر - نموذج لتصدير الأجهزة التكنولوجية العميقة الجزائرية.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
cybershield-dz	fr	CyberShield DZ	Algérie	Opérations de sécurité	Plateforme de détection et de réponse gérées, adaptée aux PME algériennes et au secteur public.	SIEM, EDR, corrélation de menaces par IA	Comble un manque critique de résilience cybernétique nationale pour les infrastructures sensibles.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
cybershield-dz	ar	CyberShield DZ	الجزائر	عمليات الأمن السيبراني	منصة كشف واستجابة مُدارة، مصممة للمؤسسات الصغيرة والمتوسطة الجزائرية والقطاع العام.	SIEM، EDR، ربط التهديدات بالذكاء الاصطناعي	تسد فجوة حرجة في المرونة السيبرانية الوطنية للبنى التحتية الحساسة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
dz-biomark	fr	DZ BioMark	Algérie	Diagnostic	Kits de diagnostic moléculaire à faible coût pour les maladies infectieuses, adaptés à la logistique désertique.	Détection par CRISPR, réactifs lyophilisés	Apporte un diagnostic rapide aux régions isolées, réduisant le délai de transport des échantillons de plusieurs jours.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
dz-biomark	ar	DZ BioMark	الجزائر	التشخيص الطبي	مجموعات تشخيص جزيئي منخفضة التكلفة للأمراض المعدية، ملائمة للوجستيات الصحراوية.	كشف بتقنية CRISPR، كواشف مجففة	توفّر تشخيصًا سريعًا للمناطق النائية، وتختصر أيامًا من وقت نقل العينات.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
farmai	fr	FarmAI	Algérie	Détection IA des maladies des cultures	Startup agritech qui détecte les infections des plantes à un stade précoce grâce à l'IA et aux drones. Vainqueur du prix People's Choice de Huawei Tech4Good (100 000 $) pour la détection de la rouille du blé par imagerie multispectrale.	Vision par ordinateur, imagerie drone multispectrale, classification ML	Reconnaissance mondiale (prix Huawei de 100 000 $) pour l'IA appliquée à la sécurité alimentaire - priorité nationale stratégique pour l'autosuffisance en blé.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
farmai	ar	FarmAI	الجزائر	كشف أمراض المحاصيل بالذكاء الاصطناعي	شركة ناشئة في التكنولوجيا الزراعية تكشف إصابات النباتات مبكرًا عبر الذكاء الاصطناعي والطائرات بدون طيار. فازت بجائزة اختيار الجمهور من Huawei Tech4Good (100 ألف دولار) لكشف صدأ القمح بالتصوير متعدد الأطياف.	رؤية حاسوبية، تصوير متعدد الأطياف بالطائرات، تصنيف بالتعلم الآلي	اعتراف عالمي (جائزة Huawei بـ100 ألف دولار) لتطبيق الذكاء الاصطناعي على الأمن الغذائي — أولوية وطنية استراتيجية لتحقيق الاكتفاء الذاتي من القمح.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
flyteq	fr	FLYTEQ	Algérie	Services d'ingénierie drone	Entreprise algérienne de l'écosystème drone proposant des services : agriculture de précision (AGRO TEQ), cartographie géospatiale (GEO TEQ), inspection d'infrastructures (SCAN TEQ) et nettoyage en hauteur (CLEAN TEQ).	Photogrammétrie drone, NDVI multispectral, inspection thermique, intelligence des données IA	Capacité algérienne souveraine en ingénierie drone - services de données aériennes pour l'agriculture, la sécurité et l'inspection industrielle.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
flyteq	ar	FLYTEQ	الجزائر	خدمات هندسة الطائرات بدون طيار	شركة جزائرية في منظومة الطائرات بدون طيار تقدم خدمات: الزراعة الدقيقة (AGRO TEQ)، الخرائط الجغرافية (GEO TEQ)، فحص البنى التحتية (SCAN TEQ) والتنظيف على الارتفاعات (CLEAN TEQ).	المسح الفوتوغرامتري بالطائرات، NDVI متعدد الأطياف، فحص حراري، استخبارات بيانات بالذكاء الاصطناعي	قدرة جزائرية سيادية في هندسة الطائرات — خدمات البيانات الجوية للزراعة والأمن والفحص الصناعي.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
formlabs	fr	Formlabs	États-Unis	Impression 3D de bureau et industrielle	Producteur d'imprimantes 3D SLA et SLS accessibles, utilisées par les ingénieurs, industriels et designers du monde entier depuis 2011.	Stéréolithographie, frittage sélectif par laser, impression 3D	Référence de la démocratisation des équipements avancés de fabrication.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
formlabs	ar	Formlabs	الولايات المتحدة	الطباعة ثلاثية الأبعاد المكتبية والصناعية	مصنّع طابعات ثلاثية الأبعاد SLA وSLS ميسورة التكلفة، يستخدمها المهندسون والمصنّعون والمصممون حول العالم منذ 2011.	الطباعة الضوئية، التلبيد الانتقائي بالليزر، الطباعة ثلاثية الأبعاد	مرجع في جعل معدات التصنيع المتقدمة في متناول الجميع.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
kabas-ai	fr	KABAS AI	Algérie	IA générative	Grand modèle de langue arabe souverain, entraîné sur site pour les gouvernements et les entreprises.	Ajustement fin de LLM, RAG, inférence sur site	Répond aux enjeux de souveraineté numérique et aux lacunes du traitement du langage arabe avec un modèle fondation construit en Algérie.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
kabas-ai	ar	KABAS AI	الجزائر	الذكاء الاصطناعي التوليدي	نموذج لغوي عربي كبير سيادي، يُدرَّب محليًا للاستخدام الحكومي والمؤسساتي.	ضبط دقيق للنماذج اللغوية، RAG، استدلال محلي	يعالج قضايا السيادة الرقمية وثغرات معالجة اللغة العربية بنموذج مؤسس مبني في الجزائر.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
kleenov	fr	Kleenov	Algérie	Robots aquatiques autonomes	Développe AquaBotX, un robot aquatique autonome pour nettoyer les déchets flottants et surveiller la qualité de l'eau dans les barrages, ports, rivières et lacs. Technologie développée en Algérie.	Robotique aquatique autonome, capteurs, IA	Allie robotique et IA pour la préservation de l'environnement - un segment qui répond directement aux défis de l'infrastructure hydraulique algérienne.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
kleenov	ar	Kleenov	الجزائر	روبوتات مائية ذاتية القيادة	تطوّر AquaBotX، روبوت مائي مستقل لتنظيف النفايات العائمة ومراقبة جودة المياه في السدود والموانئ والأنهار والبحيرات. تقنية طوّرت في الجزائر.	روبوتات مائية ذاتية القيادة، حساسات، ذكاء اصطناعي	يجمع الروبوتات والذكاء الاصطناعي للحفاظ على البيئة — قطاع يعالج مباشرة تحديات البنية التحتية للمياه الجزائرية.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
lablabee	fr	LabLabee	Algérie	Laboratoires virtuels / EdTech	Première edtech algérienne avec des ambitions américaines. Fournit des laboratoires virtuels à la demande pour la 5G, le Cloud, l'IMS et Kubernetes. A levé 3,4 M$ en 2024, mené par Reach Capital.	Simulateurs et laboratoires virtuels 5G, Cloud, Kubernetes	Prouve qu'une startup algérienne peut lever des capitaux internationaux (Reach Capital, Brighteye) pour de la deeptech B2B à l'échelle mondiale.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
lablabee	ar	LabLabee	الجزائر	مختبرات افتراضية / تكنولوجيا التعليم	أول شركة تعليم تقني جزائرية بطموحات أمريكية. توفّر مختبرات افتراضية عند الطلب لتقنيات 5G، السحابة، IMS وKubernetes. جمعت 3.4 مليون دولار في 2024 بقيادة Reach Capital.	محاكيات ومختبرات افتراضية لـ5G، السحابة، Kubernetes	دليل على قدرة شركة جزائرية ناشئة على جذب رأس مال دولي (Reach Capital, Brighteye) في مجال التكنولوجيا العميقة B2B عالميًا.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
maghreb-storage	fr	Maghreb Storage Solutions	Algérie	Stockage par batteries	Systèmes de stockage d'énergie par batteries à l'échelle industrielle pour compenser l'intermittence du solaire.	BESS LFP, onduleurs intelligents, logiciels EMS	Débloque le potentiel solaire algérien en résolvant le goulot d'étranglement du stockage sur le réseau.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
maghreb-storage	ar	Maghreb Storage Solutions	الجزائر	تخزين الطاقة بالبطاريات	أنظمة تخزين طاقة بالبطاريات على نطاق المرافق لموازنة التذبذب في الطاقة الشمسية.	بطاريات LFP، محولات ذكية، برمجيات EMS	تطلق العنان للإمكانات الشمسية الجزائرية من خلال حل قيد تخزين الشبكة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
mimic-al	fr	MIMIC-AL	Algérie	Lab-on-chip et bioingénierie	Première startup Biotech 4.0 en Algérie, spécialisée en bioingénierie et omique : plateformes lab-on-chip, génie génétique, ingénierie cellulaire et tissulaire. Partenaire du Centre de Recherche en Biotechnologie (C.R.B.t).	Lab-on-chip (LOC), microfluidique, CRISPR, ingénierie tissulaire	Startup pionnière de la biotech 4.0 algérienne, reconnue nationalement et distinguée au niveau présidentiel pour sa R&D en lab-on-chip.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
mimic-al	ar	MIMIC-AL	الجزائر	المختبر على الشريحة والهندسة الحيوية	أول شركة ناشئة جزائرية في التكنولوجيا الحيوية 4.0، متخصصة في الهندسة الحيوية وعلم الأوميكس: منصات مختبر على شريحة، هندسة وراثية، هندسة خلوية وأنسجية. شريك لمركز البحث في التكنولوجيا الحيوية (C.R.B.t).	مختبر على شريحة (LOC)، ميكروفلويديكس، CRISPR، هندسة الأنسجة	شركة جزائرية رائدة في التكنولوجيا الحيوية 4.0 حاصلة على تقدير وطني وتمييز رئاسي لأبحاثها في المختبر على الشريحة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
nanox-imaging	fr	Nanox Imaging	États-Unis	Dispositifs de radiographie médicale	Développe une technologie de radiographie numérique à champ lumineux pour rendre l'imagerie médicale accessible et abordable via la numérisation connectée au cloud.	Radiographie numérique, sources à cathode froide MEMS, imagerie cloud	Réduction radicale du coût de l'imagerie médicale - un modèle pertinent pour l'accès medtech dans les marchés émergents.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
nanox-imaging	ar	Nanox Imaging	الولايات المتحدة	أجهزة الأشعة الطبية	تطوّر تقنية أشعة سينية رقمية بالمجال الضوئي لجعل التصوير الطبي في متناول الجميع وبأسعار معقولة عبر مسح ضوئي موصول بالسحابة.	أشعة رقمية، مصادر مهبط بارد MEMS، تصوير سحابي	خفض جذري لتكلفة التصوير الطبي — نموذج وثيق الصلة بإتاحة التكنولوجيا الطبية في الأسواق الناشئة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
nooragri	fr	NoorAgri	Algérie	Serres intelligentes et FaaS	Entreprise agritech soutenant une agriculture intelligente et durable : construction et gestion de serres, tunnels et pivots combinant matériaux avancés, IoT, IA et énergie solaire (Farming-as-a-Service).	Capteurs IoT, IA, drones agricoles, énergie solaire, ingénierie de serres	Intègre IoT, IA, drones et solaire dans toute la chaîne de valeur agricole avec un modèle de service pour les agriculteurs algériens.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
nooragri	ar	NoorAgri	الجزائر	بيوت بلاستيكية ذكية وزراعة كخدمة	شركة تكنولوجيا زراعية تدعم الزراعة الذكية والمستدامة: بناء وإدارة البيوت البلاستيكية والأنفاق وأنظمة المحاور المائية مع دمج المواد المتقدمة، إنترنت الأشياء، الذكاء الاصطناعي والطاقة الشمسية (الزراعة كخدمة).	حساسات إنترنت الأشياء، ذكاء اصطناعي، طائرات زراعية، طاقة شمسية، هندسة البيوت البلاستيكية	تدمج إنترنت الأشياء والذكاء الاصطناعي والطائرات والطاقة الشمسية عبر سلسلة القيمة الزراعية بنموذج خدمة للمزارعين الجزائريين.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
northvolt	fr	Northvolt	Suède	Cellules de batterie lithium-ion	Producteur européen de batteries fabriquant des cellules lithium-ion, des systèmes et le recyclage pour les véhicules électriques et le stockage d'énergie stationnaire.	Fabrication de cellules lithium-ion, recyclage de batteries, gigafactories	Référence européenne de scale-up deeptech pour le stockage d'énergie ; étalon pour les chaînes de valeur des batteries.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
northvolt	ar	Northvolt	السويد	خلايا بطاريات الليثيوم أيون	مصنّع أوروبي للبطاريات ينتج خلايا الليثيوم أيون وأنظمة وإعادة تدوير للمركبات الكهربائية وتخزين الطاقة الثابتة.	تصنيع خلايا الليثيوم أيون، إعادة تدوير البطاريات، مصانع عملاقة	مرجع أوروبي في توسّع التكنولوجيا العميقة لتخزين الطاقة؛ ومعيار لسلاسل قيمة البطاريات.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
optibot-dz	fr	OptiBot DZ	Algérie	Robotique industrielle (RaaS)	Propose des robots intelligents autonomes - chariots autopilotés (500-1500 kg) et bras robotisés - aux entrepôts et usines algériens via un abonnement Robotics-as-a-Service.	Robots mobiles autonomes, navigation LiDAR, vision par ordinateur IA	Couche d'adoption robotique locale : le modèle RaaS abordable rend l'automatisation industrielle accessible aux industriels algériens.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
optibot-dz	ar	OptiBot DZ	الجزائر	الروبوتات الصناعية (روبوتات كخدمة)	توفّر روبوتات ذكية مستقلة — عربات ذاتية القيادة (500-1500 كغ) وأذرع روبوتية — للمستودعات والمصانع الجزائرية عبر نموذج اشتراك (الروبوتات كخدمة).	روبوتات متنقلة مستقلة، ملاحة بالليدار، رؤية حاسوبية بالذكاء الاصطناعي	طبقة اعتماد محلية للروبوتات: نموذج الاشتراك الاقتصادي يجعل الأتمتة الصناعية في متناول المصنّعين الجزائريين.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
qareeb	fr	Qareeb	Algérie	IoT et edge computing	Conçoit des produits IoT et de edge computing adaptés aux conditions de terrain algériennes. Q-Farming utilise la connectivité LoRa avec une portée de 30 km pour l'agriculture intelligente ; également Q-Vision et Q-Access.	LoRa, edge computing, vision par ordinateur, contrôle d'accès	A remporté le Greentech Challenge et représenté l'Algérie au LEAP 2025 - matériel IoT local conçu pour des conditions locales.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
qareeb	ar	Qareeb	الجزائر	إنترنت الأشياء والحوسبة الطرفية	تصمّم منتجات إنترنت الأشياء والحوسبة الطرفية المكيّفة مع ظروف الميدان الجزائرية. Q-Farming تستخدم اتصال LoRa بمدى 30 كلم للزراعة الذكية؛ بالإضافة إلى Q-Vision وQ-Access.	LoRa، حوسبة طرفية، رؤية حاسوبية، تحكم بالدخول	فازت بتحدي Greentech وتمثل الجزائر في LEAP 2025 — أجهزة إنترنت الأشياء محلية الصنع مصممة للظروف المحلية.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
rocket-lab	fr	Rocket Lab	États-Unis	Services de lancement et engins spatiaux	Entreprise spatiale intégrée fournissant des services de lancement dédiés (Electron), la fabrication d'engins spatiaux et des composants satellite depuis 2006.	Petits lanceurs, engins photon, fusées en composite carbone	Modèle mondial de petits lanceurs et d'accès orbital rapide, pertinent pour les programmes spatiaux émergents.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
rocket-lab	ar	Rocket Lab	الولايات المتحدة	خدمات الإطلاق والمركبات الفضائية	شركة فضائية متكاملة تقدّم خدمات إطلاق مخصص (Electron)، وتصنيع مركبات فضائية ومكوّنات أقمار صناعية منذ 2006.	مركبات إطلاق صغيرة، مركبات فوتون، صواريخ بألياف الكربون	نموذج عالمي للصواريخ الصغيرة والوصول المداري السريع، وثيق الصلة بالبرامج الفضائية الناشئة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
sahara-drones	fr	Sahara Sky Drones	Algérie	Drones agricoles	Essaim de drones autonomes pour l'agriculture de précision sur de grandes exploitations proches du Sahara.	Essaimage autonome, imagerie NDVI, recharge solaire	Optimise l'utilisation de l'eau et des engrais dans l'agriculture aride, soutenant directement la sécurité alimentaire.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
sahara-drones	ar	Sahara Sky Drones	الجزائر	طائرات زراعية بدون طيار	سرب طائرات بدون طيار مستقلة للزراعة الدقيقة في المزارع الكبيرة المتاخمة للصحراء.	تحليق سرب ذاتي، تصوير NDVI، شحن شمسي	يحسّن استخدام الماء والأسمدة في الزراعة الجافة، دعمًا مباشرًا للأمن الغذائي.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
sifive	fr	SiFive	États-Unis	Processeurs RISC-V	Pionnier de l'informatique RISC-V, fournissant une IP de processeurs à architecture ouverte et la personnalisation pour les semi-conducteurs, accélérateurs IA et SoC.	Cœurs RISC-V, IP de processeurs, conception SoC	Au centre du mouvement ISA ouverte qui permet une conception de puces souveraine - clé de la souveraineté des semi-conducteurs.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
sifive	ar	SiFive	الولايات المتحدة	معالجات RISC-V	رائد الحوسبة RISC-V، يوفّر ملكية فكرية لمعالجات ذات بنية مفتوحة وتخصيصًا لأشباه الموصلات ومسرعات الذكاء الاصطناعي والأنظمة على شريحة.	أنوية RISC-V، ملكية فكرية للمعالجات، تصميم SoC	في مركز حركة البنية المفتوحة التي تتيح تصميم رقائق سيادي — مفتاح سيادة أشباه الموصلات.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
symloop	fr	Symloop	Algérie	Plateforme IA souveraine	Entreprise de deeptech IA à Alger (fondée en 2012) construisant NOOR, une plateforme IA souveraine, et des systèmes IA de production pour banques, ministères, acteurs pétroliers et hôpitaux au MENA.	IA de production, cloud souverain, plateformes IA	Acteur algérien de longue date dans la deeptech IA, avec des déploiements réels dans des secteurs réglementés au MENA.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
symloop	ar	Symloop	الجزائر	منصة ذكاء اصطناعي سيادية	شركة تكنولوجيا عميقة في الذكاء الاصطناعي بالجزائر العاصمة (تأسست 2012) تبني NOOR، منصة ذكاء اصطناعي سيادية، وأنظمة ذكاء اصطناعي إنتاجية للبنوك والوزارات ومشغلي النفط والغاز والمستشفيات في الشرق الأوسط وشمال إفريقيا.	ذكاء اصطناعي إنتاجي، سحابة سيادية، منصات ذكاء اصطناعي	لاعب جزائري راسخ في التكنولوجيا العميقة للذكاء الاصطناعي مع نشر فعلي في قطاعات منظمة في منطقة الشرق الأوسط وشمال إفريقيا.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
think-touch-solution	fr	Think Touch Solution	Algérie	Pharmacovigilance IA	Startup MedTech/Biotech basée à Alger, spécialisée en pharmacovigilance, cosmétovigilance et matériovigilance pilotées par l'IA (CureSkyAI, CosmetoCare). Sélectionnée pour le Saudi Biotechnology Accelerator 2025.	Analyses prédictives IA, sécurité des médicaments en NLP, données de santé	Sélection par un accélérateur international (Saudi Vision 2030) pour la sûreté sanitaire IA protégeant les consommateurs MENA.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
think-touch-solution	ar	Think Touch Solution	الجزائر	التيقظ الدوائي بالذكاء الاصطناعي	شركة ناشئة في التكنولوجيا الطبية والحيوية بالجزائر العاصمة، متخصصة في التيقظ الدوائي والتحصيني والمواد الطبية بقيادة الذكاء الاصطناعي (CureSkyAI, CosmetoCare). تم اختيارها لمسرع التكنولوجيا الحيوية السعودي 2025.	تحليلات تنبؤية بالذكاء الاصطناعي، سلامة الأدوية بمعالجة اللغة الطبيعية، بيانات صحية	اختيار دولي (رؤية السعودية 2030) لسلامة صحية مدعومة بالذكاء الاصطناعي تحمي المستهلكين في المنطقة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
wiz	fr	Wiz	États-Unis	Plateforme de sécurité cloud	Plateforme de sécurité cloud-native consolidant la gestion des vulnérabilités, la sécurité des conteneurs et du cloud ; devenue l'entreprise de sécurité à la croissance la plus rapide, a levé plus de 1 Md$ et a été acquise par Google en 2025.	Sécurité cloud, CNAPP, priorisation des vulnérabilités, analyse sans agent	Référence des licornes de la cybersécurité ; référence pertinente pour l'adoption de la sécurité cloud.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
wiz	ar	Wiz	الولايات المتحدة	منصة أمان سحابي	منصة أمان سحابية أصلية توحّد إدارة الثغرات وأمان الحاويات والسحابة؛ أصبحت أسرع شركة أمن نموًا، جمعت أكثر من مليار دولار واستحوذت عليها Google عام 2025.	أمان سحابي، CNAPP، ترتيب أولويات الثغرات، فحص بدون وكيل	معيار لـ«اليونيكورن» في الأمن السيبراني؛ ومرجع وثيق الصلة بتبني أمان السحابة.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
yassirt-robotics	fr	Yassirt Robotics	Algérie	Robotique industrielle	Bras cobots et systèmes de vision automatisant les chaînes d'assemblage dans les usines nord-africaines.	Vision par ordinateur, intégration PLC, ROS2	Renforce la compétitivité de la fabrication locale en rendant l'automatisation industrielle abordable.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
yassirt-robotics	ar	Yassirt Robotics	الجزائر	الروبوتات الصناعية	أذرع روبوتية متعاونة وأنظمة رؤية تؤتمت خطوط التجميع في مصانع شمال إفريقيا.	رؤية حاسوبية، تكامل PLC، ROS2	تعزز تنافسية التصنيع المحلي بجعل الأتمتة الصناعية اقتصادية.	2026-09-15 11:52:40.459865+01	2026-09-15 11:52:40.459865+01
\.


--
-- Data for Name: startups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.startups (id, name, country, domain, sub_domain, short_description, technology, year_founded, official_site, source_url, why_relevant, priority, status, is_duplicate_2025, submitted_by_team, created_at, updated_at, submitted_by_team_code) FROM stdin;
kabas-ai	KABAS AI	Algeria	ai-computing	Generative AI	A sovereign Arabic large language model trained on-premises for government and enterprise use.	LLM fine-tuning, RAG, on-prem inference	2024	https://kabas.ai	https://www.researchgate.net	Addresses digital sovereignty and Arabic NLP gaps with a foundation model built in Algeria.	A	verified	f	6d2d44e6-5ce9-479d-9794-a2358faa160b	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
yassirt-robotics	Yassirt Robotics	Algeria	robotics	Industrial robotics	Cobot arms and vision systems automating assembly lines in North African factories.	Computer vision, PLC integration, ROS2	2021	https://www.yassirt.com	\N	Boosts local manufacturing competitiveness by making industrial automation affordable.	B	verified	f	34920b99-1474-4983-aafc-17b9aec198bd	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
dz-biomark	DZ BioMark	Algeria	biotech-healthtech	Diagnostics	Low-cost molecular diagnostics kits for infectious diseases adapted to desert logistics.	CRISPR-based detection, lyophilized reagents	2020	https://www.dzbiomark.dz	\N	Brings rapid diagnostics to remote regions, cutting sample transport time by days.	A	verified	f	a3fbcfaa-8bf4-4b53-a924-86d3f1eb5d1c	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
maghreb-storage	Maghreb Storage Solutions	Algeria	energy-storage	Battery storage	Utility-scale battery energy storage systems balancing solar intermittency.	LFP BESS, smart inverters, EMS software	2023	https://www.maghreb-storage.dz	\N	Unlocks Algeria’s solar potential by solving the grid-storage bottleneck.	A	verified	f	a9771be3-6b95-4854-a93f-72c89764a1e2	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
atlas-space	Atlas Spaceworks	Algeria	space-aerospace	CubeSats & ground stations	CubeSat platforms and low-cost ground station networks for African earth observation.	CubeSat bus, S-band ground stations, telemetry software	2022	https://www.atlas-spaceworks.io	https://asa.dz	Builds sovereign space capacity for monitoring agriculture and water across North Africa.	B	verified	f	f043bd9e-9d3f-4f63-a0c5-211dfa89c21d	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
cybershield-dz	CyberShield DZ	Algeria	cybersecurity	Security operations	Managed detection & response platform tailored to Algerian SMEs and the public sector.	SIEM, EDR, AI-driven threat correlation	2019	https://www.cybershield-dz.dz	\N	Closes a critical gap in national cyber resilience for critical infrastructure.	A	verified	f	2ab0c601-f3d6-456e-97f9-271ecaebd445	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
sahara-drones	Sahara Sky Drones	Algeria	drones-autonomy	Agricultural drones	Autonomous drone swarm for precision agriculture over large Saharan-adjacent farms.	Autonomous swarming, NDVI imaging, solar charging	2022	https://www.sahara-sky-drones.dz	https://www.univ-ouargla.dz	Optimizes water and fertilizer use in arid agriculture, directly supporting food security.	B	verified	f	e1558c9c-012c-4782-b493-de119f3fd2fd	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
aures-medic	Aurès MedTech	Algeria	medtech	Medical devices	Affordable AI-assisted vital-sign monitors for rural clinics.	Embedded ML, low-power hardware, telehealth APIs	2020	https://www.aures-medic.com	\N	Reduces reliance on imported medical devices and improves rural care access.	A	verified	f	0fef6cc6-0c72-4287-8d1f-5f2976745859	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
graphene-dz	GrapheneDZ	Algeria	nanotech-materials	Graphene membranes	Graphene-enhanced membranes for water desalination.	CVD graphene, membrane coating	2019	https://www.graphene-dz.com	\N	Turns abundant local hydrocarbon feedstock into high-value advanced materials.	C	rejected	f	74e2e5b1-1d97-4711-ac8b-acfa6c8b6605	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01	\N
aurion-semi	Aurion Semiconductors	Algeria	semiconductors	Power management ICs	Design house for power-management ICs targeting LDO regulators in 130nm.	Analog IC design, 130nm PDK, silicon validation	2023	https://www.aurion-semi.com	\N	Builds foundational IC design capability in a region without domestic fabs.	C	pending	f	60850892-6a6b-4ad6-8a0d-25636041b85c	2026-09-13 23:32:37.581929+01	2026-09-14 00:39:21.199135+01	\N
badis-ai	BADIS AI	Algeria	ai-computing	Sovereign AI software	Publisher of on-premise sovereign AI software (OCR, RAG, AI agents, chatbots, data assistant) based at Cyberparc de Sidi Abdellah, Algiers. Ranked Top 10 AI & EdTech startups in Algeria.	OCR, RAG, LLM agents, on-premise AI suite	\N	https://badis.ai	https://badis.ai/	Part of the first wave of Algerian sovereign-AI startups incubated at Cyberparc de Sidi Abdellah; represents the national AI software ecosystem.	A	verified	f	\N	2026-09-14 21:39:05.78258+01	2026-09-14 21:39:05.78258+01	T01
symloop	Symloop	Algeria	ai-computing	Sovereign AI platform	Deep-tech AI company in Algiers (founded 2012) building NOOR, a sovereign AI platform, and production AI systems for banks, ministries, oil & gas operators and hospitals across MENA.	Production AI, sovereign cloud, AI platforms	2012	https://symloop.com	https://symloop.com/	Long-standing Algerian deep-tech AI player with real deployments across MENA regulated industries.	B	verified	f	\N	2026-09-14 21:39:05.786664+01	2026-09-14 21:39:05.786664+01	T01
lablabee	LabLabee	Algeria	cloud-iot	Virtual labs / EdTech	First Algerian edtech with US ambitions. Provides on-demand virtual labs for 5G, Cloud, IMS and Kubernetes. Raised $3.4M in 2024 led by Reach Capital.	5G, Cloud, Kubernetes simulators and virtual labs	2021	https://www.lablabee.com	https://algeriatech.news/fr/algeria-10-startups-to-watch-2026-sectors-profiles-fr/	Proof an Algerian startup can raise international capital (Reach Capital, Brighteye) for deep-tech B2B globally.	A	verified	f	\N	2026-09-14 21:39:05.78945+01	2026-09-14 21:39:05.78945+01	T14
qareeb	Qareeb	Algeria	cloud-iot	IoT & edge computing	Designs IoT and edge computing products adapted to Algerian field conditions. Q-Farming uses LoRa connectivity with 30 km range for smart agriculture; also Q-Vision and Q-Access.	LoRa, edge computing, computer vision, access control	2023	https://qareeb.io	https://menastartupdigest.com/qareeb-leverages-edge-ai-for-smart-agriculture-and-security-in-algeria/	Won the Greentech Challenge and represented Algeria at LEAP 2025 — local hardware IoT built for local conditions.	A	verified	f	\N	2026-09-14 21:39:05.791194+01	2026-09-14 21:39:05.791194+01	T14
optibot-dz	OptiBot DZ	Algeria	robotics	Industrial robotics (RaaS)	Offers smart autonomous robots — self-driving carts (500–1500 kg) and robotic arms — to Algerian warehouses and factories via a Robotics-as-a-Service subscription model.	Autonomous Mobile Robots, LiDAR navigation, AI computer vision	\N	https://optibotdz.com	https://optibotdz.com/	Local robotics adoption layer: affordable RaaS model makes industrial automation accessible to Algerian manufacturers.	A	verified	f	\N	2026-09-14 21:39:05.792625+01	2026-09-14 21:39:05.792625+01	T02
bk-fire-icosium	BK Fire (Icosium)	Algeria	robotics	Firefighting robots	Industrial deeptech SME repositioned as BK Fire. Icosium is a 480 kg Algerian-made firefighting robot resisting 2000°C, 80 m water projection, 300 m control range; 2026 AI upgrade adds autonomous detection.	Robotics, tele-operated firefighting, AI detection & intervention	2008	https://optimiz-hub.com	https://algeriatech.news/algeria-bk-fire-icosium-industrial-robot-deeptech-export-2026/	Only robot of its type manufactured in Africa/Arab world, exhibited at Intersoutsch Hannover — model for Algerian hardware deeptech export.	A	verified	f	\N	2026-09-14 21:39:05.793983+01	2026-09-14 21:39:05.793983+01	T02
kleenov	Kleenov	Algeria	drones-autonomy	Autonomous aquatic robots	Develps AquaBotX, an autonomous aquatic robot for cleaning floating waste and monitoring water quality in dams, ports, rivers and lakes. Technology developed in Algeria.	Autonomous waterborne robotics, sensors, AI	\N	https://kleenov.com	https://kleenov.com/	Uses robotics + AI for environmental preservation — target segment that maps directly to Algeria's water infrastructure challenges.	B	verified	f	\N	2026-09-14 21:39:05.795429+01	2026-09-14 21:39:05.795429+01	T04
flyteq	FLYTEQ	Algeria	drones-autonomy	Drone engineering services	Algerian drone ecosystem company delivering drone-based services — precision agriculture (AGRO TEQ), geospatial mapping (GEO TEQ), infrastructure inspection (SCAN TEQ) and high-altitude cleaning (CLEAN TEQ).	Drone photogrammetry, multispectral NDVI, thermal inspection, AI data intelligence	\N	https://flyteq.net	https://flyteq.net/	Sovereign drone engineering capacity — aerial data services for agriculture, security and industrial inspection built in Algeria.	B	verified	f	\N	2026-09-14 21:39:05.796486+01	2026-09-14 21:39:05.796486+01	T04
aircrop	AirCrop	Algeria	agritech-foodtech	Drone & AI precision agriculture	Drone-as-a-Service platform using AI to monitor crop health in real time: disease, pest and irrigation issue detection, plus targeted spraying. Recognized in Algeria Startup Challenge 2024.	Agricultural drones, multispectral imaging, AI analytics	\N	https://aircrop.io	https://aircrop.io/	Agritech Challenge 2024 laureate addressing crop loss and input reduction for Algerian farmers.	A	verified	f	\N	2026-09-14 21:39:05.797772+01	2026-09-14 21:39:05.797772+01	T08
farmai	FarmAI	Algeria	agritech-foodtech	AI crop disease detection	Agri-tech startup detecting plant infections early via AI and drones. Won Huawei's Tech4Good People's Choice Award ($100K) for wheat rust detection using multispectral drone imagery.	Computer vision, multispectral drone imaging, ML classification	2022	https://farm-ai.org	https://algeriatech.news/algeria-farmia-huawei-tech4good-wheat-rust-2026/	Global recognition (Huawei $100K prize) for AI applied to food security — strategic national priority for wheat self-sufficiency.	A	verified	f	\N	2026-09-14 21:39:05.799051+01	2026-09-14 21:39:05.799051+01	T08
nooragri	NoorAgri	Algeria	agritech-foodtech	Smart greenhouses & FaaS	Agri-tech company supporting smart and sustainable farming: construction and management of greenhouses, tunnels and pivot systems combining advanced materials, IoT, AI and solar energy (Farming-as-a-Service).	IoT sensors, AI, agri-drones, solar energy, greenhouse engineering	\N	https://www.nooragri.com	https://www.nooragri.com/en/	Integrates IoT, AI, drones and solar across agricultural value chain with a service model for Algerian farmers.	B	verified	f	\N	2026-09-14 21:39:05.800289+01	2026-09-14 21:39:05.800289+01	T08
mimic-al	MIMIC-AL	Algeria	biotech-healthtech	Lab-on-chip & bioengineering	First Biotech 4.0 startup in Algeria, specialized in bioengineering and omics: lab-on-chip platforms, genetic engineering, cell and tissue engineering. Partner of the Biotechnology Research Center C.R.B.t.	Lab-on-chip (LOC), microfluidics, CRISPR, tissue engineering	\N	https://mimical.dz	https://mimical.dz/	Pioneer Algerian biotech 4.0 startup with national recognition and presidential distinction for lab-on-chip R&D.	A	verified	f	\N	2026-09-14 21:39:05.801533+01	2026-09-14 21:39:05.801533+01	T03
think-touch-solution	Think Touch Solution	Algeria	biotech-healthtech	AI pharmacovigilance	Algiers-based MedTech/Biotech startup specialized in AI-driven pharmacovigilance, cosmetovigilance and materiovigilance (CureSkyAI, CosmetoCare). Selected for the Saudi Biotechnology Accelerator 2025.	AI predictive analytics, NLP drug safety, health data	2022	https://thinktouchofficial.com	https://menastartupdigest.com/algerias-think-touch-solution-joins-saudi-accelerator-with-two-ai-healthtech-projects/	International accelerator selection (Saudi Vision 2030) for AI health-safety protecting MENA consumers.	A	verified	f	\N	2026-09-14 21:39:05.802571+01	2026-09-14 21:39:05.802571+01	T03
northvolt	Northvolt	Sweden	energy-storage	Lithium-ion battery cells	European battery producer building lithium-ion cells, systems and recycling for electric vehicles and stationary energy storage.	Lithium-ion cell manufacturing, battery recycling, gigafactories	2016	https://northvolt.com	https://northvolt.com/	Reference European deep-tech scale-up for energy storage; benchmark for battery value chains.	B	verified	f	\N	2026-09-14 21:39:05.803453+01	2026-09-14 21:39:05.803453+01	T06
rocket-lab	Rocket Lab	USA	space-aerospace	Launch services & spacecraft	End-to-end space company providing dedicated launch services (Electron), spacecraft manufacturing and satellite components since 2006.	Small launch vehicles, photon spacecraft, carbon composite rockets	2006	https://www.rocketlabusa.com	https://www.rocketlabusa.com/	Global model for small launchers and rapid orbital access relevant to emerging space programs.	B	verified	f	\N	2026-09-14 21:39:05.804482+01	2026-09-14 21:39:05.804482+01	T07
wiz	Wiz	USA	cybersecurity	Cloud security platform	Cloud-native security platform consolidating vulnerability management, container and cloud security; became the fastest-growing security company, raised $1B+ and acquired by Google in 2025.	Cloud security, CNAPP, vulnerability prioritization, agentless scanning	2020	https://www.wiz.io	https://www.wiz.io/	Benchmark for cybersecurity unicorns; relevant reference for cloud security adoption.	B	verified	f	\N	2026-09-14 21:39:05.8068+01	2026-09-14 21:39:05.8068+01	T11
sifive	SiFive	USA	semiconductors	RISC-V processors	Pioneer of RISC-V computing, providing open-architecture processor IP and customization for semiconductors, AI accelerators and SoCs.	RISC-V cores, processor IP, SoC design	2015	https://www.sifive.com	https://www.sifive.com/	At the center of the open ISA movement enabling sovereign chip design — key for semiconductor sovereignty.	B	verified	f	\N	2026-09-14 21:39:05.808322+01	2026-09-14 21:39:05.808322+01	T10
formlabs	Formlabs	USA	manufacturing-3d	Desktop & industrial 3D printing	Producer of accessible SLA and SLS 3D printers used by engineers, manufacturers and designers worldwide since 2011.	Stereolithography, selective laser sintering, 3D printing	2011	https://formlabs.com	https://formlabs.com/	Reference for democratized advanced manufacturing hardware.	C	verified	f	\N	2026-09-14 21:39:05.809555+01	2026-09-14 21:39:05.809555+01	T12
nanox-imaging	Nanox Imaging	USA	medtech	Medical X-ray devices	Develops light-field digital X-ray technology aiming to make medical imaging accessible and affordable through cloud-connected digital scanning.	Digital X-ray, MEMS cold cathode sources, cloud imaging	2011	https://nanox.vision	https://nanox.vision/	Radical cost reduction in medical imaging — relevant model for medtech access in emerging markets.	B	verified	f	\N	2026-09-14 21:39:05.810742+01	2026-09-14 21:39:05.810742+01	T09
crunch-lab	Crunch Lab	USA	nanotech-materials	Nanotextiles & advanced materials	Disruptive R&D lab producing carbon nanotube yarns, sheets, films and new material/electrochemical applications at industrial scales.	Carbon nanotube manufacturing, advanced materials	2021	https://www.crunchlab.com	https://www.crunchlab.com/	US-based nanomaterials venture highlighting advanced material manufacturing pathways.	C	pending	f	\N	2026-09-14 21:39:05.811614+01	2026-09-14 21:39:05.811614+01	T05
grover-energy	Grover Energy	France	energy-storage	Coiled energy storage	French deeptech storing electrical energy in coils of exotic-metal cables (no batteries), targeting renewable grid-scale storage and EV ultra-fast-charging swamp.	Magnetic coil-based energy storage, switchgear	2022	https://www.grover.energy	https://www.grover.energy/	Novel non-battery storage concept relevant to clean energy transitions.	C	pending	f	\N	2026-09-14 21:39:05.81278+01	2026-09-14 21:39:05.81278+01	T06
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (code, name, domain_slug, quota, created_at, updated_at) FROM stdin;
T01	AI & Advanced Computing	ai-computing	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T02	Robotics	robotics	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T03	Biotech & HealthTech	biotech-healthtech	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T04	Autonomous Systems & Drones	drones-autonomy	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T05	Nanotech & Advanced Materials	nanotech-materials	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T06	Energy & Storage	energy-storage	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T07	SpaceTech & Aerospace	space-aerospace	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T08	AgriTech & FoodTech	agritech-foodtech	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T09	MedTech	medtech	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T10	Semiconductors & Electronics	semiconductors	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T11	Cybersecurity	cybersecurity	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T12	Advanced Manufacturing & 3D Printing	manufacturing-3d	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T13	Environment, Water & CleanTech	cleantech	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T14	Cloud Computing & Industrial IoT	cloud-iot	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
T15	Other Deep Tech	other-deep-tech	500	2026-09-14 21:38:05.015076+01	2026-09-14 21:38:05.015076+01
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, team_domain, created_at, updated_at) FROM stdin;
a1f01d4c-98e1-45ff-abca-9498811a59c9	Gouvernement Admin	admin@mpme.gov.dz	$2b$12$MI7bQ9WXPt0Cz17YKUg99Oggk7L/3OCU3wB0OKQ42JxG3jyS5smnq	admin	\N	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
4b32dcdb-66cb-455f-ac5a-e54015827c98	Comité de Revue	reviewer@mpme.gov.dz	$2b$12$eD7KE/ocUL.AefxH3RXqW.WhPxkgfVycVm.ayCyFEUEqTRjniEgOm	reviewer	\N	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
6d2d44e6-5ce9-479d-9794-a2358faa160b	Équipe IA & Computing	team.ai@mpme.gov.dz	$2b$12$LzCbX28v87nOl3UAvOoa3uw2gDubgQF1yXWfwBDQ.t482ZfBkTEWK	team	ai-computing	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
a9771be3-6b95-4854-a93f-72c89764a1e2	Équipe Énergie	team.energy@mpme.gov.dz	$2b$12$kuL9ogv8fIYpoS7Fn5hOuOe4TTPNfL8euS8tDJtLjGMB7eoaFYbEq	team	energy-storage	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
2ab0c601-f3d6-456e-97f9-271ecaebd445	Équipe Cyber	team.cyber@mpme.gov.dz	$2b$12$/xwG82ssrCHNEgT3OnhRoOBaxmXacJB59Qe1XoxKCnNiKCMNd6gQO	team	cybersecurity	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
a3fbcfaa-8bf4-4b53-a924-86d3f1eb5d1c	Équipe Biotech	team.biotech@mpme.gov.dz	$2b$12$VHUTuv3hjaXld4sfv/5d5uonH5sqGP/qgYg46aEjkT5E1RqXBab5G	team	biotech-healthtech	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
f043bd9e-9d3f-4f63-a0c5-211dfa89c21d	Équipe Spatiale	team.space@mpme.gov.dz	$2b$12$YYZ.8L3PqGBNd9HXRNHmjuJgJZN20JP9WhH59PTsWo1yB5uP17tne	team	space-aerospace	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
34920b99-1474-4983-aafc-17b9aec198bd	Équipe Robotique	team.robotics@mpme.gov.dz	$2b$12$qpMa0ddkD1JFNs0MNA26IeK/iOcZcVUctu3YEzsxhqlogh6ycFPAe	team	robotics	2026-09-13 23:32:37.581929+01	2026-09-13 23:32:37.581929+01
0fef6cc6-0c72-4287-8d1f-5f2976745859	Équipe MédTech	team.medtech@mpme.gov.dz	$2b$12$ZsuFkrQaA3SVy.O4vF4P5OwfaDwP14t3itn0y0Lx.RkrpSmtf.yMO	team	medtech	2026-09-13 23:33:10.369624+01	2026-09-13 23:33:10.369624+01
e1558c9c-012c-4782-b493-de119f3fd2fd	Équipe Drones	team.drones@mpme.gov.dz	$2b$12$jVHAhNPLTxO8lY.JhAaAC.YgAHjuonT/gkj1fRA83gH7VflKcBt2m	team	drones-autonomy	2026-09-13 23:33:10.984901+01	2026-09-13 23:33:10.984901+01
60850892-6a6b-4ad6-8a0d-25636041b85c	Équipe Semi-conducteurs	team.semi@mpme.gov.dz	$2b$12$gstn0odvNiLdJ9kT0L2gveO1JcYaVCHpKh7NNpOINHKSQ1eB.xgA2	team	semiconductors	2026-09-13 23:33:11.583709+01	2026-09-13 23:33:11.583709+01
74e2e5b1-1d97-4711-ac8b-acfa6c8b6605	Équipe Nanomatériaux	team.nano@mpme.gov.dz	$2b$12$bSy2TBFfAzPW0v89BhBL6.EYM748JbK1pue4mi/Ol3lliypRFctuO	team	nanotech-materials	2026-09-13 23:33:12.198013+01	2026-09-13 23:33:12.198013+01
93d1cc05-7c8f-4de1-91bc-eb864d5d9dbd	Domain Verifier	verifier@deeptech.dz	$2b$10$dqEPVeWfc2/CWEM.Ya6rmOH8zbNS1SPggBPmNnWvN75c5OVpbaQ7q	reviewer	\N	2026-09-14 21:38:52.970935+01	2026-09-14 21:38:52.970935+01
12dd6f99-82fb-47e6-8160-1018be3865d5	Team 01 — AI	team01@deeptech.dz	$2b$10$dqEPVeWfc2/CWEM.Ya6rmOH8zbNS1SPggBPmNnWvN75c5OVpbaQ7q	team	ai-computing	2026-09-14 21:38:52.972352+01	2026-09-14 21:38:52.972352+01
42d56462-b2eb-49b5-b0c3-8a5aa599783a	Administrator	admin@deeptech.dz	$2b$12$g4xpGFb/cvdPu4RfH3R4COSW05Jls3CZ2wiSY1kR2gUsXv5kBe.f6	admin	\N	2026-09-14 21:38:52.9673+01	2026-09-14 21:38:52.9673+01
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 14, true);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: domain_meta domain_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_meta
    ADD CONSTRAINT domain_meta_pkey PRIMARY KEY (slug);


--
-- Name: members members_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_email_key UNIQUE (email);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: saved_startups saved_startups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_startups
    ADD CONSTRAINT saved_startups_pkey PRIMARY KEY (member_id, startup_id);


--
-- Name: startup_translations startup_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.startup_translations
    ADD CONSTRAINT startup_translations_pkey PRIMARY KEY (startup_id, locale);


--
-- Name: startups startups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.startups
    ADD CONSTRAINT startups_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (code);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user ON public.audit_log USING btree (user_id);


--
-- Name: idx_startups_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_startups_domain ON public.startups USING btree (domain);


--
-- Name: idx_startups_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_startups_status ON public.startups USING btree (status);


--
-- Name: idx_startups_submitted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_startups_submitted_by ON public.startups USING btree (submitted_by_team);


--
-- Name: idx_startups_team_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_startups_team_code ON public.startups USING btree (submitted_by_team_code);


--
-- Name: idx_teams_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_domain ON public.teams USING btree (domain_slug);


--
-- Name: saved_startups_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX saved_startups_member_idx ON public.saved_startups USING btree (member_id);


--
-- Name: startup_translations_locale_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX startup_translations_locale_idx ON public.startup_translations USING btree (locale);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: saved_startups saved_startups_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_startups
    ADD CONSTRAINT saved_startups_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: saved_startups saved_startups_startup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_startups
    ADD CONSTRAINT saved_startups_startup_id_fkey FOREIGN KEY (startup_id) REFERENCES public.startups(id) ON DELETE CASCADE;


--
-- Name: startup_translations startup_translations_startup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.startup_translations
    ADD CONSTRAINT startup_translations_startup_id_fkey FOREIGN KEY (startup_id) REFERENCES public.startups(id) ON DELETE CASCADE;


--
-- Name: startups startups_submitted_by_team_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.startups
    ADD CONSTRAINT startups_submitted_by_team_fkey FOREIGN KEY (submitted_by_team) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict x5578cdcdveDTVEZop7dxMBR5hfQ52lul02cnlDOe2xGCbdLJJbahcG1tk7fWDE

