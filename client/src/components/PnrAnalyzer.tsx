import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStaticData } from "@/hooks/useStaticData";
import { AirportEntry, CouponStatusEntry } from "@/lib/staticData";
import { AlertCircle, Loader2 } from "lucide-react";

interface AnalyzerResult {
  tickets: string[];
  names: string[];
  airports: AirportEntry[];
  couponStatuses: CouponStatusEntry[];
}

const ticketRegex = /\b\d{3}[-\s]?\d{10}\b/g; // 13-digit ticket (e.g., 0651234567890 or 065-1234567890)
const nameRegex = /\b([A-Z]{2,})\/([A-Z]{2,}).*(MR|MRS|MS|MISS|MSTR)\b/g;
const couponRegex = /\b(?:COUPON|CPN|CP)?\s*\d?\s*([OAFEVSZUR])\b/gi;

export function PnrAnalyzer() {
  const { loading, error, data } = useStaticData();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalyzerResult | null>(null);

  const iataCodes = useMemo(() => new Set((data?.iataCodes || []).map(c => c.toUpperCase())), [data]);
  const airportMap = useMemo(() => {
    const map = new Map<string, AirportEntry>();
    (data?.airports || []).forEach(a => {
      map.set((a.iata_code || "").toUpperCase(), a);
    });
    return map;
  }, [data]);

  const couponMap = useMemo(() => {
    const map = new Map<string, CouponStatusEntry>();
    (data?.couponStatus.ar || []).forEach(c => map.set(c.code.toUpperCase(), c));
    return map;
  }, [data]);

  const analyze = () => {
    const text = input.toUpperCase();

    // Tickets
    const tickets = Array.from(new Set(Array.from(text.matchAll(ticketRegex)).map(m => m[0].replace(/\s|-/g, ""))));

    // Names
    const names = Array.from(new Set(Array.from(text.matchAll(nameRegex)).map(m => `${m[1]}/${m[2]} ${m[3]}`)));

    // Airports: scan for any IATA code present as whole word
    const airportsFound = new Set<string>();
    if (iataCodes.size) {
      const words = text.split(/[^A-Z]/).filter(Boolean);
      words.forEach(w => {
        if (w.length === 3 && iataCodes.has(w)) airportsFound.add(w);
      });
    }
    const airports: AirportEntry[] = Array.from(airportsFound)
      .map(code => airportMap.get(code))
      .filter(Boolean) as AirportEntry[];

    // Coupon statuses
    const couponStatuses = new Set<string>();
    Array.from(text.matchAll(couponRegex)).forEach(m => couponStatuses.add(m[1].toUpperCase()));
    const couponStatusEntries: CouponStatusEntry[] = Array.from(couponStatuses)
      .map(code => couponMap.get(code))
      .filter(Boolean) as CouponStatusEntry[];

    setResult({ tickets, names, airports, couponStatuses: couponStatusEntries });
  };

  const hasInput = input.trim().length > 0;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-yellow-400">محلل التذكرة / PNR (محلي)</CardTitle>
        <p className="text-sm text-white/60">لا يتم إرسال أي بيانات؛ كل التحليل يتم في المتصفح.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="الصق هنا شاشة TWD أو نص PNR..."
          className="bg-black/30 border-white/10 text-white min-h-[140px]"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={analyze} disabled={!hasInput || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            تحليل محلي
          </Button>
          <Button variant="outline" className="text-white" onClick={() => setInput("")}>
            مسح
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            فشل تحميل البيانات: {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <Section title="أرقام التذاكر" emptyText="لا يوجد أرقام" items={result.tickets} />
            <Section title="الأسماء" emptyText="لم يتم التعرف على أسماء" items={result.names} />
            <AirportsSection airports={result.airports} />
            <CouponsSection coupons={result.couponStatuses} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div>
      <div className="text-sm text-white font-semibold mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-[12px] text-white/50">{emptyText}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(val => (
            <Badge key={val} variant="secondary" className="bg-blue-600/30 text-white border-white/10">
              {val}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function AirportsSection({ airports }: { airports: AirportEntry[] }) {
  return (
    <div>
      <div className="text-sm text-white font-semibold mb-2">المطارات</div>
      {airports.length === 0 ? (
        <div className="text-[12px] text-white/50">لا يوجد مطارات</div>
      ) : (
        <ScrollArea className="h-[150px]">
          <div className="space-y-2">
            {airports.map(a => (
              <div key={a.iata_code} className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-cyan-500/30 text-white border-white/10">
                    {a.iata_code}
                  </Badge>
                  <div className="text-white text-sm font-semibold">{a.airport_name}</div>
                </div>
                <div className="text-[12px] text-white/60">
                  {a.city} — {a.country_code} | نوع: {a.airport_type}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function CouponsSection({ coupons }: { coupons: CouponStatusEntry[] }) {
  return (
    <div>
      <div className="text-sm text-white font-semibold mb-2">حالات الكوبون</div>
      {coupons.length === 0 ? (
        <div className="text-[12px] text-white/50">لا يوجد حالات</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {coupons.map(c => (
            <div key={c.code} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
              <Badge variant="secondary" className="bg-green-500/30 text-white border-white/10">
                {c.code}
              </Badge>
              <div>
                <div className="text-white text-sm font-semibold">{c.label}</div>
                <div className="text-[12px] text-white/60">{c.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
