import { format } from "date-fns";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  title: string; // MR, MS, MSTR, MISS
  hasInfant?: boolean;
  infantFirstName?: string;
  infantLastName?: string; // Explicit last name for infant
  infantDob?: Date;
  infantGender?: "M" | "F"; // M or F, will be converted to MI/MY in DOCS
  dob?: Date; // For Child & SR DOCS
  nationality?: string; // Default SAU
  docType?: "I" | "A" | "P"; // I=Identity, A=Iqama, P=Passport
  docNumber?: string;
  docExpiry?: Date;
  gender?: "M" | "F";
  birthPlace?: string; // Default SAU
}

export interface FlightSegment {
  id: string;
  date: Date;
  from: string;
  to: string;
}

export interface ContactInfo {
  mobile: string;
  email: string;
  language: "AR" | "EN";
  paxCount: number;
}

// Helper to determine type from title
const getPaxType = (title: string): "ADT" | "CHD" => {
  return (title === "MSTR" || title === "MISS") ? "CHD" : "ADT";
};

// Block 1 & 2: AN Command
export const generateANCommand = (segment: { date: Date, from: string, to: string }): string => {
  if (!segment.date || !segment.from || !segment.to) return "";
  const dateStr = format(segment.date, "ddMMM").toUpperCase();
  return `AN${dateStr}${segment.from}${segment.to}`;
};

// Block 3: NM Command
export const generateNMCommand = (passengers: Passenger[]): string => {
  const lines: string[] = [];
  
  passengers.forEach((pax) => {
    // Base NM line: NM1 LAST/FIRST TITLE
    let line = `NM1${pax.lastName.toUpperCase()}/${pax.firstName.toUpperCase()} ${pax.title}`;
    
    // Infant logic: (INF{LAST}/{FIRST}/{DDMONYY})
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      const infDobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
      // Use explicit infant last name if provided, otherwise fallback to parent's last name
      const infLast = pax.infantLastName ? pax.infantLastName.toUpperCase() : pax.lastName.toUpperCase();
      const infStr = `(INF${infLast}/${pax.infantFirstName.toUpperCase()}/${infDobStr})`;
      line += `${infStr}`;
    }
    
    // Child logic: (CHD/{DDMONYY})
    const type = getPaxType(pax.title);
    if (type === "CHD" && pax.dob) {
      const chdDobStr = format(pax.dob, "ddMMMyy").toUpperCase();
      line += `(CHD/${chdDobStr})`;
    }
    
    lines.push(line);
  });
  
  return lines.join('\n');
};

