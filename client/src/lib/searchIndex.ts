import Fuse from "fuse.js";
import { CommandEntry, ErrorEntry, TopicEntry, AirportEntry } from "@/lib/staticData";

export type SearchItem =
  | { type: "command"; code: string; title?: string; description?: string; category?: string }
  | { type: "error"; code: string; title: string; description?: string }
  | { type: "topic"; code: string; title: string; description?: string }
  | { type: "airport"; code: string; title: string; description?: string };

export function buildSearchItems(
  commands: CommandEntry[],
  errors: ErrorEntry[],
  topics: TopicEntry[],
  airports: AirportEntry[]
): SearchItem[] {
  const cmdItems = commands.map<SearchItem>(c => ({
    type: "command",
    code: c.code,
    title: c.title,
    description: c.description || c.details,
    category: c.category,
  }));
  const errItems = errors.map<SearchItem>(e => ({
    type: "error",
    code: e.error,
    title: e.error,
    description: e.meaning,
  }));
  const topicItems = topics.map<SearchItem>(t => ({
    type: "topic",
    code: t.id,
    title: t.title,
    description: t.summary,
  }));
  const airportItems = airports.map<SearchItem>(a => ({
    type: "airport",
    code: a.iata_code,
    title: a.airport_name || a.city || "",
    description: `${a.city || ""} ${a.country_code || ""}`.trim(),
  }));
  return [...cmdItems, ...errItems, ...topicItems, ...airportItems];
}

export function buildFuse(items: SearchItem[]) {
  return new Fuse(items, {
    keys: [
      "code",
      "title",
      "description",
    ],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    useExtendedSearch: true,
  });
}
