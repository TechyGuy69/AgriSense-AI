import { Upload, Map, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import heroField from '@/assets/hero-field.jpg';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const features = [
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Upload GeoTIFF, ENVI imagery and CSV sensor data',
    },
    {
      icon: Map,
      title: 'Interactive Maps',
      description: 'Visualize NDVI, stress maps, and risk assessment',
    },
    {
      icon: TrendingUp,
      title: 'Trend Analysis',
      description: 'Track vegetation health over time',
    },
    {
      icon: Lightbulb,
      title: 'AI Insights',
      description: 'Get actionable recommendations for crop management',
    },
  ];

  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Smart Crop Risk
                <span className="bg-gradient-hero bg-clip-text text-transparent"> Assessment</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Advanced satellite imagery analysis and AI-powered insights to optimize 
                crop health monitoring, predict risks, and improve agricultural outcomes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={onGetStarted}
                className="text-lg px-8 py-4"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Try Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="shadow-card hover:shadow-elegant transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroField} 
                alt="Agricultural field aerial view" 
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              
              {/* Overlay Stats */}
              <div className="absolute bottom-6 left-6 right-6">
                <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">98.5%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-crop">2.3M</div>
                        <div className="text-xs text-muted-foreground">Hectares Analyzed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-earth">24/7</div>
                        <div className="text-xs text-muted-foreground">Monitoring</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;