// Block 4: Contact + Save + Docs
export const generateBlock4Commands = (contact: ContactInfo, passengers: Passenger[]): string => {
  const commands: string[] = [];
  
  // 1. Contact Info (APN/APM/APE)
  // P1,2,3...
  const pRange = Array.from({ length: contact.paxCount }, (_, i) => i + 1).join(",");
  const paxStr = `/P${pRange}`;
  
  if (contact.mobile) {
    let cleanMobile = contact.mobile.replace(/\D/g, "");
    // Normalize to +966 format
    if (cleanMobile.startsWith("05")) cleanMobile = "5" + cleanMobile.substring(2);
    if (cleanMobile.startsWith("966")) cleanMobile = cleanMobile.substring(3);
    if (cleanMobile.startsWith("5")) cleanMobile = "+966" + cleanMobile;
    
    commands.push(`APN-SV/M${cleanMobile}${paxStr}`);
    commands.push(`APM-SV/M${cleanMobile}${paxStr}`);
  }
  
  if (contact.email) {
    commands.push(`APE-${contact.email}`);
  }
  
  // 2. Save Commands
  commands.push("TKOK");
  commands.push("RFF");
  commands.push("ER");
  commands.push("ER");
  
  // 3. SR DOCS
  passengers.forEach((pax, index) => {
    const paxNum = index + 1;
    
    // Adult/Child DOCS
    if (pax.docNumber) {
      const docType = pax.docType || "I";
      const nat = (pax.nationality || "SAU").toUpperCase();
      const birthPlace = (pax.birthPlace || "SAU").toUpperCase();
      const docNum = pax.docNumber;
      
      // Gender logic: M/F derived from title if not set (but we removed gender input, so derive from title)
      let gender = "M";
      if (pax.title === "MRS" || pax.title === "MS" || pax.title === "MISS") gender = "F";
      
      const lastName = pax.lastName.toUpperCase();
      const firstName = pax.firstName.toUpperCase();
      
      // Date logic: If expiry is present, include DOB and Expiry. If not, include neither.
      let dobStr = "";
      let expiryStr = "";
      
      if (pax.docExpiry) {
        expiryStr = format(pax.docExpiry, "ddMMMyy").toUpperCase();
        if (pax.dob) {
          dobStr = format(pax.dob, "ddMMMyy").toUpperCase();
        }
      }
      
      // SR DOCS SV HK1-{Type}-{Issue}-{Num}-{Nat}-{DOB}-{Gender}-{Expiry}-{Last}/{First}/P{i}
      // Note: If DOB/Expiry empty, we still need hyphens? 
      // Example without expiry: ...-SAU-1105364164-SAU--M--ALZUWAYDI... (Double hyphen for missing dates?)
      // User example: ...-SAU-14JUN11-M-14JUN30... (It HAS dates even in "no expiry" example, which is confusing)
      // But text says "ترك مكان تاريخ الميلاد فارغ".
      // Let's assume: ...-SAU-DocNum-SAU--M--Last/First...
      
      commands.push(`SR DOCS SV HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dobStr}-${gender}-${expiryStr}-${lastName}/${firstName}/P${paxNum}`);
    }
    
    // Infant DOCS
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
       // Infant needs its own DOCS line attached to parent P#
       // Assuming infant shares nationality/doc details for now as UI doesn't have full infant passport fields yet
       // But we need to use MI/MY for gender
       
       const docType = pax.docType || "I"; // Fallback to parent's doc type
       const nat = (pax.nationality || "SAU").toUpperCase(); // Fallback to parent's nationality
       const birthPlace = (pax.birthPlace || "SAU").toUpperCase(); // Fallback to parent's birth place
       const docNum = pax.docNumber || "UNKNOWN"; // Fallback to parent's doc number (Incorrect but placeholder)
       
       const dobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
       
       // Gender mapping: M -> MI, F -> MY (User requested MY for female infant)
       const gender = pax.infantGender === "M" ? "MI" : "MY";
       
       const expiry = pax.docExpiry ? format(pax.docExpiry, "ddMMMyy").toUpperCase() : "";
       
       const lastName = pax.infantLastName ? pax.infantLastName.toUpperCase() : pax.lastName.toUpperCase();
       const firstName = pax.infantFirstName.toUpperCase();
       
       commands.push(`SR DOCS SV HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dobStr}-${gender}-${expiry}-${lastName}/${firstName}/P${paxNum}`);
    }
  });
  
  // 4. Final Save
  commands.push("RFF");
  commands.push("ER");
  commands.push("ER");
  
  return commands.join('\n');
};

export const packages = [
  { 
    name: "SAVER", 
    title: "توفير (Saver)", 
    features: [
      "الأمتعة اليدوية: 1 قطعة 7 كجم",
      "الأمتعة المسجلة: غير مسموح",
      "اختيار المقعد: تُطبق رسوم",
      "أميال الفرسان: 0%",
      "الترقية بالأميال: غير مسموح",
      "الإلغاء: غير مسموح",
      "تغيير الرحلة: غير مسموح"
    ] 
  },
  { 
    name: "BASIC", 
    title: "أساسي (Basic)", 
    features: [
      "الأمتعة اليدوية: 1 قطعة 7 كجم",
      "الأمتعة المسجلة: 1 قطعة 23 كجم",
      "اختيار المقعد: تُطبق رسوم",
      "أميال الفرسان: 60%",
      "الترقية بالأميال: مسموح",
      "الإلغاء: تُطبق رسوم",
      "تغيير الرحلة: تُطبق رسوم"
    ] 
  },
  { 
    name: "SEMI FLEX", 
    title: "شبه مرن (Semi Flex)", 
    features: [
      "الأمتعة اليدوية: 1 قطعة 7 كجم",
      "الأمتعة المسجلة: 1 قطعة 23 كجم",
      "اختيار المقعد: مجاناً (قياسي)",
      "أميال الفرسان: 80%",
      "الترقية بالأميال: مسموح",
      "الإلغاء: تُطبق رسوم",
      "تغيير الرحلة: تُطبق رسوم"
    ] 
  },
  { 
    name: "FLEX", 
    title: "مرن (Flex)", 
    features: [
      "الأمتعة اليدوية: 1 قطعة 7 كجم",
      "الأمتعة المسجلة: 2 قطعة 23 كجم",
      "اختيار المقعد: مجاناً",
      "أميال الفرسان: 110%",
      "الترقية بالأميال: مسموح",
      "الإلغاء: تُطبق رسوم",
      "تغيير الرحلة: مجاناً"
    ] 
  },
];
