import { format } from "date-fns";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  title: string; // MR, MS, MSTR, MISS determines type
  hasInfant?: boolean;
  infantFirstName?: string;
  infantDob?: Date;
  dob?: Date; // For Child & SR DOCS
  nationality?: string; // Default SAU
  docType?: "I" | "P" | "N"; // I=Iqama/National ID, P=Passport
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
  const dateStr = format(segment.date, "ddMMM").toUpperCase();
  return `AN ${dateStr} ${segment.from} ${segment.to}`;
};

// Block 3: NM Command
export const generateNMCommand = (passengers: Passenger[]): string[] => {
  const commands: string[] = [];
  
  passengers.forEach((pax) => {
    // Base NM line: NM1 LAST/FIRST TITLE
    let command = `NM1 ${pax.lastName}/${pax.firstName} ${pax.title}`;
    
    // Infant logic: (INFALZUWAYDI/yasser/10JAN25)
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      const infDobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
      const infStr = `(INF${pax.lastName}/${pax.infantFirstName}/${infDobStr})`;
      command += ` ${infStr}`;
    }
    
    // Child logic: (CHD/10MAY22)
    const type = getPaxType(pax.title);
    if (type === "CHD" && pax.dob) {
      const chdDobStr = format(pax.dob, "ddMMMyy").toUpperCase();
      command += ` (CHD/${chdDobStr})`;
    }
    
    commands.push(command);
  });
  
  return commands;
};

// Block 4: Contact + Save + SR DOCS
export const generateBlock4Commands = (contact: ContactInfo, passengers: Passenger[]): string[] => {
  const commands: string[] = [];
  
  // 1. Contact Info (APN/APM/APE)
  const pRange = Array.from({ length: contact.paxCount }, (_, i) => i + 1).join(",");
  const paxStr = `/P${pRange}`;
  
  if (contact.mobile) {
    let cleanMobile = contact.mobile.replace(/\D/g, "");
    if (cleanMobile.startsWith("0")) cleanMobile = cleanMobile.substring(1);
    if (!cleanMobile.startsWith("966")) cleanMobile = "966" + cleanMobile;
    
    commands.push(`APN-SV/M+${cleanMobile}/${contact.language}${paxStr}`);
    commands.push(`APM-SV/M+${cleanMobile}/${contact.language}${paxStr}`);
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
      const birthPlace = (p.birthPlace || "SAU").toUpperCase();
      
      const docNum = p.docNumber;
      const dob = isInfant && infDob ? format(infDob, "ddMMMyy").toUpperCase() : format(p.dob, "ddMMMyy").toUpperCase();
      const gender = p.gender;
      const expiry = format(p.docExpiry, "ddMMMyy").toUpperCase();
      
      const name = isInfant && infName 
        ? `${p.lastName}/${infName}` 
        : `${p.lastName}/${p.firstName}`;
      
      const pRef = `/P${paxNum}`;
      
      return `SR DOCS SV HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dob}-${gender}-${expiry}-${name}${pRef}`;
    };

    // Adult/Child DOCS
    const mainDocs = generateDocsLine(pax);
    if (mainDocs) commands.push(mainDocs);
    
    // Infant DOCS (using parent's docs info but infant name/dob)
    // Note: In reality infant needs own docs, but per prompt instructions we use what we have.
    // If user didn't enter specific infant docs, we might skip or reuse.
    // For now, we assume the single doc entry per passenger covers the main pax.
    // If infant needs docs, we'd need separate inputs. 
    // Prompt says: "For each passenger (including infants) has internal document model"
    // But also "integrate docs into passengers".
    // I will assume for now we generate docs for the main passenger.
    // If infant docs are strictly required, we'd need extra fields.
    // Based on "repeat the passenger who has infant twice... once for passenger, once for infant with same P2",
    // I will generate a second line for infant if the main pax has docs, using infant DOB/Name.
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob && mainDocs) {
       const infDocs = generateDocsLine(pax, true, pax.infantFirstName, pax.infantDob);
       if (infDocs) commands.push(infDocs);
    }
  });
  
  return commands;
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
