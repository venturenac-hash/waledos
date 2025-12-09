import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStaticData } from "@/hooks/useStaticData";
import { CommandEntry } from "@/lib/staticData";
import { Loader2 } from "lucide-react";

interface SimState {
  segments: number;
  names: number;
  contact: boolean;
  priced: boolean;
  ticketingOk: boolean;
  issued: boolean;
}

interface LogEntry {
  command: string;
  response: string;
  info?: string;
}

const initialState: SimState = {
  segments: 0,
  names: 0,
  contact: false,
  priced: false,
  ticketingOk: false,
  issued: false,
};

export function CommandSimulator() {
  const { loading, error, data } = useStaticData();
  const [input, setInput] = useState("");
  const [state, setState] = useState<SimState>(initialState);
  const [log, setLog] = useState<LogEntry[]>([]);

  const commandIndex = useMemo(() => {
    const map = new Map<string, CommandEntry>();
    [...(data?.commands.ar || []), ...(data?.commands.en || [])].forEach(c => {
      map.set(c.code.toUpperCase(), c);
    });
    return map;
  }, [data]);

  const handleRun = () => {
    const raw = input.trim();
    if (!raw) return;
    const cmd = raw.toUpperCase();
    const entry = commandIndex.get(cmd);

    let info = entry?.description || entry?.title || "";
    let response = "";
    let next = { ...state };

    // Simple simulated logic
    if (cmd.startsWith("AN")) {
      response = "عرض توفر (محاكاة) - لا يوجد خادم حقيقي.";
    } else if (cmd.startsWith("SS")) {
      next.segments += 1;
      response = `تم بيع قطاع (محاكاة). مجموع القطاعات: ${next.segments}`;
    } else if (cmd.startsWith("NM")) {
      const match = cmd.match(/NM(\d+)/);
      const count = match ? parseInt(match[1], 10) : 1;
      next.names = count;
      response = `تم إدخال الأسماء (محاكاة): ${count}`;
    } else if (cmd.startsWith("AP") || cmd.startsWith("APE")) {
      next.contact = true;
      response = "تم إدخال بيانات الاتصال (محاكاة).";
    } else if (cmd.startsWith("TKOK") || cmd.startsWith("TKTL")) {
      next.ticketingOk = true;
      response = "ترتيب التذاكر جاهز (محاكاة).";
    } else if (cmd.startsWith("FXP")) {
      if (next.segments === 0 || next.names === 0) {
        response = "التسعير فشل: أضف قطاعات وأسماء أولاً.";
      } else {
        next.priced = true;
        response = "تم التسعير وإنشاء TST (محاكاة).";
      }
    } else if (cmd.startsWith("TTP")) {
      if (!next.priced || !next.ticketingOk) {
        response = "الإصدار مرفوض: تأكد من التسعير وترتيب التذاكر (TKOK/TKTL).";
      } else {
        next.issued = true;
        response = "تم إصدار التذاكر (محاكاة).";
      }
    } else if (cmd === "IG") {
      next = { ...state };
      response = "تم تجاهل التغييرات (محاكاة).";
    } else {
      response = entry ? "تم العثور على الأمر في الكتالوج (محاكاة)." : "أمر غير معروف في الكتالوج المحلي.";
    }

    setState(next);
    setLog(prev => [{ command: raw, response, info }, ...prev].slice(0, 50));
  };

  const reset = () => {
    setState(initialState);
    setLog([]);
    setInput("");
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-yellow-400">محاكي أماديوس (محلي)</CardTitle>
        <p className="text-sm text-white/60">لا يوجد اتصال حقيقي؛ محاكاة مبسطة لسيناريو الحجز.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="اكتب أمر أماديوس (مثلاً: AN01MARDOHDXB أو FXP أو TTP/RT)"
            className="bg-black/20 border-white/10 text-white"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleRun();
            }}
          />
          <Button onClick={handleRun} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            تنفيذ
          </Button>
          <Button variant="outline" className="text-white" onClick={reset}>
            إعادة تعيين
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-[12px]">
          <Badge variant="secondary" className="bg-blue-600/30 text-white border-white/10">
            قطاعات: {state.segments}
          </Badge>
          <Badge variant="secondary" className="bg-blue-600/30 text-white border-white/10">
            أسماء: {state.names}
          </Badge>
          <Badge variant="secondary" className={state.contact ? "bg-green-500/30 text-white border-white/10" : "bg-white/10 text-white/60"}>
            اتصال
          </Badge>
          <Badge variant="secondary" className={state.priced ? "bg-green-500/30 text-white border-white/10" : "bg-white/10 text-white/60"}>
            مسعّر
          </Badge>
          <Badge variant="secondary" className={state.ticketingOk ? "bg-green-500/30 text-white border-white/10" : "bg-white/10 text-white/60"}>
            ترتيب تذاكر
          </Badge>
          <Badge variant="secondary" className={state.issued ? "bg-green-500/30 text-white border-white/10" : "bg-white/10 text-white/60"}>
            مُصدر
          </Badge>
        </div>

        {error && <div className="text-red-300 text-sm">تعذر تحميل كتالوج الأوامر: {error}</div>}

        <ScrollArea className="h-[220px]">
          <div className="space-y-2">
            {log.length === 0 && <div className="text-[12px] text-white/50">لا يوجد سجل بعد.</div>}
            {log.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-white font-semibold">{entry.command}</div>
                  <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
                    محاكاة
                  </Badge>
                </div>
                <div className="text-[12px] text-white/80 mt-1">{entry.response}</div>
                {entry.info && <div className="text-[11px] text-white/60 mt-1">معلومة: {entry.info}</div>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
