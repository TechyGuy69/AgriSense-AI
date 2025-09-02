import { useState } from 'react';
import { Menu, X, Leaf, Map, TrendingUp, Lightbulb, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: Map },
    { name: 'Upload', id: 'upload', icon: Upload },
    { name: 'Trends', id: 'trends', icon: TrendingUp },
    { name: 'Insights', id: 'insights', icon: Lightbulb },
  ];

  return (
    <header className="bg-card border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">CropRisk</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  onClick={() => onSectionChange(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? 'default' : 'ghost'}
                    onClick={() => {
                      onSectionChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;