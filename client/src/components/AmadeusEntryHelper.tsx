import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Plane, User, Phone, FileText, Copy, Plus, Trash2, 
  ArrowRightLeft, Calendar as CalendarIcon, Check, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { airports } from "@/lib/airport-codes";
import { 
  Passenger, ContactInfo,
  generateANCommand, generateNMCommand, 
  generateBlock4Commands, packages
} from "@/lib/command-generator";

// Extended Passenger Interface for UI State
interface ExtendedPassenger extends Passenger {
  // UI specific fields if any
}

export default function AmadeusEntryHelper() {
  // --- Block 1: Flights (Merged) ---
  const [deptDate, setDeptDate] = useState<Date | undefined>(new Date());
  const [deptFrom, setDeptFrom] = useState("");
  const [deptTo, setDeptTo] = useState("");
  const [deptFromSearch, setDeptFromSearch] = useState("");
  const [deptToSearch, setDeptToSearch] = useState("");
  
  const [retDate, setRetDate] = useState<Date | undefined>(new Date());
  const [retFrom, setRetFrom] = useState("");
  const [retTo, setRetTo] = useState("");
  
  const [deptCommand, setDeptCommand] = useState("");
  const [retCommand, setRetCommand] = useState("");

  // --- Block 2: Passengers (NM + Docs) ---
  const [passengers, setPassengers] = useState<ExtendedPassenger[]>([
    { 
      id: "1", firstName: "", lastName: "", title: "MR", 
      nationality: "SAU", birthPlace: "SAU", docType: "I", gender: "M"
    }
  ]);
  const [nmCommands, setNmCommands] = useState("");

  // --- Block 3: Contact ---
  const [contact, setContact] = useState<ContactInfo>({
    mobile: "",
    email: "",
    language: "AR",
    paxCount: 1
  });
  const [block4Commands, setBlock4Commands] = useState("");

  // --- Helpers ---
  const filterAirports = (query: string) => {
    if (!query) return [];
    return airports.filter(a => 
      a.code.toLowerCase().startsWith(query.toLowerCase()) ||
      a.cityAr.includes(query) ||
      a.cityEn.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح");
  };

  // --- Handlers ---

  // Flight Generation
  useEffect(() => {
    if (deptDate && deptFrom && deptTo) {
      setDeptCommand(generateANCommand({ date: deptDate, from: deptFrom, to: deptTo }));
    } else {
      setDeptCommand("");
    }
  }, [deptDate, deptFrom, deptTo]);

  useEffect(() => {
    if (retDate && retFrom && retTo) {
      setRetCommand(generateANCommand({ date: retDate, from: retFrom, to: retTo }));
    } else {
      setRetCommand("");
    }
  }, [retDate, retFrom, retTo]);

  const reverseRoute = () => {
    if (deptFrom && deptTo) {
      setRetFrom(deptTo);
      setRetTo(deptFrom);
      toast.success("تم عكس المسار");
    }
  };

  // Passenger Handlers
  const addPassenger = () => {
    setPassengers([...passengers, { 
      id: (passengers.length + 1).toString(), 
      firstName: "", lastName: "", title: "MR",
      nationality: "SAU", birthPlace: "SAU", docType: "I", gender: "M"
    }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      const newPax = [...passengers];
      newPax.splice(index, 1);
      setPassengers(newPax);
    }
  };

  const updatePax = (index: number, field: keyof ExtendedPassenger, value: any) => {
    const newPax = [...passengers];
    newPax[index] = { ...newPax[index], [field]: value };
    setPassengers(newPax);
  };

  // Auto-generate commands when data changes
  useEffect(() => {
    // NM Commands
    const validPax = passengers.filter(p => p.firstName && p.lastName);
    if (validPax.length > 0) {
      setNmCommands(generateNMCommand(validPax).join("\n"));
      setContact(prev => ({ ...prev, paxCount: validPax.length }));
    } else {
      setNmCommands("");
    }

    // Block 4 (Contact + Docs)
    // Only generate if we have contact info OR docs info
    const hasContact = contact.mobile || contact.email;
    const hasDocs = validPax.some(p => p.docNumber);
    
    if (hasContact || hasDocs) {
      setBlock4Commands(generateBlock4Commands(contact, validPax).join("\n"));
    } else {
      setBlock4Commands("");
    }
  }, [passengers, contact]);

  return (
    <div className="max-w-[600px] mx-auto space-y-6 pb-20">
      
      {/* --- Block 1: Flights (Compact) --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="w-4 h-4 text-secondary" />
            الرحلات (Flights)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Departure Row */}
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2">
                    {deptDate ? format(deptDate, "ddMMM").toUpperCase() : "التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deptDate} onSelect={setDeptDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">من</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2 truncate">
                    {deptFrom || "المغادرة"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[180px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={deptFromSearch} onChange={e => setDeptFromSearch(e.target.value)} className="mb-2 h-7 text-xs" />
                    <ScrollArea className="h-[120px]">
                      {filterAirports(deptFromSearch).map(a => (
                        <div key={a.code} className="p-1.5 hover:bg-secondary/20 cursor-pointer rounded text-xs" onClick={() => { setDeptFrom(a.code); setDeptFromSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">إلى</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2 truncate">
                    {deptTo || "الوصول"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[180px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={deptToSearch} onChange={e => setDeptToSearch(e.target.value)} className="mb-2 h-7 text-xs" />
                    <ScrollArea className="h-[120px]">
                      {filterAirports(deptToSearch).map(a => (
                        <div key={a.code} className="p-1.5 hover:bg-secondary/20 cursor-pointer rounded text-xs" onClick={() => { setDeptTo(a.code); setDeptToSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3">
              {deptCommand && (
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(deptCommand)} className="w-full h-8 text-xs font-bold">
                  نسخ الذهاب
                </Button>
              )}
            </div>
          </div>

          {/* Return Row */}
          <div className="grid grid-cols-12 gap-2 items-end pt-2 border-t border-white/5">
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">العودة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2">
                    {retDate ? format(retDate, "ddMMM").toUpperCase() : "التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={retDate} onSelect={setRetDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">من</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2 truncate">
                    {retFrom || "المغادرة"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[180px]">
                  <div className="p-2">
                    <ScrollArea className="h-[120px]">
                      {filterAirports("").map(a => (
                        <div key={a.code} className="p-1.5 hover:bg-secondary/20 cursor-pointer rounded text-xs" onClick={() => setRetFrom(a.code)}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3">
              <Label className="text-[10px] text-white/50 mb-1 block">إلى</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2 truncate">
                    {retTo || "الوصول"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[180px]">
                  <div className="p-2">
                    <ScrollArea className="h-[120px]">
                      {filterAirports("").map(a => (
                        <div key={a.code} className="p-1.5 hover:bg-secondary/20 cursor-pointer rounded text-xs" onClick={() => setRetTo(a.code)}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3 flex gap-1">
              <Button variant="ghost" size="icon" onClick={reverseRoute} className="h-8 w-8 shrink-0" title="عكس المسار">
                <ArrowRightLeft className="w-3 h-3" />
              </Button>
              {retCommand && (
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(retCommand)} className="w-full h-8 text-xs font-bold">
                  نسخ العودة
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Block 2: Passengers & Docs (Merged) --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-secondary" />
            الركاب والوثائق (NM + Docs)
          </CardTitle>
          <Button onClick={addPassenger} size="sm" className="h-7 text-xs bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20">
            <Plus className="w-3 h-3 ml-1" /> إضافة
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {passengers.map((pax, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3 relative group">
              <div className="absolute top-3 left-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-6 w-6"
                  onClick={() => removePassenger(idx)}
                  disabled={passengers.length === 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="bg-secondary/20 text-secondary px-1.5 py-0.5 rounded text-[10px] font-bold">P{idx + 1}</span>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Label className="text-[10px] text-white/50">الاسم الأول</Label>
                  <Input 
                    value={pax.firstName} 
                    onChange={(e) => updatePax(idx, "firstName", e.target.value.toUpperCase())}
                    className="glass-input font-mono h-8 text-xs"
                    placeholder="MOHAMMED"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px] text-white/50">اسم العائلة</Label>
                  <Input 
                    value={pax.lastName} 
                    onChange={(e) => updatePax(idx, "lastName", e.target.value.toUpperCase())}
                    className="glass-input font-mono h-8 text-xs"
                    placeholder="ALSAUD"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px] text-white/50">اللقب (يحدد النوع)</Label>
                  <Select value={pax.title} onValueChange={(v) => updatePax(idx, "title", v)}>
                    <SelectTrigger className="glass-input h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MR">MR (سيد)</SelectItem>
                      <SelectItem value="MS">MS (سيدة)</SelectItem>
                      <SelectItem value="MSTR">MSTR (طفل)</SelectItem>
                      <SelectItem value="MISS">MISS (طفلة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Child DOB */}
              {(pax.title === "MSTR" || pax.title === "MISS") && (
                <div className="grid grid-cols-12 gap-2 animate-in slide-in-from-top-2">
                  <div className="col-span-6">
                    <Label className="text-[10px] text-white/50">تاريخ ميلاد الطفل</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2">
                          {pax.dob ? format(pax.dob, "ddMMMyy").toUpperCase() : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pax.dob} onSelect={(d) => updatePax(idx, "dob", d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Docs Section (Collapsible or Inline) */}
              <div className="pt-2 border-t border-white/5">
                <Label className="text-[10px] text-secondary mb-2 block">وثائق السفر (اختياري)</Label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <Label className="text-[9px] text-white/40">نوع الوثيقة</Label>
                    <Select value={pax.docType || "I"} onValueChange={(v: any) => updatePax(idx, "docType", v)}>
                      <SelectTrigger className="glass-input h-7 text-[10px] px-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">هوية (I)</SelectItem>
                        <SelectItem value="P">جواز (P)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-[9px] text-white/40">رقم الوثيقة</Label>
                    <Input value={pax.docNumber || ""} onChange={e => updatePax(idx, "docNumber", e.target.value)} className="glass-input h-7 text-[10px] font-mono px-1" placeholder="10..." />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-[9px] text-white/40">الجنسية</Label>
                    <Input value={pax.nationality || "SAU"} onChange={e => updatePax(idx, "nationality", e.target.value.toUpperCase())} className="glass-input h-7 text-[10px] font-mono px-1" />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-[9px] text-white/40">مكان الميلاد</Label>
                    <Input value={pax.birthPlace || "SAU"} onChange={e => updatePax(idx, "birthPlace", e.target.value.toUpperCase())} className="glass-input h-7 text-[10px] font-mono px-1" />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/40">تاريخ الميلاد</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-7 text-[10px] px-1">
                          {pax.dob ? format(pax.dob, "ddMMMyy").toUpperCase() : "التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pax.dob} onSelect={(d) => updatePax(idx, "dob", d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/40">تاريخ الانتهاء</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-7 text-[10px] px-1">
                          {pax.docExpiry ? format(pax.docExpiry, "ddMMMyy").toUpperCase() : "التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pax.docExpiry} onSelect={(d) => updatePax(idx, "docExpiry", d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/40">الجنس</Label>
                    <Select value={pax.gender || "M"} onValueChange={(v: any) => updatePax(idx, "gender", v)}>
                      <SelectTrigger className="glass-input h-7 text-[10px] px-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">ذكر (M)</SelectItem>
                        <SelectItem value="F">أنثى (F)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Infant Section */}
              <div className="pt-2">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Checkbox 
                    id={`infant-${idx}`} 
                    checked={pax.hasInfant || false}
                    onCheckedChange={(checked) => updatePax(idx, "hasInfant", checked)}
                  />
                  <Label htmlFor={`infant-${idx}`} className="text-xs cursor-pointer">معه رضيع (Infant)</Label>
                </div>

                {pax.hasInfant && (
                  <div className="bg-white/5 p-2 rounded grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 border border-white/5">
                    <div>
                      <Label className="text-[9px] text-white/50">اسم الرضيع</Label>
                      <Input 
                        value={pax.infantFirstName || ""} 
                        onChange={(e) => updatePax(idx, "infantFirstName", e.target.value.toUpperCase())}
                        className="glass-input h-7 text-xs font-mono"
                        placeholder="AHMED"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-white/50">تاريخ الميلاد</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-7 text-xs px-2">
                            {pax.infantDob ? format(pax.infantDob, "ddMMMyy").toUpperCase() : "التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={pax.infantDob} onSelect={(d) => updatePax(idx, "infantDob", d)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* NM Copy Button */}
          {nmCommands && (
            <div className="pt-2">
              <Button variant="secondary" onClick={() => copyToClipboard(nmCommands)} className="w-full h-9 text-sm font-bold">
                نسخ الركاب (NM)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Block 3: Contact & Finalize --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="w-4 h-4 text-secondary" />
            التواصل والحفظ (Contact & Save)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-white/50">الجوال (بدون 966)</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 font-mono text-[10px] dir-ltr">+966</span>
                <Input 
                  value={contact.mobile}
                  onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                  className="glass-input pl-10 font-mono text-left dir-ltr h-8 text-xs"
                  placeholder="50..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-white/50">البريد الإلكتروني</Label>
              <Input 
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="glass-input font-mono text-left dir-ltr h-8 text-xs"
                placeholder="email@..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-white/50">اللغة</Label>
              <Select value={contact.language} onValueChange={(v: "AR" | "EN") => setContact({ ...contact, language: v })}>
                <SelectTrigger className="glass-input h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AR">العربية</SelectItem>
                  <SelectItem value="EN">الإنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Block 4 Copy Button */}
          {block4Commands && (
            <div className="pt-2">
              <Button variant="secondary" onClick={() => copyToClipboard(block4Commands)} className="w-full h-9 text-sm font-bold">
                نسخ التواصل والوثائق (AP + Docs)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Packages (Compact) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {packages.map((pkg) => (
          <Button 
            key={pkg.name}
            variant="outline" 
            className="h-auto py-2 flex flex-col gap-1 border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/30"
            onClick={() => copyToClipboard(`FXB/FF-${pkg.name}`)}
          >
            <span className="text-xs font-bold">{pkg.title}</span>
            <span className="text-[9px] font-mono opacity-50">{pkg.name}</span>
          </Button>
        ))}
      </div>

    </div>
  );
}
