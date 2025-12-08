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
  docType?: "I" | "P"; // I=Iqama/National ID, P=Passport
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
  const pRange = Array.from({ length: contact.paxCount }, (_, i) => i + 1).join(",");
  const paxStr = `/P${pRange}`;
  
  if (contact.mobile) {
    let cleanMobile = contact.mobile.replace(/\D/g, "");
    if (cleanMobile.startsWith("0")) cleanMobile = cleanMobile.substring(1);
    if (cleanMobile.startsWith("966")) cleanMobile = cleanMobile.substring(3);
    
    const finalMobile = `966${cleanMobile}`;
    
    commands.push(`APN-M+${finalMobile}/P1`);
    commands.push(`APM-${cleanMobile}/P1`); // APM usually without +
  }
  
  if (contact.email) {
    commands.push(`APE-${contact.email}/P1`);
  }
  
  // 2. Save Commands
  commands.push("TKOK");
  commands.push("RFP1");
  commands.push("ER");
  commands.push("ER");
  
  // 3. SR DOCS
  passengers.forEach((pax, index) => {
    const paxNum = index + 1;
    
    // Adult/Child DOCS
    if (pax.docNumber && pax.dob && pax.docExpiry && pax.gender) {
      const docType = pax.docType || "I";
      const nat = (pax.nationality || "SAU").toUpperCase();
      const birthPlace = (pax.birthPlace || "SAU").toUpperCase();
      const docNum = pax.docNumber;
      const dobStr = format(pax.dob, "ddMMMyy").toUpperCase();
      const gender = pax.gender; // M or F
      const expiry = format(pax.docExpiry, "ddMMMyy").toUpperCase();
      const lastName = pax.lastName.toUpperCase();
      const firstName = pax.firstName.toUpperCase();
      
      commands.push(`SR DOCS YY HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dobStr}-${gender}-${expiry}-${lastName}/${firstName}/P${paxNum}`);
    }
    
    // Infant DOCS
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob && pax.infantGender) {
       // Infant needs its own DOCS line attached to parent P#
       // Assuming infant shares nationality/doc details for now as UI doesn't have full infant passport fields yet
       // But we need to use MI/MY for gender
       
       const docType = pax.docType || "I"; // Fallback to parent's doc type
       const nat = (pax.nationality || "SAU").toUpperCase(); // Fallback to parent's nationality
       const birthPlace = (pax.birthPlace || "SAU").toUpperCase(); // Fallback to parent's birth place
       const docNum = pax.docNumber || "UNKNOWN"; // Fallback to parent's doc number (Incorrect but placeholder)
       // Ideally we need infant doc number input. For now using parent's to generate valid format.
       
       const dobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
       
       // Gender mapping: M -> MI, F -> MY
       const gender = pax.infantGender === "M" ? "MI" : "MY";
       
       const expiry = pax.docExpiry ? format(pax.docExpiry, "ddMMMyy").toUpperCase() : "UNKNOWN";
       
       const lastName = pax.infantLastName ? pax.infantLastName.toUpperCase() : pax.lastName.toUpperCase();
       const firstName = pax.infantFirstName.toUpperCase();
       
       commands.push(`SR DOCS YY HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dobStr}-${gender}-${expiry}-${lastName}/${firstName}/P${paxNum}`);
    }
  });
  
  return commands.join('\n');
};

export const packages = [
  { name: "SAVER", title: "توفير (Saver)", features: ["بدون أمتعة", "تغيير برسوم"] },
  { name: "BASIC", title: "أساسي (Basic)", features: ["حقيبة 23كجم", "تغيير برسوم"] },
  { name: "FLEX", title: "مرن (Flex)", features: ["حقيبتين 23كجم", "تغيير مجاني"] },
  { name: "PREMIUM", title: "تميز (Premium)", features: ["وزن إضافي", "مقاعد مميزة"] },
];
