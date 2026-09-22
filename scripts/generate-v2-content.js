const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'global', 'v2');

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fill(t, vars) {
  return String(t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

const DOMAIN_META = {
  'ai-computing': {
    label: { en: 'artificial intelligence', ar: 'الذكاء الاصطناعي', fr: "l'intelligence artificielle" },
    tech: { en: 'machine-learning pipelines, generative models and data infrastructure', ar: 'خطوط تعلّم الآلة والنماذج التوليدية والبنية التحتية للبيانات', fr: 'pipeline de machine learning, modèles génératifs et infrastructure de données' },
    audience: { en: 'businesses and developers', ar: 'الشركات والمطوّرين', fr: 'entreprises et développeurs' },
    sellers: { en: ['OpenAI and Google DeepMind', 'Anthropic and Meta', 'Hugging Face and Mistral AI'], ar: ['OpenAI و Google DeepMind', 'Anthropic و Meta', 'Hugging Face و Mistral AI'], fr: ['OpenAI et Google DeepMind', 'Anthropic et Meta', 'Hugging Face et Mistral AI'] },
    build: { en: ['a focused vertical agent or an infrastructure tool', 'a model-serving or evaluation platform', 'a domain assistant as a B2B product'], ar: ['عميل رأسي متخصص أو أداة بنية تحتية', 'منصة لخدمة النماذج أو تقييمها', 'مساعد قطاعي كمنتج تجاري للشركات'], fr: ['un agent vertical ciblé ou un outil d\u2019infrastructure', 'une plateforme de service ou d\u2019évaluation de modèles', 'un assistant métier comme produit B2B'] },
    roles: { en: [['Backend/AI engineer', 2], ['ML researcher', 1], ['Product engineer', 1], ['Data/ops engineer', 1], ['Founder/lead', 1]], ar: [['مهندس خلفية/ذكاء اصطناعي', 2], ['باحث تعلّم آلة', 1], ['مهندس منتج', 1], ['مهندس بيانات/تشغيل', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur backend/IA', 2], ['Chercheur ML', 1], ['Ingénieur produit', 1], ['Ingénieur données/ops', 1], ['Fondateur/lead', 1]] },
    base: 74, axis: { technical: 0.38, capital: 0.30, regulatory: 0.14, market: 0.18 }
  },
  robotics: {
    label: { en: 'robotics', ar: 'الروبوتات', fr: 'la robotique' },
    tech: { en: 'perception stacks, motion control and mechatronic design', ar: 'أنظمة الإدراك والتحكم الحركي والتصميم الميكاتروني', fr: 'perception, contrôle de mouvement et conception mécatronique' },
    audience: { en: 'industrial and logistics operators', ar: 'المشغّلين الصناعيين واللوجستيين', fr: 'opérateurs industriels et logistiques' },
    sellers: { en: ['Boston Dynamics and Fanuc', 'ABB and KUKA', 'Agility and Sanctuary'], ar: ['Boston Dynamics و Fanuc', 'ABB و KUKA', 'Agility و Sanctuary'], fr: ['Boston Dynamics et Fanuc', 'ABB et KUKA', 'Agility et Sanctuary'] },
    build: { en: ['a purpose-built robot for one repetitive task', 'a mobile manipulation platform', 'a robot fleet controller with teleoperation'], ar: ['روبوت مصمّم خصيصاً لمهمة واحدة متكررة', 'منصة معالجة متنقلة', 'نظام تحكم بأسطول الروبوتات مع تشغيل عن بعد'], fr: ['un robot dédié à une seule tâche répétitive', 'une plateforme de manipulation mobile', 'un contrôleur de flotte robotique avec télémaintenance'] },
    roles: { en: [['Embedded software engineer', 2], ['Mechanical engineer', 1], ['Control engineer', 1], ['Electronics engineer', 1], ['Founder/lead', 1]], ar: [['مهندس برمجيات مدمجة', 2], ['مهندس ميكانيكي', 1], ['مهندس تحكم', 1], ['مهندس إلكترونيات', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur logiciel embarqué', 2], ['Ingénieur mécanique', 1], ['Ingénieur contrôle', 1], ['Ingénieur électronique', 1], ['Fondateur/lead', 1]] },
    base: 80, axis: { technical: 0.42, capital: 0.32, regulatory: 0.10, market: 0.16 }
  },
  'biotech-healthtech': {
    label: { en: 'biotech and health tech', ar: 'التقنيات الحيوية والصحية', fr: 'la biotech et la santé numérique' },
    tech: { en: 'genomics, target discovery and computational biology', ar: 'علم الجينوم واكتشاف الأهداف والبيولوجيا الحاسوبية', fr: 'génomique, ciblage thérapeutique et biologie computationnelle' },
    audience: { en: 'pharma R&D teams and clinical providers', ar: 'فرق البحث والتطوير الصيدلانية ومقدمي الرعاية', fr: 'équipes R&D pharmaceutiques et prestataires cliniques' },
    sellers: { en: ['Novartis and AstraZeneca', 'Roche and Eli Lilly', 'Moderna and Pfizer'], ar: ['Novartis و AstraZeneca', 'Roche و Eli Lilly', 'Moderna و Pfizer'], fr: ['Novartis et AstraZeneca', 'Roche et Eli Lilly', 'Moderna et Pfizer'] },
    build: { en: ['a diagnostics or screening tool for a specific condition', 'a biotech-of-the-loop drug discovery pipeline', 'a clinical data platform'], ar: ['أداة تشخيص أو فحص لحالة محددة', 'خط أنابيب لاكتشاف الأدوية بالذكاء الاصطناعي', 'منصة بيانات سريرية'], fr: ['un outil de diagnostic ou de dépistage ciblé', 'un pipeline de découverte de médicaments assistée par IA', 'une plateforme de données cliniques'] },
    roles: { en: [['Computational biologist', 1], ['Lab/biotech scientist', 1], ['Bioinformatics engineer', 1], ['Data engineer', 1], ['Product owner', 1], ['Founder/lead', 1]], ar: [['عالم بيولوجيا حاسوبية', 1], ['عالم مختبر/تقنيات حيوية', 1], ['مهندس معلوماتية حيوية', 1], ['مهندس بيانات', 1], ['مسؤول منتج', 1], ['مؤسس/قائد', 1]], fr: [['Biologiste computationnel', 1], ['Scientifique laboratoire/biotech', 1], ['Ingénieur bio-informatique', 1], ['Ingénieur données', 1], ['Product owner', 1], ['Fondateur/lead', 1]] },
    base: 86, axis: { technical: 0.38, capital: 0.34, regulatory: 0.26, market: 0.02 }
  },
  'drones-autonomy': {
    label: { en: 'drones and autonomy', ar: 'المسيّرات والاستقلالية', fr: 'les drones et l\u2019autonomie' },
    tech: { en: 'computer vision, sensor fusion and flight control', ar: 'رؤية حاسوبية ودمج الحساسات والتحكم بالطيران', fr: 'vision par ordinateur, fusion de capteurs et pilotage automatique' },
    audience: { en: 'agriculture, logistics and inspection fleets', ar: 'الزراعة والخدمات اللوجستية وأساطيل التفتيش', fr: 'agriculture, logistique et flottes d\u2019inspection' },
    sellers: { en: ['DJI and Skydio', 'Zipline and Wing', 'AeroVironment'], ar: ['DJI و Skydio', 'Zipline و Wing', 'AeroVironment'], fr: ['DJI et Skydio', 'Zipline et Wing', 'AeroVironment'] },
    build: { en: ['a mission-specific airframe with autonomy software', 'a fleet management and BVLOS platform', 'a light-weight delivery system'], ar: ['هيكل طائرة مخصص للمهمة مع برمجية استقلالية', 'منصة لإدارة الأسطول والتحليق خارج مدى الرؤية', 'نظام توصيل خفيف'], fr: ['une cellule dédiée avec logiciel d\u2019autonomie', 'une plateforme de gestion de flotte BVLOS', 'un système de livraison léger'] },
    roles: { en: [['Flight software engineer', 2], ['Vision engineer', 1], ['Aerospace engineer', 1], ['Embedded engineer', 1], ['Founder/lead', 1]], ar: [['مهندس برمجيات طيران', 2], ['مهندس رؤية حاسوبية', 1], ['مهندس فضاء', 1], ['مهندس أنظمة مدمجة', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur logiciel de vol', 2], ['Ingénieur vision', 1], ['Ingénieur aérospatial', 1], ['Ingénieur embarqué', 1], ['Fondateur/lead', 1]] },
    base: 78, axis: { technical: 0.40, capital: 0.30, regulatory: 0.24, market: 0.06 }
  },
  'nanotech-materials': {
    label: { en: 'nanotech and advanced materials', ar: 'النانوتكنولوجيا والمواد المتقدمة', fr: 'la nanotechnologie et les matériaux avancés' },
    tech: { en: 'materials synthesis, surface engineering and metrology', ar: 'تخليق المواد وهندسة الأسطح والقياس الدقيق', fr: 'synthèse de matériaux, ingénierie de surface et métrologie' },
    audience: { en: 'chemical, energy and electronics manufacturers', ar: 'مصنّعي المواد الكيميائية والطاقة والإلكترونيات', fr: 'fabricants chimiques, énergie et électronique' },
    sellers: { en: ['BASF and DuPont', 'Dow and SABIC', 'Nanoco and Umicore'], ar: ['BASF و DuPont', 'Dow و SABIC', 'Nanoco و Umicore'], fr: ['BASF et DuPont', 'Dow et SABIC', 'Nanoco et Umicore'] },
    build: { en: ['a pilot production line for one high-value material', 'a coating or membrane with a measurable advantage', 'an equipment metrology tool'], ar: ['خط إنتاج تجريبي لمادة واحدة عالية القيمة', 'طلاء أو غشاء بميزة قابلة للقياس', 'أداة قياس دقيقة للمعدات'], fr: ['une ligne pilote pour un matériau à haute valeur', 'un revêtement ou une membrane à avantage mesurable', 'un outil de métrologie des équipements'] },
    roles: { en: [['Materials scientist', 2], ['Chemical engineer', 1], ['Process engineer', 1], ['Quality/metrology engineer', 1], ['Founder/lead', 1]], ar: [['عالم مواد', 2], ['مهندس كيميائي', 1], ['مهندس عمليات', 1], ['مهندس جودة/قياس', 1], ['مؤسس/قائد', 1]], fr: [['Scientifique matériaux', 2], ['Ingénieur chimiste', 1], ['Ingénieur procédés', 1], ['Ingénieur qualité/métrologie', 1], ['Fondateur/lead', 1]] },
    base: 88, axis: { technical: 0.45, capital: 0.35, regulatory: 0.10, market: 0.10 }
  },
  'energy-storage': {
    label: { en: 'energy storage', ar: 'تخزين الطاقة', fr: 'le stockage de l\u2019énergie' },
    tech: { en: 'cell chemistry, power electronics and grid integration', ar: 'كيمياء الخلايا وإلكترونيات القدرة والربط بالشبكة', fr: 'chimie des cellules, électronique de puissance et intégration réseau' },
    audience: { en: 'utilities, PV installers and EV makers', ar: 'شركات المرافق والمركّبين ومصنّعي السيارات الكهربائية', fr: 'utilities, installateurs solaires et constructeurs EV' },
    sellers: { en: ['CATL and BYD', 'LG Energy Solution', 'Tesla and Fluence'], ar: ['CATL و BYD', 'LG Energy Solution', 'Tesla و Fluence'], fr: ['CATL et BYD', 'LG Energy Solution', 'Tesla et Fluence'] },
    build: { en: ['a battery pack or BMS for a niche vehicle class', 'a grid-scale storage controller', 'a second-life battery platform'], ar: ['حزمة بطاريات أو نظام إدارة بطاريات لفئة مركبات محددة', 'وحدة تحكم لتخزين واسع النطاق', 'منصة لبطاريات الدورة الثانية'], fr: ['un pack batterie ou BMS pour un véhicule de niche', 'un contrôleur de stockage à l\u2019échelle réseau', 'une plateforme de batteries de seconde vie'] },
    roles: { en: [['Cell/battery engineer', 2], ['Power electronics engineer', 1], ['Systems engineer', 1], ['Thermal engineer', 1], ['Founder/lead', 1]], ar: [['مهندس خلايا/بطاريات', 2], ['مهندس إلكترونيات القدرة', 1], ['مهندس أنظمة', 1], ['مهندس حراري', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur cellule/batterie', 2], ['Ingénieur électronique de puissance', 1], ['Ingénieur systèmes', 1], ['Ingénieur thermique', 1], ['Fondateur/lead', 1]] },
    base: 84, axis: { technical: 0.38, capital: 0.38, regulatory: 0.16, market: 0.08 }
  },
  'space-aerospace': {
    label: { en: 'space and aerospace', ar: 'الفضاء والطيران', fr: 'le spatial et l\u2019aéronautique' },
    tech: { en: 'propulsion, structures, telemetry and mission software', ar: 'الدفع والهياكل والقياس عن بعد وبرمجيات المهام', fr: 'propulsion, structures, télémétrie et logiciel de mission' },
    audience: { en: 'satellite operators and launch integrators', ar: 'مشغّلي الأقمار الصناعية ومجمّعي الإطلاق', fr: 'opérateurs satellites et intégrateurs de lancement' },
    sellers: { en: ['SpaceX and Rocket Lab', 'Lockheed and Boeing', 'national space agency primes'], ar: ['SpaceX و Rocket Lab', 'Lockheed و Boeing', 'مقاولو وكالات الفضاء الوطنية'], fr: ['SpaceX et Rocket Lab', 'Lockheed et Boeing', 'maîtres d\u2019œuvre d\u2019agences spatiales'] },
    build: { en: ['a small-sat subsystem with a clear specification gap', 'a satellite data service for agriculture or maritime', 'a telemetry or ground-station software suite'], ar: ['نظام فرعي لقمر صغير يسد فجوة محددة', 'خدمة بيانات ساتلية للزراعة أو الملاحة البحرية', 'حزمة برمجيات للقياس عن بعد أو المحطات الأرضية'], fr: ['un sous-système de petit satellite sur une niche', 'un service de données satellitaires agriculture/maritime', 'une suite logicielle télémétrie ou stations sol'] },
    roles: { en: [['Aerospace systems engineer', 2], ['Propulsion engineer', 1], ['Embedded/FBW engineer', 1], ['Mission ops engineer', 1], ['Founder/lead', 1]], ar: [['مهندس أنظمة فضاء', 2], ['مهندس دفع', 1], ['مهندس أنظمة مدمجة/طيران', 1], ['مهندس عمليات مهام', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur systèmes aéro', 2], ['Ingénieur propulsion', 1], ['Ingénieur embarqué/commande de vol', 1], ['Ingénieur opérations mission', 1], ['Fondateur/lead', 1]] },
    base: 92, axis: { technical: 0.44, capital: 0.36, regulatory: 0.16, market: 0.04 }
  },
  'agritech-foodtech': {
    label: { en: 'agritech and food tech', ar: 'تقنيات الزراعة والغذاء', fr: 'l\u2019agritech et la foodtech' },
    tech: { en: 'precision sensing, irrigation control and supply-chain analytics', ar: 'الاستشعار الدقيق والتحكم في الري وتحليلات سلسلة التوريد', fr: 'capteurs de précision, pilotage de l\u2019irrigation et analytics supply-chain' },
    audience: { en: 'farmers, cooperatives and food distributors', ar: 'الفلاحين والتعاونيات وموزّعي الغذاء', fr: 'agriculteurs, coopératives et distributeurs alimentaires' },
    sellers: { en: ['John Deere and CNH', 'Syngenta and Bayer', 'Cargill and Nestlé'], ar: ['John Deere و CNH', 'Syngenta و Bayer', 'Cargill و Nestlé'], fr: ['John Deere et CNH', 'Syngenta et Bayer', 'Cargill et Nestlé'] },
    build: { en: ['an affordable sensor-plus-app yield tool', 'a water or fertilizer optimization service', 'a farm-marketplace data layer'], ar: ['أداة إنتاجية مكوّنة من حساسات وتطبيق وبسعر معقول', 'خدمة لتحسين استهلاك المياه أو الأسمدة', 'طبقة بيانات لسوق المزارع'], fr: ['un outil de rendement capteur+app abordable', 'un service d\u2019optimisation eau/engrais', 'une couche de données marketplace agricole'] },
    roles: { en: [['Agronomist/data analyst', 1], ['IoT/embedded engineer', 2], ['Full-stack engineer', 1], ['Field/sales lead', 1], ['Founder/lead', 1]], ar: [['خبير زراعي/محلل بيانات', 1], ['مهندس إنترنت الأشياء/أنظمة مدمجة', 2], ['مهندس تطوير شامل', 1], ['مسؤول ميدان/مبيعات', 1], ['مؤسس/قائد', 1]], fr: [['Agronome/analyste données', 1], ['Ingénieur IoT/embarqué', 2], ['Ingénieur full-stack', 1], ['Responsable terrain/ventes', 1], ['Fondateur/lead', 1]] },
    base: 62, axis: { technical: 0.34, capital: 0.26, regulatory: 0.10, market: 0.30 }
  },
  medtech: {
    label: { en: 'medical devices', ar: 'الأجهزة الطبية', fr: 'les dispositifs médicaux' },
    tech: { en: 'sensor hardware, signal processing and regulatory-grade software', ar: 'أجهزة استشعار ومعالجة الإشارات وبرمجيات معتمدة تنظيمياً', fr: 'capteurs, traitement du signal et logiciel réglementaire' },
    audience: { en: 'hospitals, clinics and home-care patients', ar: 'المستشفيات والعيادات ومرضى الرعاية المنزلية', fr: 'hôpitaux, cliniques et patients à domicile' },
    sellers: { en: ['Medtronic and Abbott', 'Siemens Healthineers', 'Philips and GE HealthCare'], ar: ['Medtronic و Abbott', 'Siemens Healthineers', 'Philips و GE HealthCare'], fr: ['Medtronic et Abbott', 'Siemens Healthineers', 'Philips et GE HealthCare'] },
    build: { en: ['a diagnostic or monitoring device for one condition', 'a software-as-medical-device application', 'a connected care companion'], ar: ['جهاز تشخيص أو مراقبة لحالة واحدة', 'تطبيق برمجيات كجهاز طبي', 'مرافِق رعاية متصل'], fr: ['un dispositif de diagnostic ou suivi pour une pathologie', 'une application software-as-medical-device', 'un compagnon de soin connecté'] },
    roles: { en: [['Embedded/hardware engineer', 2], ['Signal-processing engineer', 1], ['Regulatory/QA lead', 1], ['Clinical advisor', 1], ['Founder/lead', 1]], ar: [['مهندس أنظمة مدمجة/عتاد', 2], ['مهندس معالجة إشارات', 1], ['مسؤول تنظيمي/جودة', 1], ['مستشار سريري', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur embarqué/hardware', 2], ['Ingénieur traitement du signal', 1], ['Responsable réglementaire/QA', 1], ['Conseiller clinique', 1], ['Fondateur/lead', 1]] },
    base: 83, axis: { technical: 0.34, capital: 0.26, regulatory: 0.36, market: 0.04 }
  },
  semiconductors: {
    label: { en: 'semiconductors', ar: 'أشباه الموصلات', fr: 'les semi-conducteurs' },
    tech: { en: 'chip design, fabrication processes and advanced packaging', ar: 'تصميم الرقائق وعمليات التصنيع والتغليف المتقدم', fr: 'conception de puces, procédés de fabrication et packaging avancé' },
    audience: { en: 'electronics OEMs and fabless design teams', ar: 'مصنّعي الإلكترونيات وفرق التصميم التجريبية', fr: 'fabricants d\u2019électronique et équipes fabless' },
    sellers: { en: ['TSMC and Samsung Foundry', 'Intel and GlobalFoundries', 'NVIDIA and Qualcomm'], ar: ['TSMC و Samsung Foundry', 'Intel و GlobalFoundries', 'NVIDIA و Qualcomm'], fr: ['TSMC et Samsung Foundry', 'Intel et GlobalFoundries', 'NVIDIA et Qualcomm'] },
    build: { en: ['a specialized analog or power chip for one application', 'a packaging or test service', 'EDA tooling for a design bottleneck'], ar: ['رقاقة تماثلية أو قدرة متخصصة لتطبيق واحد', 'خدمة تغليف أو اختبار', 'أدوات EDA لفجوة تصميم محدد'], fr: ['une puce analogique ou de puissance de niche', 'un service de packaging ou de test', 'un outil EDA sur un goulet de conception'] },
    roles: { en: [['ASIC/RTL design engineer', 2], ['Analog/PDK engineer', 1], ['Verification engineer', 1], ['Test engineer', 1], ['Founder/lead', 1]], ar: [['مهندس تصميم ASIC/RTL', 2], ['مهندس تماثلي/PDK', 1], ['مهندس تحقق', 1], ['مهندس اختبار', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur conception ASIC/RTL', 2], ['Ingénieur analogique/PDK', 1], ['Ingénieur vérification', 1], ['Ingénieur test', 1], ['Fondateur/lead', 1]] },
    base: 87, axis: { technical: 0.44, capital: 0.40, regulatory: 0.10, market: 0.06 }
  },
  cybersecurity: {
    label: { en: 'cybersecurity', ar: 'الأمن السيبراني', fr: 'la cybersécurité' },
    tech: { en: 'threat detection, identity and endpoint telemetry', ar: 'كشف التهديدات والهوية والقياس عن بعد لمحطات الطرفية', fr: 'détection de menaces, identité et télémétrie endpoint' },
    audience: { en: 'security teams and managed service providers', ar: 'فرق الأمن ومزوّدي الخدمات المدارة', fr: 'équipes sécurité et MSSP' },
    sellers: { en: ['CrowdStrike and Palo Alto', 'SentinelOne and Fortinet', 'Microsoft and Google'], ar: ['CrowdStrike و Palo Alto', 'SentinelOne و Fortinet', 'Microsoft و Google'], fr: ['CrowdStrike et Palo Alto', 'SentinelOne et Fortinet', 'Microsoft et Google'] },
    build: { en: ['a detection or response tool for one attack pattern', 'an attacker-email or identity protection layer', 'a compliance-automation product'], ar: ['أداة كشف أو استجابة لنمط هجوم واحد', 'طبقة حماية من التصيد أو الهوية', 'منتج لأتمتة الامتثال'], fr: ['un outil de détection/réponse pour un vecteur', 'une couche anti-hameçonnage ou identité', 'un produit d\u2019automatisation de la conformité'] },
    roles: { en: [['Security engineer', 2], ['Threat researcher', 1], ['Backend engineer', 1], ['Incident-response analyst', 1], ['Founder/lead', 1]], ar: [['مهندس أمن', 2], ['باحث تهديدات', 1], ['مهندس خلفية', 1], ['محلل استجابة للحوادث', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur sécurité', 2], ['Chercheur menaces', 1], ['Ingénieur backend', 1], ['Analyste réponse incident', 1], ['Fondateur/lead', 1]] },
    base: 72, axis: { technical: 0.40, capital: 0.24, regulatory: 0.20, market: 0.16 }
  },
  'manufacturing-3d': {
    label: { en: 'manufacturing and 3D', ar: 'التصنيع والطباعة ثلاثية الأبعاد', fr: 'la fabrication et la 3D' },
    tech: { en: 'production tooling, automation and additive manufacturing', ar: 'أدوات الإنتاج والأتمتة والتصنيع الإضافي', fr: 'outillage de production, automatisation et fabrication additive' },
    audience: { en: 'OEMs, workshops and supply-chain owners', ar: 'مصنّعي المعدات الأصلية والورش وملاك سلاسل التوريد', fr: 'équipementiers, ateliers et supply-chain' },
    sellers: { en: ['Siemens and Fanuc', 'DMG MORI and Trumpf', 'HP and Stratasys'], ar: ['Siemens و Fanuc', 'DMG MORI و Trumpf', 'HP و Stratasys'], fr: ['Siemens et Fanuc', 'DMG MORI et Trumpf', 'HP et Stratasys'] },
    build: { en: ['a production line for one consumer or industrial good', 'an automation cell for a repetitive process', 'a 3D-printing service for a vertical'], ar: ['خط إنتاج لسلعة استهلاكية أو صناعية واحدة', 'خلية أتمتة لعملية متكررة', 'خدمة طباعة ثلاثية الأبعاد لقطاع محدد'], fr: ['une ligne de production pour un produit ciblé', 'une cellule d\u2019automatisation d\u2019un process répétitif', 'un service d\u2019impression 3D verticalisé'] },
    roles: { en: [['Production/process engineer', 2], ['Automation engineer', 1], ['Mechanical designer', 1], ['Quality engineer', 1], ['Founder/lead', 1]], ar: [['مهندس إنتاج/عمليات', 2], ['مهندس أتمتة', 1], ['مصمم ميكانيكي', 1], ['مهندس جودة', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur production/procédés', 2], ['Ingénieur automatisation', 1], ['Designer mécanique', 1], ['Ingénieur qualité', 1], ['Fondateur/lead', 1]] },
    base: 66, axis: { technical: 0.36, capital: 0.34, regulatory: 0.10, market: 0.20 }
  },
  cleantech: {
    label: { en: 'clean technology', ar: 'التقنيات النظيفة', fr: 'la cleantech' },
    tech: { en: 'renewable generation, energy efficiency and recycling', ar: 'توليد متجدد وكفاءة الطاقة وإعادة التدوير', fr: 'production renouvelable, efficacité énergétique et recyclage' },
    audience: { en: 'utilities, municipalities and industrial sites', ar: 'شركات المرافق والبلديات والمواقع الصناعية', fr: 'utilities, collectivités et sites industriels' },
    sellers: { en: ['Siemens Energy and GE Vernova', 'Vestas and Orsted', 'Veolia and Fluence'], ar: ['Siemens Energy و GE Vernova', 'Vestas و Orsted', 'Veolia و Fluence'], fr: ['Siemens Energy et GE Vernova', 'Vestas et Orsted', 'Veolia et Fluence'] },
    build: { en: ['an efficiency retrofit with metered savings', 'a recycling or recovery process for one waste stream', 'a renewable O&M software suite'], ar: ['تحسين كفاءة مع قياس للوفورات', 'عملية إعادة تدوير أو استرداد لتدفق نفايات واحد', 'حزمة برمجيات لتشغيل وصيانة الطاقات المتجددة'], fr: ['un retrofit d\u2019efficacité à économies mesurées', 'un procédé de recyclage pour un flux de déchets', 'une suite logicielle O&M renouvelable'] },
    roles: { en: [['Energy engineer', 2], ['SCADA/controls engineer', 1], ['Data engineer', 1], ['Field/ops lead', 1], ['Founder/lead', 1]], ar: [['مهندس طاقة', 2], ['مهندس SCADA/تحكم', 1], ['مهندس بيانات', 1], ['مسؤول ميداني/تشغيل', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur énergie', 2], ['Ingénieur SCADA/contrôle', 1], ['Ingénieur données', 1], ['Chef terrain/ops', 1], ['Fondateur/lead', 1]] },
    base: 70, axis: { technical: 0.34, capital: 0.40, regulatory: 0.16, market: 0.10 }
  },
  'cloud-iot': {
    label: { en: 'cloud and IoT', ar: 'السحابة وإنترنت الأشياء', fr: 'le cloud et l\u2019IoT' },
    tech: { en: 'distributed systems, edge computing and device telemetry', ar: 'الأنظمة الموزعة والحوسبة الطرفية والقياس عن بعد للأجهزة', fr: 'systèmes distribués, edge computing et télémétrie device' },
    audience: { en: 'developers and operations teams', ar: 'المطوّرين وفرق التشغيل', fr: 'développeurs et équipes ops' },
    sellers: { en: ['AWS and Azure', 'Google Cloud and Cloudflare', 'Siemens and PTC'], ar: ['AWS و Azure', 'Google Cloud و Cloudflare', 'Siemens و PTC'], fr: ['AWS et Azure', 'Google Cloud et Cloudflare', 'Siemens et PTC'] },
    build: { en: ['a managed API or hosting service for a workflow', 'an edge-to-cloud telemetry framework', 'a vertical IoT dashboard product'], ar: ['خدمة API أو استضافة مدارة لسير عمل', 'إطار قياس من الحافة إلى السحابة', 'منتج لوحات تحكم إنترنت الأشياء لقطاع محدد'], fr: ['un service API ou hébergement pour un workflow', 'un framework télémétrie edge-to-cloud', 'un produit dashboard IoT vertical'] },
    roles: { en: [['Backend engineer', 2], ['Infra/devops engineer', 1], ['Edge/embedded engineer', 1], ['Frontend engineer', 1], ['Founder/lead', 1]], ar: [['مهندس خلفية', 2], ['مهندس بنية/عمليات', 1], ['مهندس حافة/أنظمة مدمجة', 1], ['مهندس واجهة', 1], ['مؤسس/قائد', 1]], fr: [['Ingénieur backend', 2], ['Ingénieur infra/devops', 1], ['Ingénieur edge/embarqué', 1], ['Ingénieur frontend', 1], ['Fondateur/lead', 1]] },
    base: 58, axis: { technical: 0.40, capital: 0.22, regulatory: 0.10, market: 0.28 }
  },
  'other-deep-tech': {
    label: { en: 'deep technology', ar: 'التقنيات العميقة', fr: 'la deep tech' },
    tech: { en: 'frontier science platforms and applied research pipelines', ar: 'منصات العلوم الحدودية وخطوط البحث التطبيقي', fr: 'plateformes scientifiques frontières et R&D appliquée' },
    audience: { en: 'industrial labs and public-sector innovators', ar: 'المختبرات الصناعية ومبتكّري القطاع العام', fr: 'labos industriels et innovateurs du secteur public' },
    sellers: { en: ['Google X and ARPA-funded labs', 'energy-major R&D arms', 'national accelerator consortiums'], ar: ['Google X ومختبرات ممولة من ARPA', 'أذرع البحث في شركات الطاقة الكبرى', 'اتحادات المسرعات الوطنية'], fr: ['Google X et labos financés par l\u2019ARPA', 'branches R&D des majors de l\u2019énergie', 'consortiums nationaux d\u2019accélérateurs'] },
    build: { en: ['a demonstrated prototype tied to one paying use-case', 'a technology-licensing entity around a patent', 'an applied research partnership with industry'], ar: ['نموذج أولي مبرهن مرتبط بحالة استخدام مدفوعة', 'كيان لترخيص التقنيات حول براءة اختراع', 'شراكة بحث تطبيقي مع الصناعة'], fr: ['un prototype prouvé sur un cas payant', 'une entité de licence autour d\u2019un brevet', 'un partenariat R&D appliqué avec l\u2019industrie'] },
    roles: { en: [['Principal scientist', 1], ['R&D engineer', 2], ['Prototype engineer', 1], ['Business/stats dev', 1], ['Founder/lead', 1]], ar: [['عالم رئيسي', 1], ['مهندس بحث وتطوير', 2], ['مهندس نماذج أولية', 1], ['مسؤول أعمال/تطوير', 1], ['مؤسس/قائد', 1]], fr: [['Scientifique principal', 1], ['Ingénieur R&D', 2], ['Ingénieur prototype', 1], ['Business development', 1], ['Fondateur/lead', 1]] },
    base: 81, axis: { technical: 0.44, capital: 0.30, regulatory: 0.10, market: 0.16 }
  }
};

const GLOBAL = {
  concepts: {
    en: [
      '{name} is a {country} company working in {label} — a space where {sellers} set the reference bar, so newcomers must own a narrower niche.',
      'The team behind {name} targets {audience} in {label} with a sharp wedge: {what} makes the product more focused than a generalist play.',
      '{name} operates in {label} and competes on focus. Its bet is that {what}, built for {audience}, beats a broad horizontal platform.',
      'Created to attack a specific pain point in {label}, {name} bets on {what} as the wedge {audience} will actually buy.',
      'In the crowded field of {label}, {name} differentiates by solving one problem end-to-end — {what} — instead of stacking horizontal features.'
    ],
    ar: [
      '{name} شركة من {country} تعمل في {label} — مجال يضع فيه {sellers} المرجعية، لذا يجب على الوافدين الجدد السيطرة على قطاع أضيق.',
      'يستهدف فريق {name} {audience} في {label} بمدخل حادّ: {what} يجعل المنتج أكثر تركيزاً من أي منتج عام.',
      '{name} ينشط في {label} ويتنافس بالتركيز. رهانه أن {what} المبنية لـ {audience} تتفوق على المنصات الأفقية الواسعة.',
      '{name} أُنشئ لمعالجة نقطة ألم محددة في {label}، ويعتمد {what} كمدخل سيجعله {audience} يشترون فعلاً.',
      'في ميدان {label} المزدحم، يميّز {name} نفسه بحل مشكلة واحدة من البداية للنهاية — {what} — بدل إضافة ميزات أفقية.'
    ],
    fr: [
      '{name} est une entreprise de {country} qui opère dans {label}, un espace où {sellers} donnent le la : les entrants doivent viser une niche plus étroite.',
      'L\u2019équipe de {name} cible {audience} dans {label} avec une entrée tranchée : {what} rend le produit plus concentré qu\u2019un acteur généraliste.',
      '{name} évolue dans {label} et joue la carte de la concentration. Son pari : {what}, conçu pour {audience}, bat une plateforme horizontale trop large.',
      'Créée pour un point de douleur précis dans {label}, {name} mise sur {what} comme la porte d\u2019entrée que {audience} achètera réellement.',
      'Dans le champ saturé de {label}, {name} se distingue en résolvant un problème de bout en bout — {what} — plutôt qu\u2019en empilant des fonctions horizontales.'
    ]
  },
  builds: {
    en: [
      'Start with a pilot for one customer, instrument usage, then productize. Keep the stack boring: {what}, running on proven infrastructure. Ship weekly and hold one metric — retention, safety or uptime — as the north star.',
      'The realistic path starts with long sales cycles: secure a reference customer at a fair price, then sell the outcome, not the tool. {what} gives the team a defensible demo.',
      'Build the MVP around {what}, launch in a thin local market first, collect reference data, and expand only once unit economics are clear. Avoid chasing enterprise buyers before product-market fit.'
    ],
    ar: [
      'ابدأ بتجربة في موقع عميل واحد مع قياس الاستخدام ثم حوّل إلى منتج. أبقِ التقنية بسيطة: {what} على بنية تحتية مجرّبة. أطلق أسبوعياً واجعل مقاس النجاح — الاحتفاظ أو السلامة أو الاستمرارية — البوصلة.',
      'المسار الواقعي يبدأ بدورات مبيعات طويلة: احصل على عميل مرجعي بسعر عادل ثم بع النتيجة لا الأداة. {what} يمنح الفريق عرضاً ملموساً.',
      'ابنِ النموذج الأولي حول {what}، أطلق في سوق محلية صغيرة أولاً، اجمع بيانات مرجعية، ووسّع فقط بعد وضوح اقتصاديات الوحدة. تجنّب مطاردة عملاء المؤسسات قبل ملاءمة المنتج للسوق.'
    ],
    fr: [
      'Commencez par un pilote chez un client, mesurez l\u2019usage, puis industrialisez. Gardez une stack simple : {what} sur une infrastructure éprouvée. Livrez chaque semaine et tenez une seule métrique — rétention, sécurité ou disponibilité — comme étoile polaire.',
      'Le chemin réaliste commence par de longs cycles de vente : décrochez un client de référence à un prix juste, puis vendez le résultat, pas l\u2019outil. {what} donne à l\u2019équipe une démo défendable.',
      'Construisez le MVP autour de {what}, lancez d\u2019abord sur un marché local étroit, collectez des données de référence, et ne vous étendez qu\u2019une fois l\u2019économie unitaire claire. Évitez les grands comptes avant le product-market fit.'
    ]
  },
  issues: {
    en: [
      'The moats here are trust and distribution, not technology: one failed deployment poisons the next ten sales, so reliability beats feature velocity. Many challengers also underestimate {reg} — the licensing and compliance layer.',
      '{name} competes against incumbents with deep integration and pricing power. The realistic risks are channel lock-in, long procurement cycles and a price war in the commodity tier.',
      'Hardware and data collection are the real bottlenecks: field failures are expensive, and without proprietary datasets the product converges to a commodity. Regulation ({reg}) raises the floor but also slows iteration.'
    ],
    ar: [
      'الخنادق هنا هي الثقة والتوزيع لا التقنية: فشل نشر واحد يسمم عمليات البيع العشر التالية، لذا الموثوقية تسبق سرعة الميزات. ويقلّل الوافدون الجدد من شأن {reg} — طبقة الترخيص والامتثال.',
      'يتنافس {name} ضد لاعبين راسخين يملكون تكاملاً عميقاً وقوة تسعيرية. المخاطر الواقعية: احتكار القنوات، دورات شراء طويلة، وحرب أسعار في الطبقة القياسية.',
      'العتاد وجمع البيانات هما العقدة الحقيقية: إخفاقات الميدان مكلفة، وبدون بيانات خاصة يتقارب المنتج نحو سلعة. التنظيم ({reg}) يرفع سقف الجودة لكنه يبطئ التكرار.'
    ],
    fr: [
      'Les vrais moats ici sont la confiance et la distribution, pas la technologie : un déploiement raté empoisonne les dix ventes suivantes, donc la fiabilité prime sur la vitesse. Beaucoup de challengers sous-estiment aussi {reg} — la couche licence et conformité.',
      '{name} affronte des acteurs établis dotés d\u2019intégration profonde et de pouvoir de prix. Risques réels : verrouillage des canaux, cycles d\u2019achat longs, guerre des prix sur le segment générique.',
      'Le matériel et la collecte de données sont les vrais goulots : les échecs terrain coûtent cher, et sans données propriétaires le produit devient un commodity. La régulation ({reg}) relève le plancher mais ralentit l\u2019itération.'
    ]
  },
  algeria: {
    en: [
      'Algeria offers a compressed first market: low salaries, a fast-digitizing base and weak local competitors. {name} could localize its core for the Algerian context instead of adapting a foreign product.',
      'For Algeria, the transferable piece is the process, not the product: a team that learns how to build {label} products can serve regional markets from Algiers at a fraction of the cost of Western hubs.',
      'The Algerian angle is affordability and context: {what}, simplified for local needs — plus the engineering-diploma pipeline — can turn {name}\u2019s playbook into a domestic or regional win.'
    ],
    ar: [
      'توفّر الجزائر سوقاً أولى عامرة: رواتب منخفضة، قاعدة متسارعة الرقمنة، ومنافسون محليون ضعفاء. يمكن لـ {name} توطين جوهره للسياق الجزائري بدل استيراد منتج أجنبي.',
      'بالنسبة للجزائر، الجزء القابل للنقل هو العملية لا المنتج: فريق يتعلم بناء منتجات {label} يمكن أن يخدم الأسواق الإقليمية من الجزائر العاصمة بجزء بسيط من تكلفة المراكز الغربية.',
      'الزاوية الجزائرية هي السعر والملاءمة: نسخة مبسطة من {what} مصممة للحاجات المحلية — مع سلسلة شهادات الهندسة — يمكن أن تحوّل نهج {name} إلى نجاح محلي أو إقليمي.'
    ],
    fr: [
      'L\u2019Algérie offre un premier marché compressé : salaires bas, base en cours de digitalisation rapide, concurrents locaux faibles. {name} pourrait localiser son cœur de produit pour le contexte algérien plutôt que d\u2019adapter un produit étranger.',
      'Pour l\u2019Algérie, le transférable, c\u2019est le processus, pas le produit : une équipe qui apprend à construire des produits {label} peut servir les marchés régionaux depuis Alger pour une fraction du coût des hubs occidentaux.',
      'L\u2019angle algérien, c\u2019est l\u2019accessibilité et le contexte : une version simplifiée de {what} adaptée aux besoins locaux — plus le vivier d\u2019ingénieurs diplômés — peut transformer le playbook de {name} en victoire domestique ou régionale.'
    ]
  },
  regulars: {
    en: ['industry licensing and certification', 'export and procurement rules', 'local safety and conformity standards'],
    ar: ['ترخيص الصناعة والاعتماد', 'قواعد التصدير والشراء', 'معايير السلامة والمطابقة المحلية'],
    fr: ['licences et certifications métier', 'règles d\u2019exportation et d\u2019achat', 'normes locales de sécurité et de conformité']
  }
};

function pickIndex(seed, arrLen) {
  return seed % arrLen;
}

function buildRecord(r, seed, domain, meta) {
  const year = r.year && r.year >= 1900 && r.year <= new Date().getFullYear() ? Number(r.year) : null;
  const wiki = `https://en.wikipedia.org/wiki/${encodeURIComponent(r.name.replace(/ /g, '_'))}`;
  const site = r.site || wiki;
  const prio = r.valuation || (!r.country || r.country === 'Unknown') ? 'A' : ['B', 'B', 'C', 'A'][seed % 4];
  const difficulty = Math.min(96, Math.max(20, Math.round(meta.base + ((seed >> 3) % 11) - 5)));
  const ax = meta.axis;
  const t = Math.round(difficulty * ax.technical);
  const c = Math.round(difficulty * ax.capital);
  const reg = Math.round(difficulty * ax.regulatory);
  const breakdown = { technical: t, capital: c, regulatory: reg, market: Math.max(2, 100 - t - c - reg) };
  const subDomain = ((r.industry || '').replace(/^[\s,|]+/, '').replace(/\|.*$/, '').replace(/[\s,|]+$/, '').trim().slice(0, 64)) || ['Vertical leader', 'Specialty product line', 'Core business unit', 'Flagship offering', 'Regional operations'][seed % 5];

  const countryEn = r.country === 'Unknown' ? meta.label.en : r.country;
  const countryAr = r.country === 'Unknown' ? meta.label.ar : r.country;
  const countryFr = r.country === 'Unknown' ? meta.label.fr : r.country;

  const buildEn = meta.build.en[seed % meta.build.en.length];
  const buildAr = meta.build.ar[seed % meta.build.ar.length];
  const buildFr = meta.build.fr[seed % meta.build.fr.length];

  const sellersEn = meta.sellers.en[seed % meta.sellers.en.length];
  const sellersAr = meta.sellers.ar[seed % meta.sellers.ar.length];
  const sellersFr = meta.sellers.fr[seed % meta.sellers.fr.length];

  const regEn = GLOBAL.regulars.en[(seed >>> 5) % 3];
  const regAr = GLOBAL.regulars.ar[(seed >>> 5) % 3];
  const regFr = GLOBAL.regulars.fr[(seed >>> 5) % 3];

  const enVars = { name: r.name, country: countryEn, label: meta.label.en, audience: meta.audience.en, sellers: sellersEn, reg: regEn };
  const arVars = { name: r.name, country: countryAr, label: meta.label.ar, audience: meta.audience.ar, sellers: sellersAr, reg: regAr };
  const frVars = { name: r.name, country: countryFr, label: meta.label.fr, audience: meta.audience.fr, sellers: sellersFr, reg: regFr };

  const conceptEn = fill(GLOBAL.concepts.en[seed % 5], { ...enVars, what: buildEn });
  const buildApproachEn = fill(GLOBAL.builds.en[seed % 3], { ...enVars, what: buildEn });
  const issuesEn = fill(GLOBAL.issues.en[(seed >>> 4) % 3], { ...enVars, what: buildEn });
  const algeriaEn = fill(GLOBAL.algeria.en[(seed >>> 6) % 3], { ...enVars, what: buildEn });

  const conceptAr = fill(GLOBAL.concepts.ar[seed % 5], { ...arVars, what: buildAr });
  const buildApproachAr = fill(GLOBAL.builds.ar[seed % 3], { ...arVars, what: buildAr });
  const issuesAr = fill(GLOBAL.issues.ar[(seed >>> 4) % 3], { ...arVars, what: buildAr });
  const algeriaAr = fill(GLOBAL.algeria.ar[(seed >>> 6) % 3], { ...arVars, what: buildAr });

  const conceptFr = fill(GLOBAL.concepts.fr[seed % 5], { ...frVars, what: buildFr });
  const buildApproachFr = fill(GLOBAL.builds.fr[seed % 3], { ...frVars, what: buildFr });
  const issuesFr = fill(GLOBAL.issues.fr[(seed >>> 4) % 3], { ...frVars, what: buildFr });
  const algeriaFr = fill(GLOBAL.algeria.fr[(seed >>> 6) % 3], { ...frVars, what: buildFr });

  return {
    name: r.name,
    country: r.country === 'Unknown' ? 'Unknown' : r.country,
    sub_domain: subDomain,
    short_description: conceptEn,
    technology: meta.tech.en,
    year_founded: year,
    official_site: site,
    source_url: wiki,
    why_relevant: algeriaEn,
    priority: prio,
    concept: conceptEn,
    main_sellers: [meta.sellers.en[0], meta.sellers.en[1], meta.sellers.en[2]],
    team_rec: meta.roles.en,
    build_approach: buildApproachEn,
    product_issues: issuesEn,
    algeria_value: algeriaEn,
    difficulty_score: difficulty,
    difficulty_breakdown: breakdown,
    source_tier: r.valuation || r.year ? 'S1' : 'S2',
    source_note: 'Profile compiled from Wikipedia list data; analysis fields are platform-generated.',
    translations: {
      ar: {
        short_description: conceptAr,
        technology: meta.tech.ar,
        why_relevant: algeriaAr,
        concept: conceptAr,
        main_sellers: [meta.sellers.ar[0], meta.sellers.ar[1], meta.sellers.ar[2]],
        team_rec: meta.roles.ar,
        build_approach: buildApproachAr,
        product_issues: issuesAr,
        algeria_value: algeriaAr
      },
      fr: {
        short_description: conceptFr,
        technology: meta.tech.fr,
        why_relevant: algeriaFr,
        concept: conceptFr,
        main_sellers: [meta.sellers.fr[0], meta.sellers.fr[1], meta.sellers.fr[2]],
        team_rec: meta.roles.fr,
        build_approach: buildApproachFr,
        product_issues: issuesFr,
        algeria_value: algeriaFr
      }
    }
  };
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'global', '_sources', 'final.json'), 'utf8'));
  const byDomain = {};
  for (const r of rows) {
    const slug = DOMAIN_META[r.domain] ? r.domain : 'other-deep-tech';
    (byDomain[slug] = byDomain[slug] || []).push(r);
  }
  let total = 0;
  for (const [domain, list] of Object.entries(byDomain)) {
    const out = list.map((r) => buildRecord(r, hashSeed(r.name), domain, DOMAIN_META[domain]));
    fs.writeFileSync(path.join(OUT_DIR, `${domain}.json`), JSON.stringify(out, null, 1));
    console.log(`${domain}: ${out.length}`);
    total += out.length;
  }
  console.log('TOTAL v2 rows:', total);
}

main();