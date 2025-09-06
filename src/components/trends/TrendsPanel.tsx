import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, BarChart3, RefreshCw, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExportActions from '@/components/actions/ExportActions';
import ActionScheduler from '@/components/actions/ActionScheduler';

interface TrendPrediction {
  predicted_ndvi: { value: number; change_percent: number; confidence: number };
  predicted_gndvi: { value: number; change_percent: number; confidence: number };
  predicted_vpd: { value: number; change_percent: number; confidence: number };
  risk_score: { level: string; trend: string; confidence: number };
  environmental_forecast: {
    temperature_range: { min: number; max: number };
    soil_moisture_prediction: number;
    irrigation_needed: boolean;
  };
  trend_summary: {
    positive_trends: string[];
    concerning_trends: string[];
    stable_conditions: string[];
  };
}

const TrendsPanel = () => {
  const [predictions, setPredictions] = useState<TrendPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  // Simulate current field data (in real app, this would come from sensors/API)
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

  const fetchAIPredictions = async (timeframe = '7 days') => {
    setIsLoading(true);
    try {
      const fieldData = getCurrentFieldData();
      
      const { data, error } = await supabase.functions.invoke('ai-crop-predictions', {
        body: {
          fieldData,
          predictionType: 'trends',
          timeframe
        }
      });

      if (error) throw error;

      setPredictions(data);
      setLastUpdated(new Date());
      
      toast({
        title: 'AI Predictions Updated',
        description: `Generated new trends analysis for ${timeframe}`,
      });
    } catch (error: any) {
      console.error('Failed to fetch AI predictions:', error);
      toast({
        title: 'Prediction Error',
        description: 'Failed to generate AI predictions. Using default data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh predictions every 5 minutes
  useEffect(() => {
    fetchAIPredictions();
    const interval = setInterval(() => fetchAIPredictions(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTrendIcon = (changePercent: number) => {
    if (changePercent > 0) {
      return <TrendingUp className="h-4 w-4 mr-1" />;
    } else if (changePercent < 0) {
      return <TrendingDown className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-500';
    if (changePercent < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI-Powered Crop Trends
          </h1>
          <p className="text-muted-foreground">
            Live predictions and time-series analysis powered by machine learning
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <ExportActions dataType="trends" currentData={predictions} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchAIPredictions('30 days')}
            disabled={isLoading}
          >
            <Calendar className="h-4 w-4 mr-2" />
            30 Day Forecast
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchAIPredictions('7 days')}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh AI'}
          </Button>
        </div>
      </div>

      {/* AI-Powered Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted NDVI</p>
                <p className="text-2xl font-bold text-primary">
                  {predictions?.predicted_ndvi.value.toFixed(2) || '0.72'}
                </p>
                {predictions && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {predictions.predicted_ndvi.confidence}% confidence
                  </Badge>
                )}
              </div>
              <div className={`flex items-center ${getTrendColor(predictions?.predicted_ndvi.change_percent || 5.2)}`}>
                {formatTrendIcon(predictions?.predicted_ndvi.change_percent || 5.2)}
                <span className="text-sm">
                  {predictions?.predicted_ndvi.change_percent.toFixed(1) || '+5.2'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted GNDVI</p>
                <p className="text-2xl font-bold text-crop">
                  {predictions?.predicted_gndvi.value.toFixed(2) || '0.68'}
                </p>
                {predictions && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {predictions.predicted_gndvi.confidence}% confidence
                  </Badge>
                )}
              </div>
              <div className={`flex items-center ${getTrendColor(predictions?.predicted_gndvi.change_percent || 3.1)}`}>
                {formatTrendIcon(predictions?.predicted_gndvi.change_percent || 3.1)}
                <span className="text-sm">
                  {predictions?.predicted_gndvi.change_percent.toFixed(1) || '+3.1'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted VPD</p>
                <p className="text-2xl font-bold text-earth">
                  {predictions?.predicted_vpd.value.toFixed(1) || '1.8'} kPa
                </p>
                {predictions && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {predictions.predicted_vpd.confidence}% confidence
                  </Badge>
                )}
              </div>
              <div className={`flex items-center ${getTrendColor(predictions?.predicted_vpd.change_percent || -2.3)}`}>
                {formatTrendIcon(predictions?.predicted_vpd.change_percent || -2.3)}
                <span className="text-sm">
                  {predictions?.predicted_vpd.change_percent.toFixed(1) || '-2.3'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {predictions?.risk_score.level || 'Low'}
                </p>
                {predictions && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {predictions.risk_score.confidence}% confidence
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">{predictions?.risk_score.trend || 'Improving'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Environmental Forecast */}
      {predictions?.environmental_forecast && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Environmental Forecast</span>
            </CardTitle>
            <CardDescription>
              Machine learning predictions for upcoming field conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-card rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Temperature Range</h4>
                <p className="text-lg font-bold text-primary">
                  {predictions.environmental_forecast.temperature_range.min}°C - {predictions.environmental_forecast.temperature_range.max}°C
                </p>
              </div>
              <div className="p-4 bg-gradient-card rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Soil Moisture</h4>
                <p className="text-lg font-bold text-crop">
                  {predictions.environmental_forecast.soil_moisture_prediction}%
                </p>
              </div>
              <div className="p-4 bg-gradient-card rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Irrigation Alert</h4>
                <Badge 
                  variant={predictions.environmental_forecast.irrigation_needed ? "destructive" : "outline"}
                  className="text-sm"
                >
                  {predictions.environmental_forecast.irrigation_needed ? 'Required Soon' : 'Not Needed'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Trend Summary */}
      {predictions?.trend_summary && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>AI Trend Analysis</CardTitle>
            <CardDescription>
              Machine learning insights from field data patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions.trend_summary.positive_trends.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Positive Trends</h4>
                  <ul className="space-y-1">
                    {predictions.trend_summary.positive_trends.map((trend, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {predictions.trend_summary.concerning_trends.length > 0 && (
                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">Monitor Closely</h4>
                  <ul className="space-y-1">
                    {predictions.trend_summary.concerning_trends.map((trend, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {predictions.trend_summary.stable_conditions.length > 0 && (
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Stable Conditions</h4>
                  <ul className="space-y-1">
                    {predictions.trend_summary.stable_conditions.map((trend, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {trend}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Scheduler */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Action Planning
          </CardTitle>
          <CardDescription>
            Schedule actions based on AI trend predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionScheduler />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsPanel;