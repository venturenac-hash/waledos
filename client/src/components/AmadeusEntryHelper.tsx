import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Plane, User, Phone, Copy, Plus, Trash2, 
  ArrowRightLeft, Check, AlertCircle
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
  // --- State ---
  
  // Progress Steps (1-5)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Block 1: Outbound
  const [deptDate, setDeptDate] = useState<Date | undefined>(new Date());
  const [deptFrom, setDeptFrom] = useState("");
  const [deptTo, setDeptTo] = useState("");
  const [deptFromSearch, setDeptFromSearch] = useState("");
  const [deptToSearch, setDeptToSearch] = useState("");
  const [deptCommand, setDeptCommand] = useState("");

  // Block 2: Return
  const [retDate, setRetDate] = useState<Date | undefined>(new Date());
  const [retFrom, setRetFrom] = useState("");
  const [retTo, setRetTo] = useState("");
  const [retCommand, setRetCommand] = useState("");

  // Block 3: Passengers
  const [passengers, setPassengers] = useState<ExtendedPassenger[]>([
    { 
      id: "1", firstName: "", lastName: "", title: "MR", 
      nationality: "SAU", birthPlace: "SAU", docType: "I", gender: "M"
    }
  ]);
  const [nmCommands, setNmCommands] = useState("");

  // Block 4: Contact + Docs
  const [contact, setContact] = useState<ContactInfo>({
    mobile: "",
    email: "",
    language: "AR",
    paxCount: 1
  });
  const [block4Commands, setBlock4Commands] = useState("");

  // Block 5: Packages
  // No state needed for generation, just selection

  // --- Helpers ---
  const filterAirports = (query: string) => {
    if (!query) return [];
    return airports.filter(a => 
      a.code.toLowerCase().startsWith(query.toLowerCase()) ||
      a.cityAr.includes(query) ||
      a.cityEn.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const copyToClipboard = (text: string, stepIndex: number) => {
    if (!text) {
      toast.error("البيانات غير مكتملة");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح");
    
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  // --- Effects ---

  // Generate Outbound
  useEffect(() => {
    if (deptDate && deptFrom && deptTo) {
      setDeptCommand(generateANCommand({ date: deptDate, from: deptFrom, to: deptTo }));
    } else {
      setDeptCommand("");
    }
  }, [deptDate, deptFrom, deptTo]);

  // Generate Return
  useEffect(() => {
    if (retDate && retFrom && retTo) {
      setRetCommand(generateANCommand({ date: retDate, from: retFrom, to: retTo }));
    } else {
      setRetCommand("");
    }
  }, [retDate, retFrom, retTo]);

  // Generate NM & Block 4
  useEffect(() => {
    const validPax = passengers.filter(p => p.firstName && p.lastName);
    
    // NM
    if (validPax.length > 0) {
      setNmCommands(generateNMCommand(validPax));
    } else {
      setNmCommands("");
    }

    // Block 4
    const hasContact = contact.mobile || contact.email;
    const hasDocs = validPax.some(p => p.docNumber);
    
    if (hasContact || hasDocs) {
      const effectiveContact = { ...contact, paxCount: validPax.length > 0 ? validPax.length : 1 };
      setBlock4Commands(generateBlock4Commands(effectiveContact, validPax));
    } else {
      setBlock4Commands("");
    }
  }, [passengers, contact]);

  // --- Handlers ---
  const reverseRoute = () => {
    if (deptFrom && deptTo) {
      setRetFrom(deptTo);
      setRetTo(deptFrom);
      toast.success("تم عكس المسار");
    }
  };

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

  return (
    <div className="flex gap-6 max-w-[800px] mx-auto pb-20">
      
      {/* Main Content Column */}
      <div className="flex-1 space-y-6 max-w-[650px]">
        
        {/* --- Block 1: Outbound --- */}
        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="w-4 h-4 text-secondary" />
              1. رحلة الذهاب (Outbound)
            </CardTitle>
            <Button 
              size="sm" 
              variant={deptCommand ? "secondary" : "outline"}
              className="h-7 text-xs font-bold"
              disabled={!deptCommand}
              onClick={() => copyToClipboard(deptCommand, 1)}
            >
              <Copy className="w-3 h-3 ml-1" /> Copy Outbound
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
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
              <div className="col-span-4">
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
              <div className="col-span-4">
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
            </div>
          </CardContent>
        </Card>

        {/* --- Block 2: Return --- */}
        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="w-4 h-4 text-secondary rotate-180" />
              2. رحلة العودة (Return)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={reverseRoute} className="h-7 w-7" title="عكس المسار">
                <ArrowRightLeft className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant={retCommand ? "secondary" : "outline"}
                className="h-7 text-xs font-bold"
                disabled={!retCommand}
                onClick={() => copyToClipboard(retCommand, 2)}
              >
                <Copy className="w-3 h-3 ml-1" /> Copy Return
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Label className="text-[10px] text-white/50 mb-1 block">التاريخ</Label>
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
              <div className="col-span-4">
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
              <div className="col-span-4">
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
            </div>
          </CardContent>
        </Card>

        {/* --- Block 3: Passengers --- */}
        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-secondary" />
              3. الركاب (NM Lines)
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={addPassenger} size="sm" className="h-7 text-xs bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20">
                <Plus className="w-3 h-3 ml-1" /> إضافة
              </Button>
              <Button 
                size="sm" 
                variant={nmCommands ? "secondary" : "outline"}
                className="h-7 text-xs font-bold"
                disabled={!nmCommands}
                onClick={() => copyToClipboard(nmCommands, 3)}
              >
                <Copy className="w-3 h-3 ml-1" /> Copy NM
              </Button>
            </div>
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
                    <Label className="text-[10px] text-white/50">اللقب</Label>
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
          </CardContent>
        </Card>

        {/* --- Block 4: Contact + Docs --- */}
        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-4 h-4 text-secondary" />
              4. التواصل والوثائق (Contact + Docs)
            </CardTitle>
            <Button 
              size="sm" 
              variant={block4Commands ? "secondary" : "outline"}
              className="h-7 text-xs font-bold"
              disabled={!block4Commands}
              onClick={() => copyToClipboard(block4Commands, 4)}
            >
              <Copy className="w-3 h-3 ml-1" /> Copy Contact+Save+Docs
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Contact Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-white/50">الجوال (05...)</Label>
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

            {/* Docs Inputs (Per Passenger) */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <Label className="text-[10px] text-secondary block">وثائق السفر (SR DOCS)</Label>
              {passengers.map((pax, idx) => (
                <div key={idx} className="p-2 rounded bg-white/5 border border-white/5">
                  <div className="text-[10px] font-bold text-white/70 mb-2">P{idx + 1}: {pax.firstName} {pax.lastName}</div>
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* --- Block 5: Packages --- */}
        <Card className="glass border-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Check className="w-4 h-4 text-secondary" />
              5. الباقات (Packages)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {packages.map((pkg) => (
                <Button 
                  key={pkg.name}
                  variant="outline" 
                  className="h-auto py-2 flex flex-col gap-1 border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/30 items-start"
                  onClick={() => copyToClipboard(`FXB/FF-${pkg.name}`, 5)}
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="text-xs font-bold">{pkg.title}</span>
                    <Copy className="w-3 h-3 opacity-50" />
                  </div>
                  <span className="text-[9px] font-mono opacity-50">{pkg.name}</span>
                  <div className="text-[9px] text-white/40 mt-1 text-right w-full">
                    {pkg.features[0]}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Right Sidebar: Progress */}
      <div className="w-[120px] hidden md:block sticky top-24 h-fit">
        <div className="glass rounded-xl p-4 space-y-6 border border-white/10">
          <h3 className="text-xs font-bold text-white/50 text-center uppercase tracking-widest">Progress</h3>
          <div className="space-y-4 relative">
            {/* Vertical Line */}
            <div className="absolute right-[11px] top-2 bottom-2 w-0.5 bg-white/10 -z-10" />
            
            {[1, 2, 3, 4, 5].map((step) => {
              const isCompleted = completedSteps.includes(step);
              return (
                <div key={step} className="flex items-center justify-end gap-3">
                  <span className={`text-[10px] font-bold transition-colors ${isCompleted ? "text-secondary" : "text-white/30"}`}>
                    STEP {step}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? "bg-secondary border-secondary text-black" 
                      : "bg-black/40 border-white/10 text-transparent"
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
