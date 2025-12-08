import { format } from "date-fns";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  type: "ADT" | "CHD" | "INF";
  title: string;
  hasInfant?: boolean;
  infantFirstName?: string;
  infantDob?: Date;
  dob?: Date; // For SR DOCS
  nationality?: string; // For SR DOCS
  docType?: "I" | "P" | "N"; // I=Iqama/National ID, P=Passport
  docNumber?: string;
  docExpiry?: Date;
  gender?: "M" | "F";
  birthPlace?: string;
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
    // Attached to the adult line, NO space between INF and Last Name
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      const infDobStr = format(pax.infantDob, "ddMMMyy").toUpperCase();
      // Assuming infant last name is same as adult for this format or we use adult last name as per example
      // Example: (INFALZUWAYDI/yasser/10JAN25) -> INF + AdultLastName + / + InfantFirstName + / + DOB
      const infStr = `(INF${pax.lastName}/${pax.infantFirstName}/${infDobStr})`;
      command += ` ${infStr}`;
    }
    
    // Child logic: (CHD/10MAY22)
    if (pax.type === "CHD" && pax.dob) {
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
  // P range logic: P1,2,3
  const pRange = Array.from({ length: contact.paxCount }, (_, i) => i + 1).join(",");
  const paxStr = `/P${pRange}`;
  
  // Mobile: APN-SV/M+966XXXXXXXXX/AR/P1,2,3
  if (contact.mobile) {
    // Ensure mobile starts with 966
    let cleanMobile = contact.mobile.replace(/\D/g, ""); // Remove non-digits
    if (cleanMobile.startsWith("0")) cleanMobile = cleanMobile.substring(1);
    if (!cleanMobile.startsWith("966")) cleanMobile = "966" + cleanMobile;
    
    commands.push(`APN-SV/M+${cleanMobile}/${contact.language}${paxStr}`);
    commands.push(`APM-SV/M+${cleanMobile}/${contact.language}${paxStr}`);
  }
  
  // Email: APE-email@domain.com
  if (contact.email) {
    commands.push(`APE-${contact.email}`);
  }
  
  // 2. Save Commands (Fixed Order)
  commands.push("TKOK");
  commands.push("RFF");
  commands.push("ER");
  commands.push("ER");
  
  // 3. SR DOCS
  // Format: SR DOCS SV HK1-I-SAU-1098373366-SAU-23APR92-M-12DEC30-ALZUWAYDI/WALEED/P1
  passengers.forEach((pax, index) => {
    const paxNum = index + 1;
    
    // Helper to generate DOCS line
    const generateDocsLine = (
      p: Passenger, 
      isInfant: boolean = false, 
      infName?: string, 
      infDob?: Date
    ) => {
      if (!p.docNumber || !p.nationality || !p.dob || !p.docExpiry || !p.gender || !p.birthPlace) return null;
      
      const docType = p.docType || "I";
      const nat = p.nationality.toUpperCase();
      const docNum = p.docNumber;
      const birthPlace = p.birthPlace.toUpperCase();
      const dob = isInfant && infDob ? format(infDob, "ddMMMyy").toUpperCase() : format(p.dob, "ddMMMyy").toUpperCase();
      const gender = p.gender;
      const expiry = format(p.docExpiry, "ddMMMyy").toUpperCase();
      // Name format in DOCS: LAST/FIRST
      const name = isInfant && infName 
        ? `${p.lastName}/${infName}` 
        : `${p.lastName}/${p.firstName}`;
      
      // P number is always the adult's P number
      const pRef = `/P${paxNum}`;
      
      // SR DOCS SV HK1-I-SAU-1098373366-SAU-23APR92-M-12DEC30-ALZUWAYDI/WALEED/P1
      // Note: Example shows "I" for type. We use p.docType.
      // Example structure: SR DOCS SV HK1-{TYPE}-{NAT}-{NUM}-{BIRTHPLACE}-{DOB}-{GENDER}-{EXPIRY}-{NAME}{PREF}
      return `SR DOCS SV HK1-${docType}-${nat}-${docNum}-${birthPlace}-${dob}-${gender}-${expiry}-${name}${pRef}`;
    };

    // Adult/Child DOCS
    const mainDocs = generateDocsLine(pax);
    if (mainDocs) commands.push(mainDocs);
    
    // Infant DOCS (if exists) - Duplicate entry with infant details but same P number
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      // For infant, we need infant specific docs if available, but usually it shares some info or has its own.
      // The requirement says: "repeat the passenger who has infant twice... once for passenger, once for infant with same P2"
      // And example: SR DOCS ... -ALZUWAYDI/yasser/P2 (Infant name)
      // We assume infant has their own passport/ID usually, but for this tool we might need extra fields for infant docs?
      // The prompt says: "Each passenger (including infants) has internal document model"
      // But in the UI section 4.1, infant only has First Name and DOB.
      // However, in 5.4 "Travel Data", it says "For each passenger (including infants)... fields: ID Type, Nationality..."
      // This implies we need full doc fields for Infant too.
      // We will need to update the Passenger interface to support Infant Docs or treat Infant as a separate entity in the Docs section UI.
      // For simplicity in this generator, I'll assume we might need to add infant doc fields to the UI. 
      // For now, I will generate a placeholder or use parent's data if missing (which is wrong but prevents crash), 
      // BUT strictly we should add fields. I will update the interface above to include infant doc fields or just use a separate object in the UI state.
      // Let's assume the UI will handle "Infant" as a "Passenger" in the context of DOCS input, 
      // OR we add specific infant doc fields to the parent.
      // Given the complexity, I'll add `infantDoc` object to Passenger interface in the next step or just use the same fields if the user enters them separately.
      // WAIT: The prompt says in 5.4: "For each passenger (including infants)..."
      // This implies the UI for DOCS should list infants as separate rows to fill.
      // I will handle this in the Component logic.
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
