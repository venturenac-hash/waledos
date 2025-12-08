import { useState, useEffect } from "react";
import { format, parseISO, differenceInYears, isBefore, addYears } from "date-fns";
import { 
  Plane, User, Phone, Copy, Plus, Trash2, 
  ArrowRightLeft, Check, AlertCircle, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Passenger, ContactInfo, FlightSegment,
  generateANCommand, generateNMCommand, 
  generateBlock4Commands, packages
} from "@/lib/command-generator";
import { AirportSelector } from "./AirportSelector";

// Extended Passenger Interface for UI State
interface ExtendedPassenger extends Passenger {
  infantLastNameSelection?: "MANUAL" | string; // "MANUAL" or passenger ID to copy last name from
}

export default function AmadeusEntryHelper() {
  // --- State ---
  
  // Progress Steps (1-5)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Block 1: Flights (Multi-City)
  const [segments, setSegments] = useState<FlightSegment[]>([
    { id: "1", date: new Date(), from: "", to: "" }, // Outbound
    { id: "2", date: new Date(), from: "", to: "" }  // Return (optional initially, but standard is round trip)
  ]);

  // Helper for date input (string <-> Date)
  const getDateStr = (date?: Date) => date ? format(date, "yyyy-MM-dd") : "";
  const setSegmentDate = (index: number, dateStr: string) => {
    const newSegments = [...segments];
    if (dateStr) {
      const newDate = parseISO(dateStr);
      newSegments[index].date = newDate;
      
      // Validation: Check if date is before previous segment
      if (index > 0 && newSegments[index-1].date && isBefore(newDate, newSegments[index-1].date)) {
        toast.error("تنبيه: تاريخ هذه الرحلة قبل الرحلة السابقة!");
      }
    }
    setSegments(newSegments);
  };

  // Block 3: Passengers
  const [passengers, setPassengers] = useState<ExtendedPassenger[]>([
    { 
      id: "1", firstName: "", lastName: "", title: "MR", 
      nationality: "SAU", birthPlace: "SAU", docType: "I", gender: "M",
      infantLastNameSelection: "MANUAL", infantGender: "M"
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
  
  // Flight Handlers
  const addSegment = () => {
    setSegments([...segments, { 
      id: (segments.length + 1).toString(), 
      date: new Date(), from: "", to: "" 
    }]);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      const newSegments = [...segments];
      newSegments.splice(index, 1);
      setSegments(newSegments);
    }
  };

  const updateSegment = (index: number, field: keyof FlightSegment, value: any) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const reverseRoute = (index: number) => {
    const seg = segments[index];
    updateSegment(index, "from", seg.to);
    updateSegment(index, "to", seg.from);
  };

  // Passenger Handlers
  const addPassenger = () => {
    setPassengers([...passengers, { 
      id: (passengers.length + 1).toString(), 
      firstName: "", lastName: "", title: "MR",
      nationality: "SAU", birthPlace: "SAU", docType: "I", gender: "M",
      infantLastNameSelection: "MANUAL", infantGender: "M"
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
    
    // Infant Age Validation
    if (field === "infantDob" && value && segments[0].date) {
      const age = differenceInYears(segments[0].date, value);
      if (age >= 2) {
        toast.error("تنبيه: عمر الرضيع يجب أن يكون أقل من سنتين!");
      }
    }

    setPassengers(newPax);
  };

  // Handle Infant Last Name Selection
  const handleInfantLastNameChange = (index: number, selection: string) => {
    const newPax = [...passengers];
    newPax[index].infantLastNameSelection = selection;
    
    if (selection !== "MANUAL") {
      const selectedPax = passengers.find(p => p.id === selection);
      if (selectedPax) {
        newPax[index].infantLastName = selectedPax.lastName;
      }
    }
    setPassengers(newPax);
  };

  return (
    <div className="flex gap-4 max-w-[900px] mx-auto pb-20 items-start">
      
      {/* Main Content Column */}
      <div className="flex-1 space-y-4 max-w-[700px]">
        
        {/* --- Block 1: Flights (Multi-City) --- */}
        <Card className="glass border-0 overflow-hidden shadow-lg">
          <CardHeader className="bg-white/5 border-b border-white/10 py-2 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plane className="w-4 h-4 text-secondary" />
              الرحلات (Flights)
            </CardTitle>
            <Button onClick={addSegment} size="sm" className="h-6 text-[10px] bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 px-2">
              <Plus className="w-3 h-3 ml-1" /> إضافة وجهة
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            {segments.map((seg, idx) => (
              <div key={idx} className="space-y-2 relative">
                {idx > 0 && <div className="h-px bg-white/5 w-full my-2" />}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 rounded">
                      {idx + 1}. {idx === 0 ? "الذهاب" : idx === 1 ? "العودة" : `وجهة ${idx + 1}`}
                    </span>
                    {idx > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeSegment(idx)} className="h-4 w-4 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => reverseRoute(idx)} className="h-5 w-5 text-white/50 hover:text-white" title="عكس المسار">
                    <ArrowRightLeft className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50 mb-1 block">التاريخ</Label>
                    <Input 
                      type="date" 
                      value={getDateStr(seg.date)} 
                      onChange={(e) => setSegmentDate(idx, e.target.value)} 
                      className="glass-input h-7 text-xs px-2 block w-full"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50 mb-1 block">من</Label>
                    <AirportSelector 
                      value={seg.from} 
                      onChange={(val) => updateSegment(idx, "from", val)} 
                      placeholder="المغادرة"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50 mb-1 block">إلى</Label>
                    <AirportSelector 
                      value={seg.to} 
                      onChange={(val) => updateSegment(idx, "to", val)} 
                      placeholder="الوصول"
                    />
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full h-7 text-xs font-bold mt-1 bg-white/5 hover:bg-white/10 border-white/10"
                  onClick={() => copyToClipboard(generateANCommand(seg), 1)}
                >
                  <Copy className="w-3 h-3 ml-1" /> نسخ أمر الرحلة {idx + 1}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* --- Block 3: Passengers --- */}
        <Card className="glass border-0 overflow-hidden shadow-lg">
          <CardHeader className="bg-white/5 border-b border-white/10 py-2 px-4 flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-secondary" />
              3. الركاب (NM Lines)
            </CardTitle>
            <Button onClick={addPassenger} size="sm" className="h-6 text-[10px] bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 px-2">
              <Plus className="w-3 h-3 ml-1" /> إضافة
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {passengers.map((pax, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-2 relative group">
                <div className="absolute top-2 left-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-5 w-5"
                    onClick={() => removePassenger(idx)}
                    disabled={passengers.length === 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/20 text-secondary px-1.5 py-0.5 rounded text-[9px] font-bold">P{idx + 1}</span>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50">الاسم الأول</Label>
                    <Input 
                      value={pax.firstName} 
                      onChange={(e) => updatePax(idx, "firstName", e.target.value.toUpperCase())}
                      className="glass-input font-mono h-7 text-xs"
                      placeholder="MOHAMMED"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50">اسم العائلة</Label>
                    <Input 
                      value={pax.lastName} 
                      onChange={(e) => updatePax(idx, "lastName", e.target.value.toUpperCase())}
                      className="glass-input font-mono h-7 text-xs"
                      placeholder="ALSAUD"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-[9px] text-white/50">اللقب</Label>
                    <Select value={pax.title} onValueChange={(v) => updatePax(idx, "title", v)}>
                      <SelectTrigger className="glass-input h-7 text-xs">
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
                      <Label className="text-[9px] text-white/50">تاريخ ميلاد الطفل</Label>
                      <Input 
                        type="date"
                        value={pax.dob ? format(pax.dob, "yyyy-MM-dd") : ""}
                        onChange={(e) => updatePax(idx, "dob", e.target.value ? parseISO(e.target.value) : undefined)}
                        className="glass-input h-7 text-xs px-2 block w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Infant Section */}
                <div className="pt-1">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <Checkbox 
                      id={`infant-${idx}`} 
                      checked={pax.hasInfant || false}
                      onCheckedChange={(checked) => updatePax(idx, "hasInfant", checked)}
                      className="h-3 w-3"
                    />
                    <Label htmlFor={`infant-${idx}`} className="text-[10px] cursor-pointer">معه رضيع (Infant)</Label>
                  </div>

                  {pax.hasInfant && (
                    <div className="bg-white/5 p-2 rounded grid grid-cols-12 gap-2 animate-in slide-in-from-top-2 border border-white/5">
                      <div className="col-span-4">
                        <Label className="text-[9px] text-white/50">اسم الرضيع</Label>
                        <Input 
                          value={pax.infantFirstName || ""} 
                          onChange={(e) => updatePax(idx, "infantFirstName", e.target.value.toUpperCase())}
                          className="glass-input h-7 text-xs font-mono"
                          placeholder="AHMED"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[9px] text-white/50">عائلة الرضيع</Label>
                        <Select 
                          value={pax.infantLastNameSelection || "MANUAL"} 
                          onValueChange={(v) => handleInfantLastNameChange(idx, v)}
                        >
                          <SelectTrigger className="glass-input h-7 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANUAL">يدوي / جديد</SelectItem>
                            {passengers.map(p => p.lastName && (
                              <SelectItem key={p.id} value={p.id}>{p.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pax.infantLastNameSelection === "MANUAL" && (
                          <Input 
                            value={pax.infantLastName || ""} 
                            onChange={(e) => updatePax(idx, "infantLastName", e.target.value.toUpperCase())}
                            className="glass-input h-7 text-xs font-mono mt-1"
                            placeholder="FAMILY NAME"
                          />
                        )}
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[9px] text-white/50">تاريخ الميلاد</Label>
                        <Input 
                          type="date"
                          value={pax.infantDob ? format(pax.infantDob, "yyyy-MM-dd") : ""}
                          onChange={(e) => updatePax(idx, "infantDob", e.target.value ? parseISO(e.target.value) : undefined)}
                          className="glass-input h-7 text-xs px-2 block w-full"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[9px] text-white/50">جنس الرضيع</Label>
                        <Select value={pax.infantGender || "M"} onValueChange={(v: any) => updatePax(idx, "infantGender", v)}>
                          <SelectTrigger className="glass-input h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">ذكر (MI)</SelectItem>
                            <SelectItem value="F">أنثى (MY)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="p-3 pt-0">
            <Button 
              size="sm" 
              variant={nmCommands ? "secondary" : "outline"}
              className="w-full h-8 text-xs font-bold"
              disabled={!nmCommands}
              onClick={() => copyToClipboard(nmCommands, 3)}
            >
              <Copy className="w-3 h-3 ml-1" /> نسخ الركاب (Copy NM)
            </Button>
          </CardFooter>
        </Card>

        {/* --- Block 4: Contact + Docs --- */}
        <Card className="glass border-0 overflow-hidden shadow-lg">
          <CardHeader className="bg-white/5 border-b border-white/10 py-2 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-secondary" />
              4. التواصل والوثائق (Contact + Docs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {/* Contact Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] text-white/50">الجوال (05...)</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 font-mono text-[10px] dir-ltr">+966</span>
                  <Input 
                    value={contact.mobile}
                    onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                    className="glass-input pl-10 font-mono text-left dir-ltr h-7 text-xs"
                    placeholder="50..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-white/50">البريد الإلكتروني</Label>
                <Input 
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="glass-input font-mono text-left dir-ltr h-7 text-xs"
                  placeholder="email@..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-white/50">اللغة</Label>
                <Select value={contact.language} onValueChange={(v: "AR" | "EN") => setContact({ ...contact, language: v })}>
                  <SelectTrigger className="glass-input h-7 text-xs">
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
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label className="text-[9px] text-secondary block">وثائق السفر (SR DOCS)</Label>
              {passengers.map((pax, idx) => (
                <div key={idx} className="p-2 rounded bg-white/5 border border-white/5">
                  <div className="text-[9px] font-bold text-white/70 mb-1">P{idx + 1}: {pax.firstName} {pax.lastName}</div>
                  <div className="grid grid-cols-12 gap-1.5">
                    <div className="col-span-3">
                      <Label className="text-[8px] text-white/40">نوع الوثيقة</Label>
                      <Select value={pax.docType || "I"} onValueChange={(v: any) => updatePax(idx, "docType", v)}>
                        <SelectTrigger className="glass-input h-6 text-[9px] px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">هوية (I)</SelectItem>
                          <SelectItem value="P">جواز (P)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[8px] text-white/40">رقم الوثيقة</Label>
                      <Input value={pax.docNumber || ""} onChange={e => updatePax(idx, "docNumber", e.target.value)} className="glass-input h-6 text-[9px] font-mono px-1" placeholder="10..." />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[8px] text-white/40">الجنسية</Label>
                      <Input value={pax.nationality || "SAU"} onChange={e => updatePax(idx, "nationality", e.target.value.toUpperCase())} className="glass-input h-6 text-[9px] font-mono px-1" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-[8px] text-white/40">مكان الميلاد</Label>
                      <Input value={pax.birthPlace || "SAU"} onChange={e => updatePax(idx, "birthPlace", e.target.value.toUpperCase())} className="glass-input h-6 text-[9px] font-mono px-1" />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[8px] text-white/40">تاريخ الميلاد</Label>
                      <Input 
                        type="date"
                        value={pax.dob ? format(pax.dob, "yyyy-MM-dd") : ""}
                        onChange={(e) => updatePax(idx, "dob", e.target.value ? parseISO(e.target.value) : undefined)}
                        className="glass-input h-6 text-[9px] px-1 block w-full"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[8px] text-white/40">تاريخ الانتهاء</Label>
                      <Input 
                        type="date"
                        value={pax.docExpiry ? format(pax.docExpiry, "yyyy-MM-dd") : ""}
                        onChange={(e) => updatePax(idx, "docExpiry", e.target.value ? parseISO(e.target.value) : undefined)}
                        className="glass-input h-6 text-[9px] px-1 block w-full"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-[8px] text-white/40">الجنس</Label>
                      <Select value={pax.gender || "M"} onValueChange={(v: any) => updatePax(idx, "gender", v)}>
                        <SelectTrigger className="glass-input h-6 text-[9px] px-1"><SelectValue /></SelectTrigger>
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
          <CardFooter className="p-3 pt-0">
            <Button 
              size="sm" 
              variant={block4Commands ? "secondary" : "outline"}
              className="w-full h-8 text-xs font-bold"
              disabled={!block4Commands}
              onClick={() => copyToClipboard(block4Commands, 4)}
            >
              <Copy className="w-3 h-3 ml-1" /> نسخ التواصل والوثائق (Copy Contact+Docs)
            </Button>
          </CardFooter>
        </Card>

        {/* --- Block 5: Packages --- */}
        <Card className="glass border-0 overflow-hidden shadow-lg">
          <CardHeader className="bg-white/5 border-b border-white/10 py-2 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-secondary" />
              5. الباقات (Packages)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
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
      <div className="w-[100px] hidden md:block sticky top-24 h-fit">
        <div className="glass rounded-xl p-3 space-y-4 border border-white/10">
          <h3 className="text-[10px] font-bold text-white/50 text-center uppercase tracking-widest">Progress</h3>
          <div className="space-y-3 relative">
            {/* Vertical Line */}
            <div className="absolute right-[10px] top-2 bottom-2 w-0.5 bg-white/10 -z-10" />
            
            {[1, 2, 3, 4, 5].map((step) => {
              const isCompleted = completedSteps.includes(step);
              return (
                <div key={step} className="flex items-center justify-end gap-2">
                  <span className={`text-[9px] font-bold transition-colors ${isCompleted ? "text-secondary" : "text-white/30"}`}>
                    STEP {step}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? "bg-secondary border-secondary text-black" 
                      : "bg-black/40 border-white/10 text-transparent"
                  }`}>
                    <Check className="w-2.5 h-2.5" />
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
