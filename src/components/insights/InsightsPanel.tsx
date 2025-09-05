import { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Droplets, Thermometer, Wind, Brain, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  top_risk_drivers: Array<{
    factor: string;
    impact: 'High' | 'Medium' | 'Low';
    trend: string;
    description: string;
    icon_type: string;
    current_value: number;
    optimal_range: string;
  }>;
  action_recommendations: Array<{
    priority: 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    urgency: 'urgent' | 'moderate' | 'routine';
    actions: string[];
    expected_outcome: string;
    timeframe: string;
  }>;
  model_confidence: {
    risk_assessment: number;
    data_quality: number;
    prediction_reliability: number;
  };
}

const InsightsPanel = () => {
  const [aiInsights, setAIInsights] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  // Default fallback data
  const defaultTopDrivers = [
    {
      factor: 'Soil Moisture',
      impact: 'High' as const,
      trend: 'Decreasing',
      description: 'Soil moisture levels have dropped 15% in the past week',
      icon: Droplets,
      color: 'text-blue-500',
    },
    {
      factor: 'Temperature Stress',
      impact: 'Medium' as const,
      trend: 'Increasing',
      description: 'Daytime temperatures exceeding optimal range for crop type',
      icon: Thermometer,
      color: 'text-red-500',
    },
    {
      factor: 'Wind Exposure',
      impact: 'Low' as const,
      trend: 'Stable',
      description: 'Wind patterns within acceptable limits',
      icon: Wind,
      color: 'text-gray-500',
    },
  ];

  const defaultActionCards = [
    {
      priority: 'High' as const,
      title: 'Irrigation Scheduling',
      description: 'Soil moisture levels are below optimal. Consider scheduling irrigation within 48 hours.',
      actions: ['Check soil moisture sensors', 'Review irrigation system', 'Schedule watering'],
      urgency: 'urgent' as const,
    },
    {
      priority: 'Medium' as const,
      title: 'Heat Stress Mitigation',
      description: 'Temperature trends suggest potential heat stress. Monitor crop response closely.',
      actions: ['Increase monitoring frequency', 'Consider shade management', 'Adjust irrigation timing'],
      urgency: 'moderate' as const,
    },
    {
      priority: 'Low' as const,
      title: 'Nutrient Management',
      description: 'NDVI patterns suggest adequate nutrition levels. Continue current program.',
      actions: ['Maintain fertilizer schedule', 'Monitor for deficiency signs'],
      urgency: 'routine' as const,
    },
  ];

  // Simulate current field data
  const getCurrentFieldData = () => ({
    ndvi: 0.72,
    gndvi: 0.68,
    temperature: 25,
    soilMoisture: 65,
    vpd: 1.8,
    fieldSize: 45.2,
    cropType: 'Corn',
    growthStage: 'Vegetative',
    lastRainfall: 12,
    humidity: 70
  });

  const fetchAIInsights = async () => {
    setIsLoading(true);
    try {
      const fieldData = getCurrentFieldData();
      
      const { data, error } = await supabase.functions.invoke('ai-crop-predictions', {
        body: {
          fieldData,
          predictionType: 'insights',
          timeframe: '7 days'
        }
      });

      if (error) throw error;

      setAIInsights(data);
      setLastUpdated(new Date());
      
      toast({
        title: 'AI Insights Updated',
        description: 'Generated new recommendations and risk analysis',
      });
    } catch (error: any) {
      console.error('Failed to fetch AI insights:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to generate AI insights. Using default data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh insights every 10 minutes
  useEffect(() => {
    fetchAIInsights();
    const interval = setInterval(() => fetchAIInsights(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'moisture': return Droplets;
      case 'temperature': return Thermometer;
      case 'wind': return Wind;
      case 'nutrition': return Activity;
      default: return Droplets;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'routine': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const topDrivers = aiInsights?.top_risk_drivers || defaultTopDrivers.map(driver => ({
    ...driver,
    icon_type: 'moisture',
    current_value: 65,
    optimal_range: '70-80%'
  }));

  const actionCards = aiInsights?.action_recommendations || defaultActionCards;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Insights & Recommendations
          </h1>
          <p className="text-muted-foreground">
            Live AI-powered analysis of crop conditions and actionable recommendations
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last analysis: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAIInsights}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Refresh AI'}
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Why Section - Top Drivers */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Why: AI-Identified Risk Drivers</span>
          </CardTitle>
          <CardDescription>
            Machine learning analysis of key factors influencing crop health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDrivers.map((driver, index) => {
              const IconComponent = getIconComponent(driver.icon_type || 'moisture');
              const fallbackIcon = defaultTopDrivers[index]?.icon || Droplets;
              const Icon = IconComponent || fallbackIcon;
              const color = defaultTopDrivers[index]?.color || 'text-blue-500';
              
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <div className={`p-2 rounded-lg bg-background ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-foreground">{driver.factor}</h4>
                      <Badge variant={driver.impact === 'High' ? 'destructive' : driver.impact === 'Medium' ? 'secondary' : 'outline'}>
                        {driver.impact} Impact
                      </Badge>
                      {aiInsights && (
                        <Badge variant="outline" className="text-xs">
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{driver.description}</p>
                    {aiInsights && driver.current_value && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {driver.current_value} | Optimal: {driver.optimal_range}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{driver.trend}</p>
                    <p className="text-xs text-muted-foreground">Trend</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* What To Do Section - Action Cards */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>What To Do: AI Action Recommendations</span>
          </CardTitle>
          <CardDescription>
            Prioritized actions based on real-time AI analysis and risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {actionCards.map((card, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getUrgencyColor(card.urgency)}>
                    {card.priority} Priority
                  </Badge>
                  <div className="flex items-center gap-2">
                    {card.urgency === 'urgent' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {aiInsights && (
                      <Badge variant="outline" className="text-xs">
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{card.title}</h4>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                  {aiInsights && 'expected_outcome' in card && (
                    <p className="text-xs text-primary mt-1">
                      Expected outcome: {card.expected_outcome}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Recommended Actions:</h5>
                  <ul className="space-y-1">
                    {card.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-center text-sm text-muted-foreground">
                        <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                  {aiInsights && 'timeframe' in card && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Timeframe: {card.timeframe}
                    </p>
                  )}
                </div>

                <Button 
                  variant={card.urgency === 'urgent' ? 'default' : 'outline'} 
                  className="w-full"
                >
                  {card.urgency === 'urgent' ? 'Take Action Now' : 'Schedule Action'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Model Confidence */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Model Confidence & Data Quality</span>
          </CardTitle>
          <CardDescription>
            Real-time reliability metrics for current analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {aiInsights?.model_confidence.risk_assessment || 87}%
              </div>
              <p className="text-sm text-muted-foreground">Risk Model Confidence</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${aiInsights?.model_confidence.risk_assessment || 87}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crop mb-2">
                {aiInsights?.model_confidence.data_quality || 92}%
              </div>
              <p className="text-sm text-muted-foreground">Data Completeness</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-crop h-2 rounded-full" 
                  style={{ width: `${aiInsights?.model_confidence.data_quality || 92}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-earth mb-2">
                {aiInsights?.model_confidence.prediction_reliability || 88}%
              </div>
              <p className="text-sm text-muted-foreground">Prediction Reliability</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-earth h-2 rounded-full" 
                  style={{ width: `${aiInsights?.model_confidence.prediction_reliability || 88}%` }}
                ></div>
              </div>
            </div>
          </div>
          {aiInsights && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground text-center">
                <Brain className="h-4 w-4 inline mr-1" />
                Live AI analysis powered by GPT-4.1 • Updated every 10 minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;