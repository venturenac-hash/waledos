export interface FarePackageFeature {
  label: string;
  value: string;
}

export interface FarePackage {
  code: string; // FXB/FF code
  label: string; // Display label
  features: FarePackageFeature[];
  footnote?: string;
}

export interface FareFamily {
  id: "guest" | "business" | "first";
  title: string;
  accent: string;
  packages: FarePackage[];
  footnote?: string;
}

export const fareFamilies: FareFamily[] = [
  {
    id: "guest",
    title: "درجة الضيافة",
    accent: "from-emerald-500/50 to-emerald-400/30",
    packages: [
      {
        code: "GSAVER",
        label: "Guest Saver",
        features: [
          { label: "الأمتعة اليدوية", value: "1 قطعة × 7 كجم" },
          { label: "الأمتعة المسجلة", value: "غير مسموح" },
          { label: "اختيار المقعد (قياسي)", value: "تُطبق رسوم" },
          { label: "اختيار المقعد (مفضل)", value: "تُطبق رسوم" },
          { label: "أميال الفرسان", value: "0%" },
          { label: "الترقية بالأميال", value: "غير مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "غير مسموح" },
          { label: "أهلية الترقية النقدية", value: "غير مسموح" },
          { label: "الإلغاء", value: "غير مسموح" },
          { label: "تغيير الرحلة", value: "تُطبق رسوم" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
      {
        code: "GBASIC",
        label: "Guest Basic",
        features: [
          { label: "الأمتعة اليدوية", value: "1 قطعة × 7 كجم" },
          { label: "الأمتعة المسجلة", value: "1 قطعة × 23 كجم" },
          { label: "اختيار المقعد (قياسي)", value: "تُطبق رسوم" },
          { label: "اختيار المقعد (مفضل)", value: "تُطبق رسوم" },
          { label: "أميال الفرسان", value: "60%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "تُطبق رسوم" },
          { label: "تغيير الرحلة", value: "تُطبق رسوم *" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
      {
        code: "GSEMIFLEX",
        label: "Guest Semi Flex",
        features: [
          { label: "الأمتعة اليدوية", value: "1 قطعة × 7 كجم" },
          { label: "الأمتعة المسجلة", value: "2 قطعة × 23 كجم" },
          { label: "اختيار المقعد (قياسي)", value: "مجاناً **" },
          { label: "اختيار المقعد (مفضل)", value: "تُطبق رسوم **" },
          { label: "أميال الفرسان", value: "80%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "تُطبق رسوم" },
          { label: "تغيير الرحلة", value: "تُطبق رسوم" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
      {
        code: "GFLEX",
        label: "Guest Flex",
        features: [
          { label: "الأمتعة اليدوية", value: "1 قطعة × 7 كجم" },
          { label: "الأمتعة المسجلة", value: "2 قطعة × 23 كجم" },
          { label: "اختيار المقعد (قياسي)", value: "مجاناً **" },
          { label: "اختيار المقعد (مفضل)", value: "مجاناً **" },
          { label: "أميال الفرسان", value: "110%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "مجاناً" },
          { label: "تغيير الرحلة", value: "مجاناً" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
    ],
  },
  {
    id: "business",
    title: "درجة الأعمال",
    accent: "from-blue-500/50 to-cyan-400/30",
    packages: [
      {
        code: "BBASIC",
        label: "Business Basic",
        features: [
          { label: "الأمتعة اليدوية", value: "2 قطعة ***" },
          { label: "الأمتعة المسجلة", value: "1 قطعة × 32 كجم" },
          { label: "اختيار المقعد", value: "مجاناً" },
          { label: "أميال الفرسان", value: "175%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "دخول الصالات", value: "مسموح" },
          { label: "المسار السريع (Fast Track)", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "تُطبق رسوم" },
          { label: "تغيير الرحلة", value: "تُطبق رسوم" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
      {
        code: "BSEMIFLEX",
        label: "Business Semi Flex",
        features: [
          { label: "الأمتعة اليدوية", value: "2 قطعة ***" },
          { label: "الأمتعة المسجلة", value: "2 قطعة × 32 كجم" },
          { label: "اختيار المقعد", value: "مجاناً" },
          { label: "أميال الفرسان", value: "225%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "دخول الصالات", value: "مسموح" },
          { label: "المسار السريع (Fast Track)", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "تُطبق رسوم" },
          { label: "تغيير الرحلة", value: "تُطبق رسوم" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
      {
        code: "BFLEX",
        label: "Business Flex",
        features: [
          { label: "الأمتعة اليدوية", value: "2 قطعة ***" },
          { label: "الأمتعة المسجلة", value: "2 قطعة × 32 كجم" },
          { label: "اختيار المقعد", value: "مجاناً" },
          { label: "أميال الفرسان", value: "250%" },
          { label: "الترقية بالأميال", value: "مسموح" },
          { label: "دخول الصالات", value: "مسموح" },
          { label: "المسار السريع (Fast Track)", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "مسموح" },
          { label: "أهلية الترقية النقدية", value: "مسموح" },
          { label: "الإلغاء", value: "مجاناً" },
          { label: "تغيير الرحلة", value: "مجاناً" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
      },
    ],
    footnote:
      "وزن الأمتعة اليدوية: قطعة واحدة ≤ 12 كجم + حقيبة مستندات ≤ 9 كجم. وزن الأمتعة المسجلة لدرجة الأعمال: 32 كجم للقطعة.",
  },
  {
    id: "first",
    title: "الدرجة الأولى",
    accent: "from-amber-400/60 to-yellow-300/30",
    packages: [
      {
        code: "FIRSTFLEX",
        label: "First Flex",
        features: [
          { label: "الأمتعة اليدوية", value: "2 قطعة ***" },
          { label: "الأمتعة المسجلة", value: "2 قطعة × 32 كجم" },
          { label: "اختيار المقعد", value: "مجاناً" },
          { label: "أميال الفرسان", value: "350%" },
          { label: "الترقية بالأميال", value: "-" },
          { label: "دخول الصالات", value: "مسموح" },
          { label: "المسار السريع (Fast Track)", value: "مسموح" },
          { label: "أهلية المزايدة على الترقية", value: "-" },
          { label: "أهلية الترقية النقدية", value: "-" },
          { label: "الإلغاء", value: "مجاناً" },
          { label: "تغيير الرحلة", value: "مجاناً" },
          { label: "عدم الحضور (No-Show)", value: "تُطبق رسوم" },
        ],
        footnote:
          "وزن الأمتعة اليدوية: قطعة واحدة ≤ 12 كجم + حقيبة مستندات ≤ 9 كجم. وزن الأمتعة المسجلة للدرجة الأولى: 32 كجم للقطعة.",
      },
    ],
  },
];
