import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Plus, Trash2, ArrowRightLeft, Plane, User, Phone, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, differenceInMonths, differenceInYears } from "date-fns";
import {
  generateANCommand,
  generateNMCommand,
  generateBlock4Commands,
  Passenger,
  FlightSegment,
  ContactInfo,
} from "@/lib/command-generator";
import { AirportSelector } from "./AirportSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fareFamilies } from "@/lib/fare-packages";

export function AmadeusEntryHelper() {
  // --- State ---
  const [segments, setSegments] = useState<FlightSegment[]>([
    { id: "1", date: new Date(), from: "", to: "" },
    { id: "2", date: addDays(new Date(), 7), from: "", to: "" } // Return flight
  ]);

  const [passengers, setPassengers] = useState<Passenger[]>([
    { 
      id: "1", 
      firstName: "", 
      lastName: "", 
      title: "MR", 
      hasInfant: false,
      nationality: "SAU",
      birthPlace: "SAU",
      docType: "I"
    }
  ]);

  const [contact, setContact] = useState<ContactInfo>({
    mobile: "",
    email: "",
    language: "AR",
    paxCount: 1
  });

  const [activeStep, setActiveStep] = useState(1);

  // --- Effects for Automation ---

  // Auto-fill Return Flight (Block 1 -> Block 2)
  useEffect(() => {
    if (segments[0].from && segments[0].to && !segments[1].from && !segments[1].to) {
      const newSegments = [...segments];
      newSegments[1].from = segments[0].to;
      newSegments[1].to = segments[0].from;
      setSegments(newSegments);
    }
  }, [segments[0].from, segments[0].to]);

  // Auto-fill Last Name for new passengers
  useEffect(() => {
    if (passengers.length > 1) {
      const lastPax = passengers[passengers.length - 1];
      const prevPax = passengers[passengers.length - 2];
      if (!lastPax.lastName && prevPax.lastName) {
        const newPax = [...passengers];
        newPax[newPax.length - 1].lastName = prevPax.lastName;
        setPassengers(newPax);
      }
    }
  }, [passengers.length]);

  // Update paxCount in contact info
  useEffect(() => {
    setContact(prev => ({ ...prev, paxCount: passengers.length }));
  }, [passengers.length]);

  // --- Handlers ---

  const handleCopy = (text: string, label: string) => {
    if (!text) {
      toast.error("لا توجد بيانات للنسخ");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const updateSegment = (index: number, field: keyof FlightSegment, value: any) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const newPax = [...passengers];
    newPax[index] = { ...newPax[index], [field]: value };
    setPassengers(newPax);
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { 
        id: Math.random().toString(), 
        firstName: "", 
        lastName: passengers.length > 0 ? passengers[0].lastName : "", 
        title: "MR", 
        hasInfant: false,
        nationality: "SAU",
        birthPlace: "SAU",
        docType: "I"
      }
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length === 1) return;
    const newPax = passengers.filter((_, i) => i !== index);
    setPassengers(newPax);
  };

  const swapAirports = (index: number) => {
    const newSegments = [...segments];
    const temp = newSegments[index].from;
    newSegments[index].from = newSegments[index].to;
    newSegments[index].to = temp;
    setSegments(newSegments);
  };

  // Email suggestions
  const emailDomains = ["gmail.com", "hotmail.com", "icloud.com", "yahoo.com", "outlook.com"];
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContact({ ...contact, email: val });
    
    if (val.includes("@")) {
      const [prefix, domainPart] = val.split("@");
      const matches = emailDomains.filter(d => d.startsWith(domainPart)).map(d => `${prefix}@${d}`);
      setEmailSuggestions(matches);
    } else {
      setEmailSuggestions([]);
    }
  };

  // --- Validation ---
  const validateDates = () => {
    if (segments[0].date && segments[1].date) {
      if (segments[1].date < segments[0].date) {
        return "تنبيه: تاريخ العودة قبل تاريخ الذهاب!";
      }
    }
    return null;
  };

  const validatePassport = (pax: Passenger) => {
    if (pax.docExpiry && segments[0].date) {
      const months = differenceInMonths(pax.docExpiry, segments[0].date);
      if (months < 6) return "تنبيه: صلاحية الجواز أقل من 6 أشهر!";
    }
    return null;
  };

  const validateInfantAge = (pax: Passenger) => {
    if (pax.hasInfant && pax.infantDob && segments[0].date) {
      const age = differenceInYears(segments[0].date, pax.infantDob);
      if (age >= 2) return "تنبيه: عمر الرضيع 2 سنة أو أكثر!";
    }
    return null;
  };

  // --- Render ---

  return (
    <div className="flex gap-6 items-start w-full max-w-6xl mx-auto p-4">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Block 1 & 2: Flights */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <Plane className="w-5 h-5" />
              الرحلات (Flights)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validation Alert */}
            {validateDates() && (
              <div className="bg-red-500/20 text-red-200 p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {validateDates()}
              </div>
            )}

            {/* Flight 1: Departure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-blue-200">الذهاب .1</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-300 hover:text-white" onClick={() => swapAirports(0)}>
                  <ArrowRightLeft className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <Input 
                    type="date" 
                    className="bg-black/20 border-white/10 text-white h-9 text-sm"
                    value={segments[0].date ? format(segments[0].date, "yyyy-MM-dd") : ""}
                    onChange={(e) => updateSegment(0, "date", e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div className="col-span-4">
                  <AirportSelector 
                    value={segments[0].from}
                    onChange={(val) => updateSegment(0, "from", val)}
                    placeholder="المغادرة"
                  />
                </div>
                <div className="col-span-1 flex justify-center items-center text-white/20">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div className="col-span-4">
                  <AirportSelector 
                    value={segments[0].to}
                    onChange={(val) => updateSegment(0, "to", val)}
                    placeholder="الوصول"
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600/80 hover:bg-blue-500 text-white h-8 text-xs"
                onClick={() => handleCopy(generateANCommand(segments[0]), "أمر الذهاب")}
              >
                <Copy className="w-3 h-3 mr-2" />
                نسخ أمر الرحلة 1
              </Button>
            </div>

            {/* Flight 2: Return */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <Label className="text-blue-200">العودة .2</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-300 hover:text-white" onClick={() => swapAirports(1)}>
                  <ArrowRightLeft className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <Input 
                    type="date" 
                    className="bg-black/20 border-white/10 text-white h-9 text-sm"
                    value={segments[1].date ? format(segments[1].date, "yyyy-MM-dd") : ""}
                    onChange={(e) => updateSegment(1, "date", e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div className="col-span-4">
                  <AirportSelector 
                    value={segments[1].from}
                    onChange={(val) => updateSegment(1, "from", val)}
                    placeholder="المغادرة"
                  />
                </div>
                <div className="col-span-1 flex justify-center items-center text-white/20">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div className="col-span-4">
                  <AirportSelector 
                    value={segments[1].to}
                    onChange={(val) => updateSegment(1, "to", val)}
                    placeholder="الوصول"
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600/80 hover:bg-blue-500 text-white h-8 text-xs"
                onClick={() => handleCopy(generateANCommand(segments[1]), "أمر العودة")}
              >
                <Copy className="w-3 h-3 mr-2" />
                نسخ أمر الرحلة 2
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Block 3: Passengers */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <User className="w-5 h-5" />
              الركاب (NM Lines) .3
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addPassenger} className="h-7 text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
              <Plus className="w-3 h-3 mr-1" /> إضافة
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {passengers.map((pax, index) => (
              <div key={pax.id} className="bg-black/20 p-3 rounded-lg border border-white/5 relative group">
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => removePassenger(index)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="mb-2 flex items-center gap-2">
                  <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded font-mono">P{index + 1}</span>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-12 gap-2 mb-3">
                  <div className="col-span-2">
                    <Select value={pax.title} onValueChange={(val) => updatePassenger(index, "title", val)}>
                      <SelectTrigger className="h-8 text-xs bg-black/20 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MR">MR (سيد)</SelectItem>
                        <SelectItem value="MRS">MRS (سيدة)</SelectItem>
                        <SelectItem value="MS">MS (آنسة)</SelectItem>
                        <SelectItem value="MSTR">MSTR (طفل)</SelectItem>
                        <SelectItem value="MISS">MISS (طفلة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Input 
                      placeholder="الاسم الأول" 
                      className="h-8 text-xs bg-black/20 border-white/10 text-white uppercase"
                      value={pax.firstName}
                      onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input 
                      placeholder="اسم العائلة" 
                      className="h-8 text-xs bg-black/20 border-white/10 text-white uppercase"
                      value={pax.lastName}
                      onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                    />
                  </div>
                </div>

                {/* Infant Toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id={`infant-${pax.id}`}
                    className="rounded border-white/20 bg-black/20"
                    checked={pax.hasInfant}
                    onChange={(e) => updatePassenger(index, "hasInfant", e.target.checked)}
                  />
                  <Label htmlFor={`infant-${pax.id}`} className="text-xs text-blue-200 cursor-pointer">مع رضيع (Infant)</Label>
                </div>

                {/* Infant Details */}
                {pax.hasInfant && (
                  <div className="bg-blue-500/10 p-2 rounded mb-3 border border-blue-500/20">
                    {validateInfantAge(pax) && (
                      <div className="text-red-300 text-xs mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validateInfantAge(pax)}
                      </div>
                    )}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Input 
                          placeholder="اسم الرضيع الأول" 
                          className="h-7 text-xs bg-black/20 border-white/10 text-white uppercase"
                          value={pax.infantFirstName || ""}
                          onChange={(e) => updatePassenger(index, "infantFirstName", e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input 
                          placeholder="عائلة الرضيع" 
                          className="h-7 text-xs bg-black/20 border-white/10 text-white uppercase"
                          value={pax.infantLastName || pax.lastName}
                          onChange={(e) => updatePassenger(index, "infantLastName", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="date"
                          className="h-7 text-xs bg-black/20 border-white/10 text-white"
                          value={pax.infantDob ? format(pax.infantDob, "yyyy-MM-dd") : ""}
                          onChange={(e) => updatePassenger(index, "infantDob", e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select value={pax.infantGender || "M"} onValueChange={(val) => updatePassenger(index, "infantGender", val)}>
                          <SelectTrigger className="h-7 text-xs bg-black/20 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">ذكر (MI)</SelectItem>
                            <SelectItem value="F">أنثى (MY)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOCS Details (Collapsible or Always Visible? Let's keep it visible for efficiency) */}
                <div className="pt-2 border-t border-white/5 mt-2">
                  <Label className="text-[10px] text-white/40 mb-1 block">وثائق السفر (DOCS)</Label>
                  {validatePassport(pax) && (
                    <div className="text-red-300 text-xs mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validatePassport(pax)}
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-2">
                      <Select value={pax.docType} onValueChange={(val) => updatePassenger(index, "docType", val)}>
                        <SelectTrigger className="h-7 text-xs bg-black/20 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">هوية (I)</SelectItem>
                          <SelectItem value="P">جواز (P)</SelectItem>
                          <SelectItem value="A">إقامة (A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input 
                        placeholder="رقم الوثيقة" 
                        className="h-7 text-xs bg-black/20 border-white/10 text-white uppercase"
                        value={pax.docNumber || ""}
                        onChange={(e) => updatePassenger(index, "docNumber", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        placeholder="الجنسية (SAU)" 
                        className="h-7 text-xs bg-black/20 border-white/10 text-white uppercase"
                        value={pax.nationality || "SAU"}
                        onChange={(e) => updatePassenger(index, "nationality", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="date"
                        placeholder="انتهاء"
                        className="h-7 text-xs bg-black/20 border-white/10 text-white"
                        value={pax.docExpiry ? format(pax.docExpiry, "yyyy-MM-dd") : ""}
                        onChange={(e) => updatePassenger(index, "docExpiry", e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="date"
                        placeholder="ميلاد"
                        className="h-7 text-xs bg-black/20 border-white/10 text-white"
                        value={pax.dob ? format(pax.dob, "yyyy-MM-dd") : ""}
                        onChange={(e) => updatePassenger(index, "dob", e.target.value ? new Date(e.target.value) : undefined)}
                        disabled={!pax.docExpiry} // Disable DOB if no expiry, per user rule "ترك مكان تاريخ الميلاد فارغ"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
            <Button 
              className="w-full bg-blue-600/80 hover:bg-blue-500 text-white h-8 text-xs"
              onClick={() => handleCopy(generateNMCommand(passengers), "أسماء الركاب")}
            >
              <Copy className="w-3 h-3 mr-2" />
              نسخ أسماء الركاب (NM)
            </Button>
          </CardContent>
        </Card>

        {/* Block 4: Contact & Finalize */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <Phone className="w-5 h-5" />
              التواصل والوثائق (AP + DOCS) .4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-blue-200">رقم الجوال (بدون 05 أو 966)</Label>
                <div className="flex gap-2">
                  <span className="bg-black/20 border border-white/10 text-white/50 text-xs flex items-center px-2 rounded">+966</span>
                  <Input 
                    placeholder="5xxxxxxxx" 
                    className="h-8 text-xs bg-black/20 border-white/10 text-white"
                    value={contact.mobile}
                    onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1 relative">
                <Label className="text-xs text-blue-200">البريد الإلكتروني</Label>
                <Input 
                  placeholder="example@mail.com" 
                  className="h-8 text-xs bg-black/20 border-white/10 text-white"
                  value={contact.email}
                  onChange={handleEmailChange}
                />
                {emailSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-slate-800 border border-white/10 rounded-md z-10 mt-1 shadow-lg">
                    {emailSuggestions.map(s => (
                      <div 
                        key={s} 
                        className="px-3 py-1.5 text-xs text-white hover:bg-blue-600 cursor-pointer"
                        onClick={() => {
                          setContact({ ...contact, email: s });
                          setEmailSuggestions([]);
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full bg-green-600/80 hover:bg-green-500 text-white h-8 text-xs"
              onClick={() => handleCopy(generateBlock4Commands(contact, passengers), "أوامر التواصل والوثائق")}
            >
              <Copy className="w-3 h-3 mr-2" />
              نسخ التواصل + الحفظ + الوثائق (AP + DOCS)
            </Button>
          </CardContent>
        </Card>

        {/* Block 5: Packages */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
              <FileText className="w-5 h-5" />
              الباقات (Packages) .5
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fareFamilies.map(family => (
              <div key={family.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${family.accent}`} />
                    <h3 className="text-sm font-semibold text-white">{family.title}</h3>
                  </div>
                  <span className="text-[11px] text-white/60 hidden md:block">مرّر بالفأرة لرؤية بيانات الباقة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {family.packages.map(pkg => (
                    <TooltipProvider key={pkg.code} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-3 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all cursor-pointer"
                            tabIndex={0}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold text-white">{pkg.label}</div>
                                <div className="text-[11px] text-white/60">{family.title}</div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 text-[11px] border-white/20 bg-white/5 hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(`FXB/FF-${pkg.code}`, `باقة ${pkg.label}`);
                                }}
                              >
                                نسخ
                              </Button>
                            </div>

                            <div className="mt-3 text-[11px] text-white/60 leading-relaxed">
                              {pkg.features.slice(0, 3).map(f => f.value).join(" • ")}
                            </div>

                            {/* Inline fallback for touch devices */}
                            <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-white/70 md:hidden">
                              {pkg.features.slice(0, 5).map(feature => (
                                <div key={feature.label} className="flex items-center justify-between gap-2">
                                  <span className="text-white/50">{feature.label}</span>
                                  <span className="font-semibold text-white">{feature.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 border-white/10 text-white p-4 max-w-md">
                          <div className="font-bold text-sm mb-2 text-yellow-300">{pkg.label}</div>
                          <div className="grid grid-cols-1 gap-1 text-[11px]">
                            {pkg.features.map(feature => (
                              <div key={feature.label} className="flex items-center justify-between gap-3">
                                <span className="text-white/50">{feature.label}</span>
                                <span className="text-white font-semibold">{feature.value}</span>
                              </div>
                            ))}
                          </div>
                          {(pkg.footnote || family.footnote) && (
                            <div className="mt-3 text-[10px] text-white/50 leading-snug">
                              {pkg.footnote ?? family.footnote}
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>

                {family.footnote && (
                  <div className="text-[10px] text-white/40 leading-snug">
                    {family.footnote}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* Sidebar: Progress */}
      <div className="w-64 shrink-0 sticky top-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-white/60 uppercase tracking-wider">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 relative">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-white/10" />
            
            {[
              { id: 1, label: "AN (الرحلات)", desc: "تحديد الوجهات" },
              { id: 2, label: "FXX (تسعير)", desc: "للبالغ/الطفل/الرضيع" },
              { id: 3, label: "NM1 (الأسماء)", desc: "إدخال الركاب" },
              { id: 4, label: "AP (التواصل)", desc: "جوال وإيميل" },
              { id: 5, label: "TKOK/RFF", desc: "حفظ مبدئي" },
              { id: 6, label: "SR DOCS", desc: "وثائق السفر" },
              { id: 7, label: "FXP (تثبيت)", desc: "تثبيت السعر" },
              { id: 8, label: "FP SADAD", desc: "طريقة الدفع" },
              { id: 9, label: "TTP/RT", desc: "إصدار التذكرة" },
            ].map((step, i) => (
              <div key={step.id} className="relative flex items-center gap-3 py-2 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                  activeStep >= step.id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-white/30 border border-white/10"
                }`}>
                  {activeStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${activeStep >= step.id ? "text-white" : "text-white/40"}`}>{step.label}</div>
                  <div className="text-[10px] text-white/30">{step.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
