import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Droplets, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const InsightsPanel = () => {
  const topDrivers = [
    {
      factor: 'Soil Moisture',
      impact: 'High',
      trend: 'Decreasing',
      description: 'Soil moisture levels have dropped 15% in the past week',
      icon: Droplets,
      color: 'text-blue-500',
    },
    {
      factor: 'Temperature Stress',
      impact: 'Medium',
      trend: 'Increasing',
      description: 'Daytime temperatures exceeding optimal range for crop type',
      icon: Thermometer,
      color: 'text-red-500',
    },
    {
      factor: 'Wind Exposure',
      impact: 'Low',
      trend: 'Stable',
      description: 'Wind patterns within acceptable limits',
      icon: Wind,
      color: 'text-gray-500',
    },
  ];

  const actionCards = [
    {
      priority: 'High',
      title: 'Irrigation Scheduling',
      description: 'Soil moisture levels are below optimal. Consider scheduling irrigation within 48 hours.',
      actions: ['Check soil moisture sensors', 'Review irrigation system', 'Schedule watering'],
      urgency: 'urgent',
    },
    {
      priority: 'Medium',
      title: 'Heat Stress Mitigation',
      description: 'Temperature trends suggest potential heat stress. Monitor crop response closely.',
      actions: ['Increase monitoring frequency', 'Consider shade management', 'Adjust irrigation timing'],
      urgency: 'moderate',
    },
    {
      priority: 'Low',
      title: 'Nutrient Management',
      description: 'NDVI patterns suggest adequate nutrition levels. Continue current program.',
      actions: ['Maintain fertilizer schedule', 'Monitor for deficiency signs'],
      urgency: 'routine',
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'routine': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Crop Health Insights
        </h1>
        <p className="text-muted-foreground">
          AI-powered analysis of crop conditions and actionable recommendations
        </p>
      </div>

      {/* Why Section - Top Drivers */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Why: Top Risk Drivers</span>
          </CardTitle>
          <CardDescription>
            Key factors currently influencing crop health and risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDrivers.map((driver, index) => {
              const Icon = driver.icon;
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <div className={`p-2 rounded-lg bg-background ${driver.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-foreground">{driver.factor}</h4>
                      <Badge variant={driver.impact === 'High' ? 'destructive' : driver.impact === 'Medium' ? 'secondary' : 'outline'}>
                        {driver.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{driver.description}</p>
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
            <span>What To Do: Action Recommendations</span>
          </CardTitle>
          <CardDescription>
            Prioritized actions based on current field conditions and risk analysis
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
                  {card.urgency === 'urgent' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">{card.title}</h4>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
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
          <CardTitle>Model Confidence & Data Quality</CardTitle>
          <CardDescription>
            Reliability metrics for current analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">87%</div>
              <p className="text-sm text-muted-foreground">Risk Model Confidence</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crop mb-2">92%</div>
              <p className="text-sm text-muted-foreground">Data Completeness</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-crop h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-earth mb-2">15</div>
              <p className="text-sm text-muted-foreground">Days of Historical Data</p>
              <p className="text-xs text-muted-foreground mt-1">Minimum: 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;