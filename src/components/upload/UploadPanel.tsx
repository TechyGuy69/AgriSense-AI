import { useState, useCallback } from 'react';
import { Upload, FileImage, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UploadPanel = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ type: string; name: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ text: string; json?: any } | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newFiles: { type: string; name: string }[] = [];
    
    files.forEach((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['tif', 'tiff', 'hdr', 'img'].includes(extension || '')) {
        newFiles.push({ type: 'image', name: file.name });
      } else if (['csv'].includes(extension || '')) {
        newFiles.push({ type: 'data', name: file.name });
      } else {
        toast({
          title: 'Unsupported file type',
          description: `${file.name} is not a supported format.`,
          variant: 'destructive',
        });
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast({
        title: 'Files uploaded',
        description: `${newFiles.length} file(s) uploaded successfully.`,
      });
    }
  };

  const loadDemoData = () => {
    setUploadedFiles([
      { type: 'image', name: 'demo_field_rgb.tif' },
      { type: 'data', name: 'demo_sensors.csv' },
    ]);
    toast({
      title: 'Demo data loaded',
      description: 'Sample field data and sensor readings loaded.',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Upload Field Data
          </h1>
          <p className="text-muted-foreground">
            Upload satellite imagery and sensor data for analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDemoData}>
            Load Demo Data
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>File Upload</span>
            </CardTitle>
            <CardDescription>
              Drag and drop files or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: GeoTIFF (.tif), ENVI (.hdr, .img), CSV (.csv)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".tif,.tiff,.hdr,.img,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />
            </div>

          </CardContent>
        </Card>

        {/* File List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Files ready for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                  >
                    {file.type === 'image' ? (
                      <FileImage className="h-5 w-5 text-earth" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-crop" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.type === 'image' ? 'Satellite/Aerial Imagery' : 'Sensor Data'}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <Button variant="hero" className="w-full" onClick={processData} disabled={processing}>
                  {processing ? 'Processing…' : 'Process Data'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supported Formats */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Supported File Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                <FileImage className="h-4 w-4 mr-2 text-earth" />
                Imagery Files
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GeoTIFF (.tif, .tiff) - Georeferenced satellite/drone imagery</li>
                <li>• ENVI (.hdr, .img) - Hyperspectral data format</li>
                <li>• Multi-band imagery with Red, Green, Blue, NIR channels</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-crop" />
                Sensor Data
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CSV (.csv) - Weather and sensor measurements</li>
                <li>• Columns: date, temperature, humidity, soil_moisture, etc.</li>
                <li>• Daily or hourly time series data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPanel;