import { useState, useEffect } from "react";
import { Search, Plane, AlertTriangle, BookOpen, Copy, Check, Menu, X, Star, Trash2, Terminal } from "lucide-react";
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
import { AmadeusEntryHelper } from "@/components/AmadeusEntryHelper";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("helper");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<{ type: 'code' | 'command', value: string, label: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('amadeus_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (type: 'code' | 'command', value: string, label: string) => {
    const exists = favorites.find(f => f.value === value);
    let newFavorites;
    if (exists) {
      newFavorites = favorites.filter(f => f.value !== value);
      toast.success("تم الحذف من المفضلة");
    } else {
      newFavorites = [...favorites, { type, value, label }];
      toast.success("تم الإضافة للمفضلة");
    }
    setFavorites(newFavorites);
    localStorage.setItem('amadeus_favorites', JSON.stringify(newFavorites));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white font-sans dir-rtl">
      <div className="fixed inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-20 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-blue-600 flex items-center justify-center shadow-lg shadow-secondary/20">
              <Plane className="text-white w-6 h-6 -rotate-45" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Amadeus Helper</h1>
              <p className="text-xs text-white/70">مساعد الموظف الذكي</p>
            </div>
          </div>
          
          {/* Desktop Menu - Simplified */}
          <div className="hidden md:flex gap-6">
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
            <Button variant="ghost" onClick={() => { setActiveTab("helper"); setIsMenuOpen(false); }} className="justify-start text-white gap-2"><Terminal className="w-4 h-4 text-secondary" /> مساعد الإدخال</Button>
            <Button variant="ghost" onClick={() => { setActiveTab("favorites"); setIsMenuOpen(false); }} className="justify-start text-white gap-2"><Star className="w-4 h-4 text-yellow-400" /> المفضلة</Button>
          </div>
        )}
      </nav>

      {/* Subtle Pulsing Title in Corner */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none select-none">
        <div className="text-white/10 text-sm font-bold tracking-[0.2em] uppercase animate-pulse" style={{ fontFamily: 'sans-serif' }}>
          Waleed's work
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12 relative z-10 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          
          {/* Entry Helper Tab (Main) */}
          <TabsContent value="helper" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <AmadeusEntryHelper />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-yellow-400">المفضلة</h2>
              <p className="text-white/60">الرموز والأوامر المحفوظة</p>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-20 glass rounded-xl border border-white/10">
                <Star className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/50">لا توجد عناصر في المفضلة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group border border-white/5">
                    <div>
                      <div className="font-bold text-lg text-white">{fav.value}</div>
                      <div className="text-sm text-white/50">{fav.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        navigator.clipboard.writeText(fav.value);
                        toast.success("تم النسخ");
                      }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => toggleFavorite(fav.type, fav.value, fav.label)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
