import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStaticData } from "@/hooks/useStaticData";
import { CommandEntry, ErrorEntry, TopicEntry, CouponStatusEntry, AirportEntry, FareLetterEntry, NameTitleEntry } from "@/lib/staticData";
import { Loader2, AlertTriangle } from "lucide-react";

type DatasetKey = "commands" | "errors" | "topics" | "coupons" | "airports" | "fareLetters" | "nameTitles";

const typeLabels: Record<DatasetKey, string> = {
  commands: "الأوامر",
  errors: "الأخطاء",
  topics: "المواضيع",
  coupons: "حالات الكوبون",
  airports: "المطارات",
  fareLetters: "حروف الدرجات",
  nameTitles: "ألقاب الأسماء",
};

const MAX_RESULTS = 50;

function matchCommand(cmd: CommandEntry, q: string) {
  const haystack = [
    cmd.code,
    cmd.title,
    cmd.description,
    cmd.details,
    ...(cmd.keywords || []),
    ...(cmd.related || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchError(err: ErrorEntry, q: string) {
  const haystack = [err.error, err.meaning, ...(err.solution || []), ...(err.keywords || []), ...(err.relatedCommands || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchTopic(t: TopicEntry, q: string) {
  const haystack = [t.id, t.title, t.summary, ...(t.content || []), ...(t.relatedCommands || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchCoupon(c: CouponStatusEntry, q: string) {
  const haystack = [c.code, c.label, c.description].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function matchAirport(a: AirportEntry, q: string) {
  const haystack = [
    a.iata_code,
    a.icao_code,
    a.airport_name,
    a.city,
    a.country_code,
    a.airport_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchFareLetter(f: FareLetterEntry, q: string) {
  const haystack = [f.code, f.title, f.description].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function matchNameTitle(n: NameTitleEntry, q: string) {
  const haystack = [n.code, n.meaning, n.notes].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

export function DataExplorer() {
  const { loading, error, data } = useStaticData();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<DatasetKey>("commands");

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!data) return [];
    if (!q) return [];
    switch (active) {
      case "commands":
        return data.commands.ar.filter(c => matchCommand(c, q)).slice(0, MAX_RESULTS);
      case "errors":
        return data.errors.ar.filter(e => matchError(e, q)).slice(0, MAX_RESULTS);
      case "topics":
        return data.topics.ar.filter(t => matchTopic(t, q)).slice(0, MAX_RESULTS);
      case "coupons":
        return data.couponStatus.ar.filter(c => matchCoupon(c, q)).slice(0, MAX_RESULTS);
      case "airports":
        return data.airports.filter(a => matchAirport(a, q)).slice(0, MAX_RESULTS);
      case "fareLetters":
        return data.fareLetters.filter(f => matchFareLetter(f, q)).slice(0, MAX_RESULTS);
      case "nameTitles":
        return data.nameTitles.filter(n => matchNameTitle(n, q)).slice(0, MAX_RESULTS);
      default:
        return [];
    }
  }, [data, q, active]);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-yellow-400">مكتبة أوامر وأكواد (محلية)</CardTitle>
        <p className="text-sm text-white/60">يتم التحميل محلياً من ملفات JSON دون أي خادم.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-3">
            <Input
              placeholder="ابحث عن أمر، خطأ، مطار، حالة كوبون..."
              className="bg-black/20 border-white/10 text-white"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Tabs value={active} onValueChange={v => setActive(v as DatasetKey)}>
              <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <TabsTrigger key={key} value={key} className="text-[11px]">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تحميل ملفات البيانات...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            فشل تحميل البيانات: {error}
          </div>
        )}

        {!loading && !error && q && results.length === 0 && (
          <div className="text-white/60 text-sm">لا نتائج مطابقة.</div>
        )}

        {!loading && !error && results.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {results.map((item, idx) => {
                if (active === "commands") {
                  const c = item as CommandEntry;
                  return (
                    <div key={c.code + idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-600/30 text-white border-white/10">{c.code}</Badge>
                        <span className="text-sm text-white font-semibold">{c.title}</span>
                        {c.category && <span className="text-[11px] text-white/50">({c.category})</span>}
                      </div>
                      <div className="text-[12px] text-white/70 mt-1">{c.description || c.details}</div>
                      {c.example && <div className="text-[11px] text-white/50 mt-1">مثال: {c.example}</div>}
                    </div>
                  );
                }

                if (active === "errors") {
                  const e = item as ErrorEntry;
                  return (
                    <div key={e.error + idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-red-500/30 text-white border-white/10">Error</Badge>
                        <span className="text-sm text-white font-semibold">{e.error}</span>
                      </div>
                      <div className="text-[12px] text-white/70 mt-1">{e.meaning}</div>
                      {e.solution && (
                        <ul className="text-[11px] text-white/60 list-disc pl-4 mt-1 space-y-0.5">
                          {e.solution.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                }

                if (active === "topics") {
                  const t = item as TopicEntry;
                  return (
                    <div key={t.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-500/30 text-white border-white/10">Topic</Badge>
                        <span className="text-sm text-white font-semibold">{t.title}</span>
                      </div>
                      <div className="text-[12px] text-white/70 mt-1">{t.summary}</div>
                      {t.content && (
                        <ul className="text-[11px] text-white/60 list-disc pl-4 mt-1 space-y-0.5">
                          {t.content.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                }

                if (active === "coupons") {
                  const c = item as CouponStatusEntry;
                  return (
                    <div key={c.code} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-500/30 text-white border-white/10">{c.code}</Badge>
                        <div>
                          <div className="text-sm text-white font-semibold">{c.label}</div>
                          <div className="text-[12px] text-white/70">{c.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (active === "airports") {
                  const a = item as AirportEntry;
                  return (
                    <div key={a.iata_code + idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-cyan-500/30 text-white border-white/10">{a.iata_code}</Badge>
                        <span className="text-sm text-white font-semibold">{a.airport_name}</span>
                      </div>
                      <div className="text-[12px] text-white/70 mt-1">
                        {a.city} — {a.country_code} | نوع: {a.airport_type}
                      </div>
                    </div>
                  );
                }

                if (active === "fareLetters") {
                  const f = item as FareLetterEntry;
                  return (
                    <div key={f.code + idx} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                      <Badge variant="secondary" className="bg-purple-500/30 text-white border-white/10">{f.code}</Badge>
                      <div>
                        <div className="text-sm text-white font-semibold">{f.title}</div>
                        <div className="text-[12px] text-white/70">{f.description}</div>
                      </div>
                    </div>
                  );
                }

                if (active === "nameTitles") {
                  const n = item as NameTitleEntry;
                  return (
                    <div key={n.code + idx} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                      <Badge variant="secondary" className="bg-teal-500/30 text-white border-white/10">{n.code}</Badge>
                      <div>
                        <div className="text-sm text-white font-semibold">{n.meaning}</div>
                        {n.notes && <div className="text-[12px] text-white/70">{n.notes}</div>}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
