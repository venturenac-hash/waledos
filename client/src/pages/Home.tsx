import { useState, useEffect } from "react";
import { Search, Plane, AlertTriangle, BookOpen, Copy, Check, Menu, X, Star, Trash2 } from "lucide-react";
import { airports, Airport } from "@/lib/airport-codes";
import { bookingSteps, commonErrors, shortcuts } from "@/lib/booking-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("booking");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<{ type: 'code' | 'command', value: string, label: string }[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("amadeus_favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (type: 'code' | 'command', value: string, label: string) => {
    const exists = favorites.find(f => f.value === value && f.type === type);
    let newFavorites;
    if (exists) {
      newFavorites = favorites.filter(f => !(f.value === value && f.type === type));
      toast.success("تم الحذف من المفضلة");
    } else {
      newFavorites = [...favorites, { type, value, label }];
      toast.success("تم الإضافة للمفضلة");
    }
    setFavorites(newFavorites);
    localStorage.setItem("amadeus_favorites", JSON.stringify(newFavorites));
  };

  const isFavorite = (type: 'code' | 'command', value: string) => {
    return favorites.some(f => f.value === value && f.type === type);
  };

  const filteredAirports = airports.filter((airport) =>
    airport.cityAr.includes(searchQuery) ||
    airport.cityEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.countryAr.includes(searchQuery)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الكود بنجاح");
  };

  return (
    <div className="min-h-screen text-white font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {/* Background Overlay for better readability */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="relative z-50 glass border-b border-white/10 px-4 py-3 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-yellow-600 flex items-center justify-center shadow-lg">
              <Plane className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-['Outfit'] tracking-wide text-white">Amadeus Helper</h1>
              <p className="text-xs text-white/70">مساعد الموظف الذكي</p>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6">
            <Button variant="ghost" onClick={() => setActiveTab("booking")} className={cn("text-white hover:bg-white/10", activeTab === "booking" && "bg-white/10")}>خطوات الحجز</Button>
            <Button variant="ghost" onClick={() => setActiveTab("codes")} className={cn("text-white hover:bg-white/10", activeTab === "codes" && "bg-white/10")}>رموز المطارات</Button>
            <Button variant="ghost" onClick={() => setActiveTab("errors")} className={cn("text-white hover:bg-white/10", activeTab === "errors" && "bg-white/10")}>حل المشاكل</Button>
            <Button variant="ghost" onClick={() => setActiveTab("favorites")} className={cn("text-white hover:bg-white/10 gap-2", activeTab === "favorites" && "bg-white/10")}>
              <Star className="w-4 h-4 text-yellow-400" /> المفضلة
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-white/10 p-4 flex flex-col gap-2 animate-in slide-in-from-top-5">
            <Button variant="ghost" onClick={() => { setActiveTab("booking"); setIsMenuOpen(false); }} className="justify-start text-white">خطوات الحجز</Button>
            <Button variant="ghost" onClick={() => { setActiveTab("codes"); setIsMenuOpen(false); }} className="justify-start text-white">رموز المطارات</Button>
            <Button variant="ghost" onClick={() => { setActiveTab("errors"); setIsMenuOpen(false); }} className="justify-start text-white">حل المشاكل</Button>
            <Button variant="ghost" onClick={() => { setActiveTab("favorites"); setIsMenuOpen(false); }} className="justify-start text-white gap-2"><Star className="w-4 h-4 text-yellow-400" /> المفضلة</Button>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 pb-12 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          
          {/* Booking Steps Tab */}
          <TabsContent value="booking" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">خطوات الحجز السريع</h2>
              <p className="text-white/60">دليلك لإنشاء حجز متكامل في 6 خطوات بسيطة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookingSteps.map((step) => (
                <Card key={step.id} className="glass glass-hover border-0 overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <CardHeader className="relative">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3 text-xl font-bold border border-white/10">
                      {step.id}
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-white/50">{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex justify-between items-center group-hover:border-primary/30 transition-colors">
                      <code className="font-mono text-secondary text-lg">{step.command}</code>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white" onClick={() => copyToClipboard(step.command)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className={cn("h-8 w-8 hover:text-yellow-400", isFavorite('command', step.command) ? "text-yellow-400" : "text-white/50")} onClick={() => toggleFavorite('command', step.command, step.title)}>
                          <Star className={cn("w-4 h-4", isFavorite('command', step.command) && "fill-current")} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mt-2 font-mono dir-ltr text-right">{step.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-secondary" />
                اختصارات مفيدة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="glass p-4 rounded-xl flex flex-col gap-2 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => copyToClipboard(shortcut.code)}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-secondary font-mono text-xl">{shortcut.code}</span>
                      <Copy className="w-3 h-3 text-white/30" />
                    </div>
                    <span className="text-sm text-white/70">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Airport Codes Tab */}
          <TabsContent value="codes" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">بحث رموز المطارات</h2>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
                <Input 
                  className="glass-input h-14 pr-12 text-lg rounded-2xl" 
                  placeholder="ابحث باسم المدينة (عربي/إنجليزي) أو الدولة..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-[600px] rounded-2xl glass border border-white/10 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAirports.map((airport) => (
                  <div key={airport.code} className="bg-white/5 hover:bg-white/10 rounded-xl p-4 flex justify-between items-center transition-all border border-white/5 hover:border-white/20 group">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-lg">{airport.cityAr}</h3>
                        <span className="text-xs text-white/50">{airport.cityEn}</span>
                      </div>
                      <p className="text-sm text-white/40 mt-1">{airport.countryAr}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-2xl font-black font-mono text-secondary tracking-wider">{airport.code}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => copyToClipboard(airport.code)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className={cn("h-6 w-6 hover:text-yellow-400", isFavorite('code', airport.code) ? "text-yellow-400" : "text-white/50")} onClick={() => toggleFavorite('code', airport.code, airport.cityAr)}>
                          <Star className={cn("w-3 h-3", isFavorite('code', airport.code) && "fill-current")} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAirports.length === 0 && (
                  <div className="col-span-full text-center py-20 text-white/30">
                    لا توجد نتائج مطابقة لبحثك
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 text-yellow-400">المفضلة</h2>
              <p className="text-white/60">الوصول السريع للأوامر والرموز المحفوظة</p>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl border border-white/10">
                <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-xl text-white/50">لم تقم بإضافة أي عناصر للمفضلة بعد</p>
                <p className="text-sm text-white/30 mt-2">اضغط على أيقونة النجمة بجانب أي أمر أو رمز لإضافته هنا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav, idx) => (
                  <div key={idx} className="glass p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", fav.type === 'code' ? "bg-blue-500/20 border-blue-500/30 text-blue-300" : "bg-purple-500/20 border-purple-500/30 text-purple-300")}>
                          {fav.type === 'code' ? 'مطار' : 'أمر'}
                        </span>
                        <h3 className="font-bold text-white/90">{fav.label}</h3>
                      </div>
                      <code className="font-mono text-secondary text-lg block mt-1">{fav.value}</code>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white" onClick={() => copyToClipboard(fav.value)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => toggleFavorite(fav.type, fav.value, fav.label)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 text-red-400">تشخيص الأخطاء</h2>
              <p className="text-white/60">حلول فورية لرسائل الخطأ الشائعة في النظام</p>
            </div>

            <div className="grid gap-4">
              {commonErrors.map((error, idx) => (
                <div key={idx} className="glass p-6 rounded-2xl border-r-4 border-r-red-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-red-500/20 text-red-400 mt-1">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-200 mb-1 font-mono">{error.error}</h3>
                      <p className="text-white/80">{error.solution}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto bg-black/30 px-4 py-2 rounded-lg border border-white/10 flex items-center justify-between gap-4 min-w-[200px]">
                    <code className="text-secondary font-mono">{error.command}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white" onClick={() => copyToClipboard(error.command)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
