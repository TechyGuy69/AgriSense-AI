import { useState } from 'react';
import Header from '@/components/navigation/Header';
import HeroSection from '@/components/home/HeroSection';
import UploadPanel from '@/components/upload/UploadPanel';
import MapViewer from '@/components/dashboard/MapViewer';
import TrendsPanel from '@/components/trends/TrendsPanel';
import InsightsPanel from '@/components/insights/InsightsPanel';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return <UploadPanel />;
      case 'dashboard':
        return (
          <div className="p-6 h-screen">
            <MapViewer />
          </div>
        );
      case 'trends':
        return <TrendsPanel />;
      case 'insights':
        return <InsightsPanel />;
      default:
        return (
          <div className="p-6 h-screen">
            <MapViewer />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      {renderContent()}
    </div>
  );
};

export default Index;
