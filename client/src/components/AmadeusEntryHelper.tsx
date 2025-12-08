import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Plane, User, Phone, FileText, CreditCard, 
  Copy, Plus, Trash2, Check, ArrowRightLeft,
  Calendar as CalendarIcon, Search, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  generateContactCommands, generatePricingCommands,
  finalizeBookingCommands
} from "@/lib/command-generator";

export default function AmadeusEntryHelper() {
  // State
  const [activeStep, setActiveStep] = useState("flight");
  
  // Flight State
  const [flightType, setFlightType] = useState<"OW" | "RT">("OW");
  const [flightDate, setFlightDate] = useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  
  // Passengers State
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: "1", firstName: "", lastName: "", type: "ADT", title: "MR" }
  ]);
  
  // Contact State
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    mobile: "",
    email: "",
    language: "AR",
    paxRef: ["ALL"]
  });
  
  // Pricing & Payment State
  const [fareType, setFareType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [includeTTP, setIncludeTTP] = useState(false);
  
  // Generated Commands
  const [commands, setCommands] = useState<string[]>([]);

  // Handlers
  const handleAddPassenger = () => {
    const newId = (passengers.length + 1).toString();
    setPassengers([...passengers, { id: newId, firstName: "", lastName: "", type: "ADT", title: "MR" }]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      const newPax = [...passengers];
      newPax.splice(index, 1);
      setPassengers(newPax);
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const newPax = [...passengers];
    newPax[index] = { ...newPax[index], [field]: value };
    setPassengers(newPax);
  };

  // Command Generation Effect
  useEffect(() => {
    let newCommands: string[] = [];
    
    // 1. AN Commands
    if (flightDate && origin && destination) {
      const segment: FlightSegment = {
        type: flightType,
        date: flightDate,
        returnDate: flightType === "RT" ? returnDate : undefined,
        from: origin,
        to: destination
      };
      newCommands = [...newCommands, ...generateANCommand(segment)];
    }
    
    // 2. NM Commands
    const validPax = passengers.filter(p => p.firstName && p.lastName);
    if (validPax.length > 0) {
      newCommands = [...newCommands, ...generateNMCommand(validPax)];
    }
    
    // 3. Contact Commands
    if (contactInfo.mobile || contactInfo.email) {
      newCommands = [...newCommands, ...generateContactCommands(contactInfo)];
    }
    
    // 4. Finalize & Pricing
    // Only add if we have basic booking info
    if (validPax.length > 0 && flightDate) {
      newCommands = [...newCommands, ...finalizeBookingCommands()];
      
      if (fareType) {
        newCommands = [...newCommands, ...generatePricingCommands(fareType)];
      }
      
      if (paymentMethod === "SADAD") {
        newCommands.push("FP SADAD");
      }
      
      if (includeTTP) {
        newCommands.push("TTP/RT");
      }
    }
    
    setCommands(newCommands);
  }, [flightType, flightDate, returnDate, origin, destination, passengers, contactInfo, fareType, paymentMethod, includeTTP]);

  const copyAllCommands = () => {
    navigator.clipboard.writeText(commands.join("\n"));
    toast.success("تم نسخ جميع الأوامر");
  };

  // Airport Search Helper
  const filterAirports = (query: string) => {
    if (!query) return [];
    return airports.filter(a => 
      a.code.toLowerCase().startsWith(query.toLowerCase()) ||
      a.cityAr.includes(query) ||
      a.cityEn.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left Side: Input Forms */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-20">
        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          <TabsList className="grid grid-cols-4 w-full glass mb-6">
            <TabsTrigger value="flight">الرحلة</TabsTrigger>
            <TabsTrigger value="passengers">الركاب</TabsTrigger>
            <TabsTrigger value="contact">التواصل</TabsTrigger>
            <TabsTrigger value="payment">الدفع</TabsTrigger>
          </TabsList>

          {/* Flight Step */}
          <TabsContent value="flight" className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-secondary" />
                  بيانات الرحلة (AN)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={flightType} onValueChange={(v: "OW" | "RT") => setFlightType(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="OW" id="ow" />
                    <Label htmlFor="ow">ذهاب فقط</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="RT" id="rt" />
                    <Label htmlFor="rt">ذهاب وعودة</Label>
                  </div>
                </RadioGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>من (المغادرة)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-12">
                          {origin ? (
                            <span className="font-mono font-bold text-secondary">{origin}</span>
                          ) : (
                            <span className="text-muted-foreground">اختر المطار...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[300px]" align="start">
                        <div className="p-2">
                          <Input 
                            placeholder="بحث (RUH, الرياض...)" 
                            value={originSearch}
                            onChange={(e) => setOriginSearch(e.target.value)}
                            className="mb-2"
                          />
                          <ScrollArea className="h-[200px]">
                            {filterAirports(originSearch).map(airport => (
                              <div 
                                key={airport.code}
                                className="p-2 hover:bg-secondary/20 cursor-pointer rounded flex justify-between items-center"
                                onClick={() => { setOrigin(airport.code); setOriginSearch(""); }}
                              >
                                <span>{airport.cityAr}</span>
                                <span className="font-mono font-bold">{airport.code}</span>
                              </div>
                            ))}
                            {originSearch && filterAirports(originSearch).length === 0 && (
                              <div className="p-2 text-center text-muted-foreground text-sm">لا توجد نتائج</div>
                            )}
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>إلى (الوصول)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-12">
                          {destination ? (
                            <span className="font-mono font-bold text-secondary">{destination}</span>
                          ) : (
                            <span className="text-muted-foreground">اختر المطار...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[300px]" align="start">
                        <div className="p-2">
                          <Input 
                            placeholder="بحث (JED, جدة...)" 
                            value={destSearch}
                            onChange={(e) => setDestSearch(e.target.value)}
                            className="mb-2"
                          />
                          <ScrollArea className="h-[200px]">
                            {filterAirports(destSearch).map(airport => (
                              <div 
                                key={airport.code}
                                className="p-2 hover:bg-secondary/20 cursor-pointer rounded flex justify-between items-center"
                                onClick={() => { setDestination(airport.code); setDestSearch(""); }}
                              >
                                <span>{airport.cityAr}</span>
                                <span className="font-mono font-bold">{airport.code}</span>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ المغادرة</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-12">
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {flightDate ? format(flightDate, "dd/MM/yyyy") : <span>اختر التاريخ</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={flightDate}
                          onSelect={setFlightDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {flightType === "RT" && (
                    <div className="space-y-2">
                      <Label>تاريخ العودة</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-right font-normal glass-input h-12">
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>اختر التاريخ</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={returnDate}
                            onSelect={setReturnDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passengers Step */}
          <TabsContent value="passengers" className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="glass border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary" />
                  بيانات الركاب (NM)
                </CardTitle>
                <Button onClick={handleAddPassenger} size="sm" className="bg-secondary hover:bg-secondary/80 text-black">
                  <Plus className="w-4 h-4 ml-1" /> إضافة راكب
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {passengers.map((pax, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 relative group">
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => handleRemovePassenger(idx)}
                        disabled={passengers.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-bold">P{idx + 1}</span>
                      <span className="text-sm text-white/50">بيانات المسافر</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>الاسم الأول (First Name)</Label>
                        <Input 
                          value={pax.firstName} 
                          onChange={(e) => updatePassenger(idx, "firstName", e.target.value.toUpperCase())}
                          className="glass-input font-mono"
                          placeholder="MOHAMMED"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>اسم العائلة (Last Name)</Label>
                        <Input 
                          value={pax.lastName} 
                          onChange={(e) => updatePassenger(idx, "lastName", e.target.value.toUpperCase())}
                          className="glass-input font-mono"
                          placeholder="ALSAUD"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>اللقب (Title)</Label>
                        <Select value={pax.title} onValueChange={(v) => updatePassenger(idx, "title", v)}>
                          <SelectTrigger className="glass-input">
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

                    <div className="flex items-center space-x-2 space-x-reverse pt-2">
                      <Checkbox 
                        id={`infant-${idx}`} 
                        checked={pax.hasInfant}
                        onCheckedChange={(checked) => updatePassenger(idx, "hasInfant", checked)}
                      />
                      <Label htmlFor={`infant-${idx}`} className="text-sm cursor-pointer">معه رضيع (Infant)</Label>
                    </div>

                    {pax.hasInfant && (
                      <div className="bg-white/5 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label className="text-xs">اسم الرضيع الأول</Label>
                          <Input 
                            value={pax.infantFirstName} 
                            onChange={(e) => updatePassenger(idx, "infantFirstName", e.target.value.toUpperCase())}
                            className="glass-input h-9 text-sm font-mono"
                            placeholder="AHMED"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">تاريخ الميلاد (DDMMMYY)</Label>
                          <Input 
                            value={pax.infantDob} 
                            onChange={(e) => updatePassenger(idx, "infantDob", e.target.value.toUpperCase())}
                            className="glass-input h-9 text-sm font-mono"
                            placeholder="10JAN23"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Step */}
          <TabsContent value="contact" className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-secondary" />
                  بيانات التواصل (AP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>رقم الجوال (بدون 966)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm dir-ltr">+966</span>
                      <Input 
                        value={contactInfo.mobile}
                        onChange={(e) => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                        className="glass-input pl-14 font-mono text-left dir-ltr"
                        placeholder="500000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input 
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="glass-input font-mono text-left dir-ltr"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>لغة الرسائل</Label>
                    <Select value={contactInfo.language} onValueChange={(v: "AR" | "EN") => setContactInfo({ ...contactInfo, language: v })}>
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AR">العربية (AR)</SelectItem>
                        <SelectItem value="EN">الإنجليزية (EN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>تطبيق على</Label>
                    <Select 
                      value={contactInfo.paxRef[0]} 
                      onValueChange={(v) => setContactInfo({ ...contactInfo, paxRef: [v] })}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">جميع المسافرين</SelectItem>
                        {passengers.map((p, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>الراكب {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Step */}
          <TabsContent value="payment" className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  التسعير والدفع (FXP/FP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>نوع الباقة (Pricing)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Saver", "Basic", "Semi Flex", "Flex"].map((type) => (
                      <div 
                        key={type}
                        className={cn(
                          "cursor-pointer rounded-xl border p-4 text-center transition-all hover:bg-secondary/10",
                          fareType === type ? "border-secondary bg-secondary/20 text-secondary" : "border-white/10 bg-white/5"
                        )}
                        onClick={() => setFareType(type)}
                      >
                        <span className="font-bold">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <Label>خيارات إضافية</Label>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id="sadad" 
                        checked={paymentMethod === "SADAD"}
                        onCheckedChange={(c) => setPaymentMethod(c ? "SADAD" : "")}
                      />
                      <Label htmlFor="sadad" className="cursor-pointer">إضافة سداد (FP SADAD)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id="ttp" 
                        checked={includeTTP}
                        onCheckedChange={(c) => setIncludeTTP(c as boolean)}
                      />
                      <Label htmlFor="ttp" className="cursor-pointer">إضافة أمر التصدير (TTP/RT)</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Side: Generated Commands */}
      <div className="lg:col-span-1">
        <Card className="glass border-0 h-full flex flex-col sticky top-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                الأوامر النهائية
              </span>
              <Button size="sm" variant="outline" onClick={copyAllCommands} className="gap-2">
                <Copy className="w-4 h-4" /> نسخ الكل
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-1 font-mono text-sm dir-ltr">
                {commands.length === 0 ? (
                  <div className="text-center py-20 text-white/30">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ابدأ بإدخال البيانات لتوليد الأوامر</p>
                  </div>
                ) : (
                  commands.map((cmd, idx) => (
                    <div 
                      key={idx} 
                      className="group flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="text-secondary font-bold">{cmd}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          navigator.clipboard.writeText(cmd);
                          toast.success("تم نسخ الأمر");
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
