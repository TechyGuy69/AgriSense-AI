import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TrendsPanel = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Crop Health Trends
        </h1>
        <p className="text-muted-foreground">
          Time-series analysis of vegetation indices and environmental factors
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg NDVI</p>
                <p className="text-2xl font-bold text-primary">0.72</p>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">+5.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GNDVI</p>
                <p className="text-2xl font-bold text-crop">0.68</p>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">+3.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VPD</p>
                <p className="text-2xl font-bold text-earth">1.8 kPa</p>
              </div>
              <div className="flex items-center text-red-500">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm">-2.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-foreground">Low</p>
              </div>
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Improving</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vegetation Indices Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Vegetation Indices</span>
            </CardTitle>
            <CardDescription>
              NDVI and GNDVI trends over the growing season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Time-series chart placeholder</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to backend to display real data
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last 30 days</span>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Change Period
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Factors Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Environmental Factors</span>
            </CardTitle>
            <CardDescription>
              Weather and soil conditions affecting crop health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-card rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Environmental data chart</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Temperature, humidity, VPD, GDD
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Temperature Range</span>
                <span className="text-foreground">18°C - 28°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Soil Moisture</span>
                <span className="text-foreground">65% capacity</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Trend Summary</CardTitle>
          <CardDescription>
            Key insights from the latest data analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">Positive Trend</h4>
              <p className="text-sm text-muted-foreground">
                NDVI values have increased 5.2% over the past 2 weeks, indicating healthy crop growth.
              </p>
            </div>
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">Monitor Closely</h4>
              <p className="text-sm text-muted-foreground">
                VPD levels are rising. Consider irrigation adjustments if trend continues.
              </p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Stable Conditions</h4>
              <p className="text-sm text-muted-foreground">
                Overall field conditions remain optimal for continued crop development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsPanel;