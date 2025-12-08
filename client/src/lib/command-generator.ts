import { format } from "date-fns";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  title: string; // MR, MS, MSTR, MISS
  hasInfant?: boolean;
  infantFirstName?: string;
  infantDob?: Date;
  dob?: Date; // For Child & SR DOCS
  nationality?: string; // Default SAU
  docType?: "I" | "P"; // I=Iqama/National ID, P=Passport
  docNumber?: string;
  docExpiry?: Date;
  gender?: "M" | "F";
  birthPlace?: string; // Default SAU
}

export interface FlightSegment {
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
export const generateANCommand = (segment: FlightSegment): string => {
  if (!segment.date || !segment.from || !segment.to) return "";
  const dateStr = format(segment.date, "ddMMM").toUpperCase();
  return `AN ${dateStr} ${segment.from} ${segment.to}`;
};

// Block 3: NM Command
export const generateNMCommand = (passengers: Passenger[]): string => {
  const lines: string[] = [];
  
  passengers.forEach((pax) => {
    // Base NM line: NM1 LAST/FIRST TITLE
    let line = `NM1 ${pax.lastName.toUpperCase()}/${pax.firstName.toUpperCase()} ${pax.title}`;
    
    // Infant logic: (INFALZUWAYDI/yasser/10JAN25)
    // "Infant: must render exactly as (INF{PARENT_LAST}/{INF_FIRST}/{DDMONYY}) with no extra spaces inside INF token"
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      const infDobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
      const infStr = `(INF${pax.lastName.toUpperCase()}/${pax.infantFirstName.toUpperCase()}/${infDobStr})`;
      line += ` ${infStr}`;
    }
    
    // Child logic: (CHD/10MAY22)
    // "Child: render as (CHD/{DDMONYY}) appended at end of that passenger's NM line."
    const type = getPaxType(pax.title);
    if (type === "CHD" && pax.dob) {
      const chdDobStr = format(pax.dob, "ddMMMyy").toUpperCase();
      line += ` (CHD/${chdDobStr})`;
    }
    
    lines.push(line);
  });
  
  return lines.join('\n');
};

// Block 4: Contact + Save + Docs
export const generateBlock4Commands = (contact: ContactInfo, passengers: Passenger[]): string => {
  const commands: string[] = [];
  
  // 1. Contact Info (APN/APM/APE)
  // "P list generation: automatically build P1,2,3 (comma-separated, no spaces)"
  const pRange = Array.from({ length: contact.paxCount }, (_, i) => i + 1).join(",");
  const paxStr = `/P${pRange}`;
  
  if (contact.mobile) {
    // "Phone number: input should accept either full +9665xxxxxxxx or 05xxxxxxxx — normalize to +9665xxxxxxxx"
    let cleanMobile = contact.mobile.replace(/\D/g, "");
    if (cleanMobile.startsWith("0")) cleanMobile = cleanMobile.substring(1);
    if (cleanMobile.startsWith("966")) cleanMobile = cleanMobile.substring(3);
    // Now cleanMobile should be 5xxxxxxxx
    
    const finalMobile = `966${cleanMobile}`;
    
    commands.push(`APN-SV/M+${finalMobile}/${contact.language}${paxStr}`);
    commands.push(`APM-SV/M+${finalMobile}/${contact.language}${paxStr}`);
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
  // "SR DOCS SV HK1-{IDTYPE}-SAU-{DOCNUMBER}-{GOVCODE}-{DOB}-{SEX}-{EXPIRY}-{LAST}/{FIRST}/P{index}"
  passengers.forEach((pax, index) => {
    const paxNum = index + 1;
    
    const generateDocsLine = (
      p: Passenger, 
      isInfant: boolean = false, 
      infName?: string, 
      infDob?: Date
    ) => {
      // Check required fields
      if (!p.docNumber || !p.dob || !p.docExpiry || !p.gender) return null;
      
      // Defaults
      const docType = p.docType || "I";
      const nat = (p.nationality || "SAU").toUpperCase();
      const birthPlace = (p.birthPlace || "SAU").toUpperCase(); // GOVCODE in template
      
      const docNum = p.docNumber;
      // Use infant DOB if infant, else pax DOB
      const targetDob = isInfant && infDob ? infDob : p.dob;
      const dobStr = format(targetDob, "ddMMMyy").toUpperCase();
      
      const gender = p.gender;
      const expiry = format(p.docExpiry, "ddMMMyy").toUpperCase();
      
      // Name logic
      const lastName = p.lastName.toUpperCase();
      const firstName = isInfant && infName ? infName.toUpperCase() : p.firstName.toUpperCase();
      
      const pRef = `/P${paxNum}`;
      
      return `SR DOCS SV HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dobStr}-${gender}-${expiry}-${lastName}/${firstName}${pRef}`;
    };

    // Adult/Child DOCS
    const mainDocs = generateDocsLine(pax);
    if (mainDocs) commands.push(mainDocs);
    
    // Infant DOCS
    // "If infant is tied to P2, ensure SR DOCS contains both P2 parent line and infant line ending /P2."
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob && mainDocs) {
       const infDocs = generateDocsLine(pax, true, pax.infantFirstName, pax.infantDob);
       if (infDocs) commands.push(infDocs);
    }
  });
  
  return commands.join('\n');
};

export const packages = [
  {
    name: "NSAVERE",
    title: "اقتصادي (Saver)",
    features: ["شنطة واحدة 23كجم", "لا يمكن الاسترجاع", "تغيير برسوم", "اختيار المقعد برسوم"]
  },
  {
    name: "NBASICE",
    title: "أساسي (Basic)",
    features: ["شنطة واحدة 23كجم", "استرجاع برسوم", "تغيير برسوم أقل", "اختيار المقعد برسوم"]
  },
  {
    name: "NSEMIFLEXE",
    title: "شبه مرن (Semi Flex)",
    features: ["شنطتين 23كجم", "استرجاع مجاني جزئياً", "تغيير مجاني", "اختيار مقعد عادي مجاناً"]
  },
  {
    name: "NFLEXE",
    title: "مرن (Flex)",
    features: ["شنطتين 23كجم", "استرجاع مجاني بالكامل", "تغيير مجاني", "جميع المقاعد مجانية"]
  }
];
