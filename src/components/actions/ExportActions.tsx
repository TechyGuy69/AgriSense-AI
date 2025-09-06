import { useState } from 'react';
import { Download, FileText, Map, BarChart3, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ExportActionsProps {
  dataType: 'map' | 'trends' | 'insights' | 'all';
  currentData?: any;
}

const ExportActions = ({ dataType, currentData }: ExportActionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const { toast } = useToast();

  const exportOptions = {
    map: {
      title: 'Export Map Data',
      formats: ['pdf', 'geojson', 'shapefile', 'csv'],
      icon: Map,
      description: 'Export field boundaries, overlays, and spatial data'
    },
    trends: {
      title: 'Export Trends Report',
      formats: ['pdf', 'excel', 'csv', 'json'],
      icon: BarChart3,
      description: 'Export AI predictions and trend analysis'
    },
    insights: {
      title: 'Export Insights Report',
      formats: ['pdf', 'docx', 'excel', 'json'],
      icon: FileText,
      description: 'Export AI recommendations and risk analysis'
    },
    all: {
      title: 'Export Complete Report',
      formats: ['pdf', 'zip'],
      icon: Download,
      description: 'Export comprehensive field analysis package'
    }
  };

  const option = exportOptions[dataType];
  const IconComponent = option.icon;

  const generateExportData = () => {
    const baseData = {
      timestamp: new Date().toISOString(),
      field_info: {
        name: 'North Field - Sector A',
        size: '45.2 hectares',
        crop_type: 'Corn',
        growth_stage: 'Vegetative',
        coordinates: '40.7841°N, 73.9697°W'
      },
      export_settings: {
        format: exportFormat,
        date_range: dateRange,
        include_images: includeImages,
        include_analysis: includeAnalysis
      }
    };

    switch (dataType) {
      case 'map':
        return {
          ...baseData,
          spatial_data: {
            field_boundaries: [
              { lat: 40.7831, lng: -73.9712 },
              { lat: 40.7851, lng: -73.9712 },
              { lat: 40.7851, lng: -73.9682 },
              { lat: 40.7831, lng: -73.9682 }
            ],
            risk_zones: [
              { type: 'high_stress', area: 2.3, coordinates: [40.7840, -73.9705] },
              { type: 'medium_stress', area: 1.8, coordinates: [40.7845, -73.9690] }
            ],
            ndvi_data: { avg: 0.72, min: 0.58, max: 0.84 },
            overlay_layers: ['rgb', 'ndvi', 'stress', 'alerts']
          }
        };
      
      case 'trends':
        return {
          ...baseData,
          predictions: currentData || {
            ndvi_trend: { current: 0.72, predicted: 0.76, confidence: 87 },
            risk_score: { level: 'Low', trend: 'Improving', confidence: 92 },
            environmental_forecast: {
              temperature: { min: 18, max: 28 },
              soil_moisture: 68,
              irrigation_needed: false
            }
          }
        };
      
      case 'insights':
        return {
          ...baseData,
          ai_insights: currentData || {
            risk_drivers: [
              { factor: 'Soil Moisture', impact: 'Medium', trend: 'Decreasing' },
              { factor: 'Temperature Stress', impact: 'Low', trend: 'Stable' }
            ],
            recommendations: [
              { priority: 'High', action: 'Monitor soil moisture', urgency: 'moderate' },
              { priority: 'Medium', action: 'Maintain irrigation schedule', urgency: 'routine' }
            ],
            model_confidence: { risk_assessment: 87, data_quality: 92 }
          }
        };
      
      default:
        return {
          ...baseData,
          complete_analysis: {
            map_data: 'included',
            trends_data: 'included',
            insights_data: 'included'
          }
        };
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = generateExportData();
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download file
      const filename = `agrisense_${dataType}_${dateRange}_${Date.now()}.${exportFormat}`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: `${option.title} exported successfully as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export {dataType === 'all' ? 'Report' : dataType.charAt(0).toUpperCase() + dataType.slice(1)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            {option.title}
          </DialogTitle>
          <DialogDescription>
            {option.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {option.formats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                    {format === 'pdf' && <Badge variant="secondary" className="ml-2">Recommended</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="season">Current Season</SelectItem>
                <SelectItem value="year">Full Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-images">Include Images & Maps</Label>
                <p className="text-sm text-muted-foreground">
                  Include satellite imagery and visual overlays
                </p>
              </div>
              <Switch
                id="include-images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-analysis">Include AI Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Include AI predictions and recommendations
                </p>
              </div>
              <Switch
                id="include-analysis"
                checked={includeAnalysis}
                onCheckedChange={setIncludeAnalysis}
              />
            </div>
          </div>

          {/* Preview Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">{exportFormat.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium">{dateRange.replace(/(\d+)/, '$1 ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Size:</span>
                <span className="font-medium">
                  {includeImages ? '5-15 MB' : '< 1 MB'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {option.title}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportActions;