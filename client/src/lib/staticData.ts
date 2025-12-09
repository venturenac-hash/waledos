export interface CommandEntry {
  code: string;
  category?: string;
  title?: string;
  description?: string;
  details?: string;
  example?: string;
  keywords?: string[];
  related?: string[];
}

export interface ErrorEntry {
  error: string;
  meaning?: string;
  solution?: string[];
  relatedCommands?: string[];
  keywords?: string[];
}

export interface TopicEntry {
  id: string;
  title: string;
  summary?: string;
  content?: string[];
  relatedCommands?: string[];
}

export interface CouponStatusEntry {
  code: string;
  label: string;
  description?: string;
}

export interface NameTitleEntry {
  code: string;
  meaning: string;
  notes?: string;
}

export interface FareLetterEntry {
  code: string;
  title: string;
  description?: string;
}

export interface AirportEntry {
  iata_code: string;
  icao_code?: string;
  airport_name?: string;
  city?: string;
  country_code?: string;
  airport_type?: string;
}

export interface StaticDataBundle {
  commands: { ar: CommandEntry[]; en: CommandEntry[] };
  errors: { ar: ErrorEntry[]; en: ErrorEntry[] };
  topics: { ar: TopicEntry[]; en: TopicEntry[] };
  couponStatus: { ar: CouponStatusEntry[]; en: CouponStatusEntry[] };
  nameTitles: NameTitleEntry[];
  fareLetters: FareLetterEntry[];
  airports: AirportEntry[];
  iataCodes: string[];
}

const dataFiles = {
  commandsAr: "commands.ar.json",
  commandsEn: "commands.en.json",
  errorsAr: "errors.ar.json",
  errorsEn: "errors.en.json",
  topicsAr: "topics.ar.json",
  topicsEn: "topics.en.json",
  couponAr: "coupon-status.ar.json",
  couponEn: "coupon-status.en.json",
  nameTitles: "namesleater.en.json",
  fareLetters: "Clarificationofletters.ar.json",
  airports: "airports_comprehensive.json",
  iataCodes: "iata_codes_array.json",
} as const;

const resolveDataUrl = (file: string) => {
  // import.meta.env.BASE_URL includes the leading slash and sub-path on GitHub Pages (/waledos/)
  const base = import.meta.env.BASE_URL || "/";
  return `${base}data/${file}`;
};

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(resolveDataUrl(file));
  if (!res.ok) throw new Error(`Failed to load ${file}`);
  return res.json() as Promise<T>;
}

export async function loadStaticData(): Promise<StaticDataBundle> {
  const [
    commandsAr,
    commandsEn,
    errorsAr,
    errorsEn,
    topicsAr,
    topicsEn,
    couponAr,
    couponEn,
    nameTitles,
    fareLetters,
    airports,
    iataCodes,
  ] = await Promise.all([
    fetchJson<CommandEntry[]>(dataFiles.commandsAr),
    fetchJson<CommandEntry[]>(dataFiles.commandsEn),
    fetchJson<ErrorEntry[]>(dataFiles.errorsAr),
    fetchJson<ErrorEntry[]>(dataFiles.errorsEn),
    fetchJson<TopicEntry[]>(dataFiles.topicsAr),
    fetchJson<TopicEntry[]>(dataFiles.topicsEn),
    fetchJson<CouponStatusEntry[]>(dataFiles.couponAr),
    fetchJson<CouponStatusEntry[]>(dataFiles.couponEn),
    fetchJson<NameTitleEntry[]>(dataFiles.nameTitles),
    fetchJson<FareLetterEntry[]>(dataFiles.fareLetters),
    fetchJson<AirportEntry[]>(dataFiles.airports),
    fetchJson<string[]>(dataFiles.iataCodes),
  ]);

  return {
    commands: { ar: commandsAr, en: commandsEn },
    errors: { ar: errorsAr, en: errorsEn },
    topics: { ar: topicsAr, en: topicsEn },
    couponStatus: { ar: couponAr, en: couponEn },
    nameTitles,
    fareLetters,
    airports,
    iataCodes,
  };
}
