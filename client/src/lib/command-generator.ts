import { format } from "date-fns";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  type: "ADT" | "CHD" | "INF";
  title: string;
  hasInfant?: boolean;
  infantFirstName?: string;
  infantDob?: string; // DDMMMYY
}

export interface FlightSegment {
  type: "OW" | "RT";
  date: Date;
  returnDate?: Date;
  from: string;
  to: string;
}

export interface ContactInfo {
  mobile: string;
  email: string;
  language: "AR" | "EN";
  paxRef: string[]; // ["P1", "P2"] or ["ALL"]
}

export const generateANCommand = (segment: FlightSegment): string[] => {
  const commands: string[] = [];
  const dateStr = format(segment.date, "ddMMM").toUpperCase();
  
  commands.push(`AN ${dateStr} ${segment.from} ${segment.to}`);
  
  if (segment.type === "RT" && segment.returnDate) {
    const returnDateStr = format(segment.returnDate, "ddMMM").toUpperCase();
    commands.push(`AN ${returnDateStr} ${segment.to} ${segment.from}`);
  }
  
  return commands;
};

export const generateNMCommand = (passengers: Passenger[]): string[] => {
  const commands: string[] = [];
  
  passengers.forEach((pax, index) => {
    const paxNum = index + 1;
    let command = `NM1 ${pax.lastName}/${pax.firstName} ${pax.title}`;
    
    // Infant logic needs to be verified with specific Amadeus format for associated infant
    // Usually it's added to the adult name field or as a separate entry depending on airline
    // Based on requirements: "NM1 AHMED/ALGHAMDI MR"
    
    commands.push(command);
    
    if (pax.hasInfant && pax.infantFirstName && pax.infantDob) {
      // Infant command usually follows specific format, assuming standard Amadeus INF association
      // Example: NM1 LAST/FIRST NAME(INF/FIRST NAME/DDMMMYY)
      // But user requirement says: "Generate NM line with INF structure"
      // We will append it to the adult line if that's the standard, or create a new line if specified.
      // For now, following standard Amadeus association:
      // NM1 LAST/FIRST NAME (INF/INFANT FIRST/DDMMMYY)
      // However, user prompt implies a specific output. Let's stick to the simplest valid form or update based on feedback.
      // Re-reading prompt: "الأداة تولّد سطر NM كامل بتركيب INF الصحيح لنفس PAX"
      // We will modify the command to include infant
      const infStr = `(INF/${pax.infantFirstName}/${pax.infantDob})`;
      // Update the last pushed command
      commands[commands.length - 1] = `NM1 ${pax.lastName}/${pax.firstName} ${pax.title} ${infStr}`;
    }
  });
  
  return commands;
};

export const generateContactCommands = (info: ContactInfo): string[] => {
  const commands: string[] = [];
  const paxStr = info.paxRef.includes("ALL") ? "" : `/P${info.paxRef.join(",P")}`;
  const lang = info.language;
  
  // Mobile
  if (info.mobile) {
    // Ensure mobile starts with 966 if not present (assuming SA context)
    // User said: "input without 966, tool adds 966"
    const cleanMobile = info.mobile.replace(/^966/, "").replace(/^0+/, "");
    commands.push(`APN-SV/M+966${cleanMobile}/${lang}${paxStr}`);
  }
  
  // Email
  if (info.email) {
    commands.push(`APE-${info.email}${paxStr}`);
  }
  
  return commands;
};

export const generatePricingCommands = (fareType: string): string[] => {
  // Based on user prompt mapping
  // This is a simplified mapping, real world might be more complex
  switch (fareType) {
    case "Saver": return ["FXP/R,U"]; // Example codes, need verification from docs if provided
    case "Basic": return ["FXP"];
    case "Flex": return ["FXP/R,F"];
    default: return ["FXP"];
  }
};

export const finalizeBookingCommands = (): string[] => {
  return [
    "TKOK",
    "RFF",
    "ER",
    "ER"
  ];
};
