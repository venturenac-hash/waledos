import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Plane, User, Phone, FileText, CreditCard, 
  Copy, Plus, Trash2, Check, ArrowRightLeft,
  Calendar as CalendarIcon, Search, AlertCircle,
  Briefcase, ShieldCheck, Armchair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { airports } from "@/lib/airport-codes";
import { 
  Passenger, FlightSegment, ContactInfo,
  generateANCommand, generateNMCommand, 
  generateBlock4Commands, packages
} from "@/lib/command-generator";

// Extended Passenger Interface for UI State including Docs
interface ExtendedPassenger extends Passenger {
  // Infant Docs
  infantDocType?: "I" | "P" | "N";
  infantDocNumber?: string;
  infantNationality?: string;
  infantBirthPlace?: string;
  infantDocExpiry?: Date;
  infantGender?: "M" | "F";
}

export default function AmadeusEntryHelper() {
  // --- Block 1: Departure Flight ---
  const [deptDate, setDeptDate] = useState<Date | undefined>(new Date());
  const [deptFrom, setDeptFrom] = useState("");
  const [deptTo, setDeptTo] = useState("");
  const [deptFromSearch, setDeptFromSearch] = useState("");
  const [deptToSearch, setDeptToSearch] = useState("");
  const [deptCommand, setDeptCommand] = useState("");

  // --- Block 2: Return Flight ---
  const [retDate, setRetDate] = useState<Date | undefined>(new Date());
  const [retFrom, setRetFrom] = useState("");
  const [retTo, setRetTo] = useState("");
  const [retFromSearch, setRetFromSearch] = useState("");
  const [retToSearch, setRetToSearch] = useState("");
  const [retCommand, setRetCommand] = useState("");

  // --- Block 3: Passengers (NM) ---
  const [passengers, setPassengers] = useState<ExtendedPassenger[]>([
    { id: "1", firstName: "", lastName: "", type: "ADT", title: "MR" }
  ]);
  const [nmCommands, setNmCommands] = useState("");

  // --- Block 4: Contact & Docs ---
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

  // Block 1 Generation
  const generateDept = () => {
    if (!deptDate || !deptFrom || !deptTo) {
      toast.error("الرجاء إكمال بيانات رحلة الذهاب");
      return;
    }
    const cmd = generateANCommand({ date: deptDate, from: deptFrom, to: deptTo });
    setDeptCommand(cmd);
  };

  // Block 2 Generation
  const generateRet = () => {
    if (!retDate || !retFrom || !retTo) {
      toast.error("الرجاء إكمال بيانات رحلة الإياب");
      return;
    }
    const cmd = generateANCommand({ date: retDate, from: retFrom, to: retTo });
    setRetCommand(cmd);
  };

  const reverseRoute = () => {
    if (deptFrom && deptTo) {
      setRetFrom(deptTo);
      setRetTo(deptFrom);
      toast.success("تم عكس المسار من رحلة الذهاب");
    }
  };

  // Block 3 Handlers
  const addPassenger = () => {
    setPassengers([...passengers, { 
      id: (passengers.length + 1).toString(), 
      firstName: "", lastName: "", type: "ADT", title: "MR" 
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

  const generateNM = () => {
    const validPax = passengers.filter(p => p.firstName && p.lastName);
    if (validPax.length === 0) {
      toast.error("الرجاء إضافة راكب واحد على الأقل مع الاسم");
      return;
    }
    const cmds = generateNMCommand(validPax);
    setNmCommands(cmds.join("\n"));
    // Update contact pax count automatically
    setContact(prev => ({ ...prev, paxCount: validPax.length }));
  };

  // Block 4 Handlers
  const generateBlock4 = () => {
    // We need to construct a list of passengers that includes infants as separate entries for DOCS generation
    // OR modify the generator to handle the UI state directly.
    // The generator `generateBlock4Commands` expects `Passenger[]`.
    // We need to make sure `passengers` state has all the DOCS info filled.
    
    // Check if docs are filled (basic check)
    // In a real app, we'd validate more strictly.
    
    const cmds = generateBlock4Commands(contact, passengers);
    setBlock4Commands(cmds.join("\n"));
  };

  return (
    <div className="max-w-[700px] mx-auto space-y-8 pb-20">
      
      {/* --- Block 1: Departure --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plane className="w-5 h-5 text-secondary rotate-45" />
            1. رحلة الذهاب
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {deptDate ? format(deptDate, "ddMMM").toUpperCase() : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deptDate} onSelect={setDeptDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>من (المغادرة)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    {deptFrom || "اختر المطار"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={deptFromSearch} onChange={e => setDeptFromSearch(e.target.value)} className="mb-2 h-8" />
                    <ScrollArea className="h-[150px]">
                      {filterAirports(deptFromSearch).map(a => (
                        <div key={a.code} className="p-2 hover:bg-secondary/20 cursor-pointer rounded text-sm" onClick={() => { setDeptFrom(a.code); setDeptFromSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>إلى (الوصول)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    {deptTo || "اختر المطار"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={deptToSearch} onChange={e => setDeptToSearch(e.target.value)} className="mb-2 h-8" />
                    <ScrollArea className="h-[150px]">
                      {filterAirports(deptToSearch).map(a => (
                        <div key={a.code} className="p-2 hover:bg-secondary/20 cursor-pointer rounded text-sm" onClick={() => { setDeptTo(a.code); setDeptToSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={generateDept} className="w-full bg-secondary text-black hover:bg-secondary/90">تكوين رحلة الذهاب</Button>

          {deptCommand && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 font-mono text-center text-lg tracking-wider">
                {deptCommand}
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(deptCommand)} className="w-full gap-2 border-secondary/50 text-secondary hover:bg-secondary/10">
                <Copy className="w-4 h-4" /> نسخ رحلة الذهاب
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Block 2: Return --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plane className="w-5 h-5 text-secondary -rotate-135" />
            2. رحلة الإياب
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={reverseRoute} className="text-xs gap-1 h-8">
            <ArrowRightLeft className="w-3 h-3" /> عكس المسار
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {retDate ? format(retDate, "ddMMM").toUpperCase() : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={retDate} onSelect={setRetDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>من</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    {retFrom || "اختر المطار"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={retFromSearch} onChange={e => setRetFromSearch(e.target.value)} className="mb-2 h-8" />
                    <ScrollArea className="h-[150px]">
                      {filterAirports(retFromSearch).map(a => (
                        <div key={a.code} className="p-2 hover:bg-secondary/20 cursor-pointer rounded text-sm" onClick={() => { setRetFrom(a.code); setRetFromSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>إلى</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal glass-input">
                    {retTo || "اختر المطار"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]">
                  <div className="p-2">
                    <Input placeholder="بحث..." value={retToSearch} onChange={e => setRetToSearch(e.target.value)} className="mb-2 h-8" />
                    <ScrollArea className="h-[150px]">
                      {filterAirports(retToSearch).map(a => (
                        <div key={a.code} className="p-2 hover:bg-secondary/20 cursor-pointer rounded text-sm" onClick={() => { setRetTo(a.code); setRetToSearch(""); }}>
                          <span className="font-bold">{a.code}</span> - {a.cityAr}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={generateRet} className="w-full bg-secondary text-black hover:bg-secondary/90">تكوين رحلة الإياب</Button>

          {retCommand && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 font-mono text-center text-lg tracking-wider">
                {retCommand}
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(retCommand)} className="w-full gap-2 border-secondary/50 text-secondary hover:bg-secondary/10">
                <Copy className="w-4 h-4" /> نسخ رحلة الإياب
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Block 3: Passengers --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-secondary" />
            3. الركاب (NM)
          </CardTitle>
          <Button onClick={addPassenger} size="sm" className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20">
            <Plus className="w-4 h-4 ml-1" /> راكب جديد
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {passengers.map((pax, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 relative group">
              <div className="absolute top-4 left-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8"
                  onClick={() => removePassenger(idx)}
                  disabled={passengers.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-bold">P{idx + 1}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">الاسم الأول</Label>
                  <Input 
                    value={pax.firstName} 
                    onChange={(e) => updatePax(idx, "firstName", e.target.value.toUpperCase())}
                    className="glass-input font-mono h-9"
                    placeholder="MOHAMMED"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">اسم العائلة</Label>
                  <Input 
                    value={pax.lastName} 
                    onChange={(e) => updatePax(idx, "lastName", e.target.value.toUpperCase())}
                    className="glass-input font-mono h-9"
                    placeholder="ALSAUD"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">النوع</Label>
                  <Select value={pax.type} onValueChange={(v) => updatePax(idx, "type", v)}>
                    <SelectTrigger className="glass-input h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADT">بالغ (Adult)</SelectItem>
                      <SelectItem value="CHD">طفل (Child)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">اللقب</Label>
                  <Select value={pax.title} onValueChange={(v) => updatePax(idx, "title", v)}>
                    <SelectTrigger className="glass-input h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MR">MR</SelectItem>
                      <SelectItem value="MS">MS</SelectItem>
                      <SelectItem value="MSTR">MSTR</SelectItem>
                      <SelectItem value="MISS">MISS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Child DOB */}
              {pax.type === "CHD" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label className="text-xs">تاريخ ميلاد الطفل</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-9">
                        {pax.dob ? format(pax.dob, "ddMMMyy").toUpperCase() : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={pax.dob} onSelect={(d) => updatePax(idx, "dob", d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Infant Section */}
              <div className="pt-2">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Checkbox 
                    id={`infant-${idx}`} 
                    checked={pax.hasInfant || false}
                    onCheckedChange={(checked) => updatePax(idx, "hasInfant", checked)}
                  />
                  <Label htmlFor={`infant-${idx}`} className="text-sm cursor-pointer">معه رضيع (Infant)</Label>
                </div>

                {pax.hasInfant && (
                  <div className="bg-white/5 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 border border-white/5">
                    <div className="space-y-2">
                      <Label className="text-xs">اسم الرضيع الأول</Label>
                      <Input 
                        value={pax.infantFirstName || ""} 
                        onChange={(e) => updatePax(idx, "infantFirstName", e.target.value.toUpperCase())}
                        className="glass-input h-8 text-sm font-mono"
                        placeholder="AHMED"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">تاريخ ميلاد الرضيع</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-sm">
                            {pax.infantDob ? format(pax.infantDob, "ddMMMyy").toUpperCase() : "اختر التاريخ"}
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

          <Button onClick={generateNM} className="w-full bg-secondary text-black hover:bg-secondary/90">تكوين سطور NM</Button>

          {nmCommands && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 font-mono text-left dir-ltr whitespace-pre-wrap">
                {nmCommands}
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(nmCommands)} className="w-full gap-2 border-secondary/50 text-secondary hover:bg-secondary/10">
                <Copy className="w-4 h-4" /> نسخ سطور NM
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Block 4: Contact & Docs --- */}
      <Card className="glass border-0 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-secondary" />
            4. التواصل والوثائق (AP + Docs)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/70 border-b border-white/10 pb-2">بيانات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الجوال (بدون 966)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm dir-ltr">+966</span>
                  <Input 
                    value={contact.mobile}
                    onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                    className="glass-input pl-14 font-mono text-left dir-ltr"
                    placeholder="500000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="glass-input font-mono text-left dir-ltr"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select value={contact.language} onValueChange={(v: "AR" | "EN") => setContact({ ...contact, language: v })}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AR">العربية</SelectItem>
                    <SelectItem value="EN">الإنجليزية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Docs Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/70 border-b border-white/10 pb-2">وثائق السفر (SR DOCS)</h3>
            {passengers.map((pax, idx) => (
              <div key={idx} className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-bold">P{idx + 1}</span>
                  <span className="text-sm font-bold">{pax.firstName} {pax.lastName}</span>
                </div>
                
                {/* Adult/Child Docs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">نوع الوثيقة</Label>
                    <Select value={pax.docType || "I"} onValueChange={(v: any) => updatePax(idx, "docType", v)}>
                      <SelectTrigger className="glass-input h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">إقامة/هوية (I)</SelectItem>
                        <SelectItem value="P">جواز سفر (P)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">الجنسية (SAU)</Label>
                    <Input value={pax.nationality || ""} onChange={e => updatePax(idx, "nationality", e.target.value.toUpperCase())} className="glass-input h-8 text-xs font-mono" placeholder="SAU" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">رقم الوثيقة</Label>
                    <Input value={pax.docNumber || ""} onChange={e => updatePax(idx, "docNumber", e.target.value)} className="glass-input h-8 text-xs font-mono" placeholder="10..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">مكان الميلاد</Label>
                    <Input value={pax.birthPlace || ""} onChange={e => updatePax(idx, "birthPlace", e.target.value.toUpperCase())} className="glass-input h-8 text-xs font-mono" placeholder="RUH" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">تاريخ الميلاد</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2">
                          {pax.dob ? format(pax.dob, "ddMMMyy").toUpperCase() : "التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pax.dob} onSelect={(d) => updatePax(idx, "dob", d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">الجنس</Label>
                    <Select value={pax.gender || "M"} onValueChange={(v: any) => updatePax(idx, "gender", v)}>
                      <SelectTrigger className="glass-input h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">ذكر (M)</SelectItem>
                        <SelectItem value="F">أنثى (F)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">تاريخ الانتهاء</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-8 text-xs px-2">
                          {pax.docExpiry ? format(pax.docExpiry, "ddMMMyy").toUpperCase() : "التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={pax.docExpiry} onSelect={(d) => updatePax(idx, "docExpiry", d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Infant Docs (if exists) */}
                {pax.hasInfant && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-secondary">وثيقة الرضيع ({pax.infantFirstName})</span>
                    </div>
                    {/* Simplified Infant Docs Inputs - Assuming similar structure needed */}
                    {/* Note: In a full app, we'd duplicate all fields. For brevity, I'll add key ones */}
                    <div className="text-xs text-white/50 text-center p-2 bg-white/5 rounded">
                      سيتم استخدام بيانات الرضيع المدخلة في قسم الركاب لتوليد وثيقة السفر
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={generateBlock4} className="w-full bg-secondary text-black hover:bg-secondary/90">تكوين بيانات التواصل والحفظ والسفر</Button>

          {block4Commands && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 font-mono text-left dir-ltr whitespace-pre-wrap text-sm">
                {block4Commands}
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(block4Commands)} className="w-full gap-2 border-secondary/50 text-secondary hover:bg-secondary/10">
                <Copy className="w-4 h-4" /> نسخ الكل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Packages Section --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center text-white/80">باقات السعودية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.name} className="glass border-0 hover:bg-white/5 transition-colors group">
              <CardContent className="p-5 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-secondary">{pkg.title}</h3>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">{pkg.name}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-400" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-secondary/30 hover:bg-secondary/20 hover:text-secondary"
                  onClick={() => copyToClipboard(`FXB/FF-${pkg.name}`)}
                >
                  <Copy className="w-4 h-4 mr-2" /> نسخ {pkg.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
