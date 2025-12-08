import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { airports } from "@/lib/airport-codes";
import { Plane } from "lucide-react";

interface AirportSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AirportSelector({ value, onChange, placeholder }: AirportSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Top destinations for quick access
  const topDestinations = ["RUH", "JED", "DMM", "CAI", "DXB", "LHR", "IST", "JFK"];

  const filteredAirports = airports.filter(a => 
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.cityAr.includes(search) ||
    a.cityEn.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  // Handle direct typing in the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setSearch(val);
    onChange(val); // Allow free typing
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={value}
            onChange={handleInputChange}
            onClick={() => setOpen(true)}
            className="glass-input h-7 text-xs px-2 w-full font-bold uppercase placeholder:font-normal"
            placeholder={placeholder || "CODE"}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[220px] glass border-white/10" align="start">
        <div className="p-2 space-y-2">
          {/* Search Input inside Popover (optional, but we use the trigger input for search) */}
          
          {/* Top Destinations */}
          {!search && (
            <div className="mb-2">
              <div className="text-[9px] text-white/40 mb-1 px-1">الوجهات الشائعة</div>
              <div className="grid grid-cols-4 gap-1">
                {topDestinations.map(code => (
                  <Button
                    key={code}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] bg-white/5 hover:bg-secondary/20 hover:text-secondary p-0"
                    onClick={() => {
                      onChange(code);
                      setOpen(false);
                    }}
                  >
                    {code}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-[150px]">
            {filteredAirports.length > 0 ? (
              <div className="space-y-1">
                {filteredAirports.map(a => (
                  <div 
                    key={a.code} 
                    className="flex items-center justify-between p-1.5 hover:bg-secondary/20 cursor-pointer rounded text-xs group transition-colors"
                    onClick={() => {
                      onChange(a.code);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-secondary">{a.code}</span>
                      <span className="text-[9px] text-white/50">{a.cityAr}</span>
                    </div>
                    <span className="text-[9px] text-white/30">{a.cityEn}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[10px] text-white/30">
                لا توجد نتائج
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
