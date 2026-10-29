export interface College {
  id: string;
  fr: string;
  ar: string;
  wilaya: string;
}

/**
 * Algerian higher-education institutions used by the registration form.
 * Ordered alphabetically by French name.
 */
export const COLLEGES: College[] = [
  { id: 'univ-adrar', fr: 'Université Ahmed Draïa — Adrar', ar: 'جامعة أحمد دراية — أدرار', wilaya: 'Adrar' },
  { id: 'univ-chlef', fr: 'Université Hassiba Benbouali — Chlef', ar: 'جامعة حسيبة بن بوعلي — الشلف', wilaya: 'Chlef' },
  { id: 'univ-laghouat', fr: 'Université Amar Telidji — Laghouat', ar: 'جامعة عمار ثليجي — الأغواط', wilaya: 'Laghouat' },
  { id: 'univ-oum-el-bouaghi', fr: 'Université Larbi Ben M’hidi — Oum El Bouaghi', ar: 'جامعة العربي بن مهيدي — أم البواقي', wilaya: 'Oum El Bouaghi' },
  { id: 'univ-batna1', fr: 'Université Hadj Lakhdar — Batna 1', ar: 'جامعة الحاج لخضر — باتنة 1', wilaya: 'Batna' },
  { id: 'univ-batna2', fr: 'Université Mostefa Ben Boulaïd — Batna 2', ar: 'جامعة مصطفى بن بولعيد — باتنة 2', wilaya: 'Batna' },
  { id: 'univ-bejaia', fr: 'Université Abderrahmane Mira — Béjaïa', ar: 'جامعة عبد الرحمن ميرة — بجاية', wilaya: 'Béjaïa' },
  { id: 'univ-biskra', fr: 'Université Mohamed Khider — Biskra', ar: 'جامعة محمد خيضر — بسكرة', wilaya: 'Biskra' },
  { id: 'univ-bechar', fr: 'Université Tahri Mohamed — Béchar', ar: 'جامعة طاهري محمد — بشار', wilaya: 'Béchar' },
  { id: 'univ-blida1', fr: 'Université Saad Dahlab — Blida 1', ar: 'جامعة سعد دحلب — البليدة 1', wilaya: 'Blida' },
  { id: 'univ-blida2', fr: 'Université Lounici Ali — Blida 2', ar: 'جامعة لونيسي علي — البليدة 2', wilaya: 'Blida' },
  { id: 'ens-blida', fr: 'École Normale Supérieure — Blida', ar: 'المدرسة العليا للأساتذة — البليدة', wilaya: 'Blida' },
  { id: 'univ-bouira', fr: 'Université Akli Mohand Oulhadj — Bouira', ar: 'جامعة أكلي محند أولحاج — البويرة', wilaya: 'Bouira' },
  { id: 'univ-boumerdes', fr: 'Université M’Hamed Bougara — Boumerdès', ar: 'جامعة أمحمد بوڤرة — بومرداس', wilaya: 'Boumerdès' },
  { id: 'univ-tamanrasset', fr: 'Université de Tamanrasset', ar: 'جامعة تمنراست', wilaya: 'Tamanrasset' },
  { id: 'univ-tindouf', fr: 'Centre Universitaire de Tindouf', ar: 'المركز الجامعي بتندوف', wilaya: 'Tindouf' },
  { id: 'univ-timimoun', fr: 'Centre Universitaire de Timimoun', ar: 'المركز الجامعي بتيميمون', wilaya: 'Adrar' },
  { id: 'univ-illizi', fr: 'Centre Universitaire d’Illizi', ar: 'المركز الجامعي بإليزي', wilaya: 'Illizi' },
  { id: 'univ-tebessa', fr: 'Université Larbi Tébessi — Tébessa', ar: 'جامعة العربي التبسي — تبسة', wilaya: 'Tébessa' },
  { id: 'univ-tlemcen', fr: 'Université Abou Bekr Belkaïd — Tlemcen', ar: 'جامعة أبو بكر بلقايد — تلمسان', wilaya: 'Tlemcen' },
  { id: 'ens-tlemcen', fr: 'École Normale Supérieure — Tlemcen', ar: 'المدرسة العليا للأساتذة — تلمسان', wilaya: 'Tlemcen' },
  { id: 'univ-tiaret', fr: 'Université Ibn Khaldoun — Tiaret', ar: 'جامعة ابن خلدون — تيارت', wilaya: 'Tiaret' },
  { id: 'univ-tizi-ouzou', fr: 'Université Mouloud Mammeri — Tizi Ouzou', ar: 'جامعة مولود معمري — تيزي وزو', wilaya: 'Tizi Ouzou' },
  { id: 'univ-alger1', fr: 'Université d’Alger 1 Benyoucef Benkhedda', ar: 'جامعة الجزائر 1 بن يوسف بن خدة', wilaya: 'Alger' },
  { id: 'univ-alger2', fr: 'Université d’Alger 2 Abderrahmane Mira', ar: 'جامعة الجزائر 2 عبد الرحمن ميرة', wilaya: 'Alger' },
  { id: 'univ-alger3', fr: 'Université d’Alger 3', ar: 'جامعة الجزائر 3', wilaya: 'Alger' },
  { id: 'usthb', fr: 'Université des Sciences et de la Technologie Houari Boumediene — USTHB', ar: 'جامعة هواري بومدين للعلوم والتكنولوجيا', wilaya: 'Alger' },
  { id: 'enp', fr: 'École Nationale Polytechnique — ENP', ar: 'المدرسة الوطنية المتعددة التقنيات', wilaya: 'Alger' },
  { id: 'esi', fr: 'École Supérieure d’Informatique — ESI', ar: 'المدرسة العليا للإعلام الآلي', wilaya: 'Alger' },
  { id: 'ens-kouba', fr: 'École Normale Supérieure de Kouba', ar: 'المدرسة العليا للأساتذة بالقبة', wilaya: 'Alger' },
  { id: 'ensa', fr: 'École Nationale Supérieure d’Architecture — ENSA', ar: 'المدرسة الوطنية العليا للهندسة المعمارية', wilaya: 'Alger' },
  { id: 'ensv', fr: 'École Nationale Supérieure Vétérinaire — ENSV', ar: 'المدرسة الوطنية العليا للبيطرة', wilaya: 'Alger' },
  { id: 'enssmal', fr: 'École Nationale Supérieure des Sciences de la Mer — ENSSMAL', ar: 'المدرسة الوطنية العليا لعلوم البحر وتهيئة الساحل', wilaya: 'Alger' },
  { id: 'hec', fr: 'École des Hautes Études Commerciales — HEC Alger', ar: 'المدرسة العليا للتجارة', wilaya: 'Alger' },
  { id: 'essca', fr: 'École Supérieure des Sciences Commerciales d’Alger — ESCA', ar: 'المدرسة العليا للعلوم التجارية بالجزائر', wilaya: 'Alger' },
  { id: 'enssea', fr: 'École Nationale Supérieure de Statistique et d’Économie Appliquée — ENSSEA', ar: 'المدرسة الوطنية العليا للإحصاء والاقتصاد التطبيقي', wilaya: 'Alger' },
  { id: 'ensam', fr: 'École Nationale Supérieure des Arts et Métiers — ENSAM', ar: 'المدرسة الوطنية العليا للفنون والحرف', wilaya: 'Alger' },
  { id: 'esti', fr: 'École Supérieure de Technologie Industrielle — ESTI', ar: 'المدرسة العليا للتكنولوجيا الصناعية', wilaya: 'Alger' },
  { id: 'essa', fr: 'École Supérieure des Sciences Appliquées — ESSA', ar: 'المدرسة العليا للعلوم التطبيقية', wilaya: 'Alger' },
  { id: 'ina', fr: 'Institut National Agronomique — INA', ar: 'المعهد الوطني الزراعي', wilaya: 'Alger' },
  { id: 'univ-djelfa', fr: 'Université Ziane Achour — Djelfa', ar: 'جامعة زيان عاشور — الجلفة', wilaya: 'Djelfa' },
  { id: 'univ-jijel', fr: 'Université Mohammed Seddik Benyahia — Jijel', ar: 'جامعة محمد الصديق بن يحيى — جيجل', wilaya: 'Jijel' },
  { id: 'univ-setif1', fr: 'Université Ferhat Abbas — Sétif 1', ar: 'جامعة فرحات عباس — سطيف 1', wilaya: 'Sétif' },
  { id: 'univ-setif2', fr: 'Université Mohamed Lamine Debaghine — Sétif 2', ar: 'جامعة محمد لمين دباغين — سطيف 2', wilaya: 'Sétif' },
  { id: 'ens-setif', fr: 'École Normale Supérieure — Sétif', ar: 'المدرسة العليا للأساتذة — سطيف', wilaya: 'Sétif' },
  { id: 'univ-saida', fr: 'Université Dr Moulay Tahar — Saïda', ar: 'جامعة الدكتور مولاي الطاهر — سعيدة', wilaya: 'Saïda' },
  { id: 'univ-skikda', fr: 'Université 20 Août 1955 — Skikda', ar: 'جامعة 20 أوت 1955 — سكيكدة', wilaya: 'Skikda' },
  { id: 'univ-sba', fr: 'Université Djillali Liabes — Sidi Bel Abbès', ar: 'جامعة جيلالي ليابس — سيدي بلعباس', wilaya: 'Sidi Bel Abbès' },
  { id: 'univ-annaba', fr: 'Université Badji Mokhtar — Annaba', ar: 'جامعة باجي مختار — عنابة', wilaya: 'Annaba' },
  { id: 'ens-annaba', fr: 'École Normale Supérieure — Annaba', ar: 'المدرسة العليا للأساتذة — عنابة', wilaya: 'Annaba' },
  { id: 'univ-guelma', fr: 'Université 8 Mai 1945 — Guelma', ar: 'جامعة 8 ماي 1945 — قالمة', wilaya: 'Guelma' },
  { id: 'univ-constantine1', fr: 'Université Frères Mentouri — Constantine 1', ar: 'جامعة الإخوة منتوري — قسنطينة 1', wilaya: 'Constantine' },
  { id: 'univ-constantine2', fr: 'Université Abdelhamid Mehri — Constantine 2', ar: 'جامعة عبد الحميد مهري — قسنطينة 2', wilaya: 'Constantine' },
  { id: 'univ-constantine3', fr: 'Université Salah Boubnider — Constantine 3', ar: 'جامعة صالح بوبنيدر — قسنطينة 3', wilaya: 'Constantine' },
  { id: 'ens-constantine', fr: 'École Normale Supérieure — Constantine', ar: 'المدرسة العليا للأساتذة — قسنطينة', wilaya: 'Constantine' },
  { id: 'univ-medea', fr: 'Université Yahia Fares — Médéa', ar: 'جامعة يحيى فارس — المدية', wilaya: 'Médéa' },
  { id: 'univ-mostaganem', fr: 'Université Abdelhamid Ibn Badis — Mostaganem', ar: 'جامعة عبد الحميد بن باديس — مستغانم', wilaya: 'Mostaganem' },
  { id: 'univ-msila', fr: 'Université Mohamed Boudiaf — M’Sila', ar: 'جامعة محمد بوضياف — المسيلة', wilaya: 'M’Sila' },
  { id: 'univ-mascara', fr: 'Université Mustapha Stambouli — Mascara', ar: 'جامعة مصطفى اسطمبولي — معسكر', wilaya: 'Mascara' },
  { id: 'univ-ouargla', fr: 'Université Kasdi Merbah — Ouargla', ar: 'جامعة قاصدي مرباح — ورقلة', wilaya: 'Ouargla' },
  { id: 'univ-oran1', fr: 'Université Oran 1 Ahmed Ben Bella', ar: 'جامعة وهران 1 أحمد بن بلة', wilaya: 'Oran' },
  { id: 'univ-oran2', fr: 'Université Oran 2 Mohamed Ben Ahmed', ar: 'جامعة وهران 2 محمد بن أحمد', wilaya: 'Oran' },
  { id: 'usto', fr: 'Université des Sciences et de la Technologie d’Oran — USTO-MB', ar: 'جامعة العلوم والتكنولوجيا محمد بوضياف — وهران', wilaya: 'Oran' },
  { id: 'ens-oran', fr: 'École Normale Supérieure — Oran', ar: 'المدرسة العليا للأساتذة — وهران', wilaya: 'Oran' },
  { id: 'univ-bayadh', fr: 'Université d’El Bayadh', ar: 'جامعة البيض', wilaya: 'El Bayadh' },
  { id: 'univ-illizi2', fr: 'Centre Universitaire de Barika', ar: 'المركز الجامعي ببريكة', wilaya: 'Batna' },
  { id: 'univ-bousaada', fr: 'Centre Universitaire de Bou Saâda', ar: 'المركز الجامعي ببوسعادة', wilaya: 'M’Sila' },
  { id: 'univ-aflou', fr: 'Centre Universitaire d’Aflou', ar: 'المركز الجامعي بأفلو', wilaya: 'Laghouat' },
  { id: 'univ-maghnia', fr: 'Centre Universitaire de Maghnia', ar: 'المركز الجامعي بمغنية', wilaya: 'Tlemcen' },
  { id: 'univ-relizane', fr: 'Université Ahmed Zabana — Relizane', ar: 'جامعة أحمد زبانة — غليزان', wilaya: 'Relizane' },
  { id: 'univ-ain-temouchent', fr: 'Université Belhadj Bouchaib — Aïn Témouchent', ar: 'جامعة بلحاج بوشعيب — عين تموشنت', wilaya: 'Aïn Témouchent' },
  { id: 'univ-tipaza', fr: 'Université de Tipaza', ar: 'جامعة تيبازة', wilaya: 'Tipaza' },
  { id: 'univ-bba', fr: 'Université Mohamed El Bachir El Ibrahimi — Bordj Bou Arréridj', ar: 'جامعة محمد البشير الإبراهيمي — برج بوعريريج', wilaya: 'Bordj Bou Arréridj' },
  { id: 'univ-boumerdes2', fr: 'Université de Boumerdès — Faculté des Sciences', ar: 'جامعة بومرداس — كلية العلوم', wilaya: 'Boumerdès' },
  { id: 'univ-khemis', fr: 'Université Djilali Bounaama — Khemis Miliana', ar: 'جامعة جيلالي بونعامة — خميس مليانة', wilaya: 'Aïn Defla' },
  { id: 'univ-soukahras', fr: 'Université Mohamed Chérif Messaadia — Souk Ahras', ar: 'جامعة محمد الشريف مساعدية — سوق أهراس', wilaya: 'Souk Ahras' },
  { id: 'univ-khenchela', fr: 'Université Abbas Laghrour — Khenchela', ar: 'جامعة عباس لغرور — خنشلة', wilaya: 'Khenchela' },
  { id: 'univ-mila', fr: 'Université Abdelhafid Boussouf — Mila', ar: 'جامعة عبد الحفيظ بوالصوف — ميلة', wilaya: 'Mila' },
  { id: 'univ-naama', fr: 'Université de Naâma', ar: 'جامعة النعامة', wilaya: 'Naâma' },
  { id: 'univ-eloued', fr: 'Université Hamma Lakhdar — El Oued', ar: 'جامعة حمة لخضر — الوادي', wilaya: 'El Oued' },
  { id: 'univ-ghardaia', fr: 'Université de Ghardaïa', ar: 'جامعة غرداية', wilaya: 'Ghardaïa' },
  { id: 'univ-batna-tech', fr: 'Institut des Sciences et Techniques Appliquées — Batna', ar: 'معهد العلوم والتقنيات التطبيقية — باتنة', wilaya: 'Batna' },
  { id: 'ens-laghouat', fr: 'École Normale Supérieure — Laghouat', ar: 'المدرسة العليا للأساتذة — الأغواط', wilaya: 'Laghouat' },
  { id: 'ens-bousaada', fr: 'École Normale Supérieure — Bou Saâda', ar: 'المدرسة العليا للأساتذة — بوسعادة', wilaya: 'M’Sila' },
  { id: 'other', fr: 'Autre établissement / Centre de recherche', ar: 'مؤسسة أخرى / مركز بحث', wilaya: '—' }
];

const byId = new Map(COLLEGES.map((college) => [college.id, college]));

export function getCollege(id: string | null | undefined): College | undefined {
  return id ? byId.get(id) : undefined;
}

export function collegeLabel(id: string | null | undefined, locale: string): string {
  const college = getCollege(id);
  if (!college) return id ?? '';
  return locale === 'ar' ? college.ar : college.fr;
}
