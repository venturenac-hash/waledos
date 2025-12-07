export interface BookingStep {
  id: number;
  title: string;
  command: string;
  description: string;
  example: string;
}

export const bookingSteps: BookingStep[] = [
  {
    id: 1,
    title: "استعراض الإمكانية",
    command: "AN",
    description: "للبحث عن الرحلات المتاحة بين مدينتين في تاريخ معين.",
    example: "AN15OCTRUHJED"
  },
  {
    id: 2,
    title: "حجز المقاعد",
    command: "SS",
    description: "لحجز عدد معين من المقاعد على رحلة محددة.",
    example: "SS1Y1"
  },
  {
    id: 3,
    title: "إدخال الاسم",
    command: "NM",
    description: "لإدخال اسم المسافر (اللقب/الاسم الأول).",
    example: "NM1ALSAUD/MOHAMMED MR"
  },
  {
    id: 4,
    title: "معلومات الاتصال",
    command: "AP",
    description: "لإضافة رقم جوال المسافر للتواصل.",
    example: "AP 0500000000"
  },
  {
    id: 5,
    title: "حالة التذكرة",
    command: "TK",
    description: "لتحديد موعد إصدار التذكرة (OK للتأكيد الفوري).",
    example: "TK OK"
  },
  {
    id: 6,
    title: "حفظ الحجز",
    command: "RF",
    description: "لتوقيع الحجز باسم الموظف وحفظه.",
    example: "RF SAUDIA; ER"
  }
];

export const commonErrors = [
  {
    error: "NEED TICKETING ARGUMENTS",
    solution: "ترتيب الحجز TKOK",
    command: "TKOK"
  },
  {
    error: "NEED TEST",
    solution: "تثبيت التسعيرات FXP",
    command: "FXP"
  },
  {
    error: "FOR RJT:OLD FOR REQUIRED",
    solution: "إضافة طريقة الدفع القديمة بشكل صحيح",
    command: "FPO/..."
  },
  {
    error: "INVALID FORM OF PAYMENT",
    solution: "إضافة معلومات البطاقة بشكل صحيح",
    command: "FP CC..."
  },
  {
    error: "SIMULTANEOUS CHANGES",
    solution: "قم بعمل تجاهل (IG) ثم استرجاع (RT) وأعد المحاولة",
    command: "IG; RT"
  }
];

export const shortcuts = [
  { code: "RT", description: "استعراض الحجز برقم الحجز", example: "RT XXXXXX" },
  { code: "RH", description: "استعراض سجل الحجز (History)", example: "RHA" },
  { code: "IG", description: "تجاهل التغييرات", example: "IG" },
  { code: "MD", description: "تحريك الشاشة للأسفل", example: "MD" },
  { code: "MU", description: "تحريك الشاشة للأعلى", example: "MU" },
  { code: "ET", description: "إنهاء المعاملة وإغلاق الحجز", example: "ET" },
  { code: "XI", description: "إلغاء خط سير الرحلة بالكامل", example: "XI" }
];
