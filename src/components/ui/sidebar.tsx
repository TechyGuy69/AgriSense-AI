import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Layers,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const MobileSidebar = ({ activeSection, onSectionChange }: MobileSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [layer, setLayer] = useState("satellite");
  const [type, setType] = useState("vegetation");

  const navigation = [
    { name: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { name: "Upload", id: "upload", icon: Upload },
    { name: "Trends", id: "trends", icon: TrendingUp },
    { name: "Insights", id: "insights", icon: Lightbulb },
    { name: "Alerts", id: "alerts", icon: AlertTriangle },
  ];

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 md:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">AgriSense AI</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsOpen(false);
                }}
                className="w-full justify-start flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Sticky bottom controls */}
        <div className="p-4 border-t border-border bg-card">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Layer
              </p>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value)}
                className="w-full text-sm rounded-md border border-input bg-background px-2 py-1"
              >
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Type
              </p>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm rounded-md border border-input bg-background px-2 py-1"
              >
                <option value="vegetation">Vegetation</option>
                <option value="moisture">Moisture</option>
                <option value="temperature">Temperature</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
