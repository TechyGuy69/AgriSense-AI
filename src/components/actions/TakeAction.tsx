import { useState } from 'react';
import { Play, CheckCircle, Timer, MapPin, Send, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import clsx from 'clsx';

interface ActionInProgress {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  estimatedDuration: number;
  status: 'in_progress' | 'paused' | 'completed';
  currentStep: number;
  totalSteps: number;
  location: string;
  notes: string[];
  photos: string[];
}

interface TakeActionProps {
  action?: {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    urgency: string;
    actions?: string[];
  };
  variant?: 'button' | 'card';
  className?: string;
}

const TakeAction = ({ action, variant = 'button', className }: TakeActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeActions, setActiveActions] = useState<ActionInProgress[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const { toast } = useToast();

  const actionTemplates = [
    {
      title: 'Irrigation System Check',
      description: 'Complete inspection and adjustment of irrigation system',
      estimatedDuration: 120,
      steps: ['Check water pressure', 'Inspect sprinkler heads', 'Test soil moisture sensors', 'Adjust watering schedule', 'Document findings']
    },
    {
      title: 'Pest Monitoring',
      description: 'Visual inspection for pest activity and damage',
      estimatedDuration: 90,
      steps: ['Walk field perimeter', 'Photograph pest damage', 'Check traps', 'Record pest levels', 'Recommend treatment']
    }
  ];

  const fieldLocations = [
    'Field Sector A - North',
    'Field Sector B - East',
    'Field Sector C - South',
    'Field Sector D - West',
    'Greenhouse Complex'
  ];

  const startAction = (template: any) => {
    const newAction: ActionInProgress = {
      id: Date.now().toString(),
      title: action?.title || template.title,
      description: action?.description || template.description,
      startTime: new Date(),
      estimatedDuration: template.estimatedDuration,
      status: 'in_progress',
      currentStep: 1,
      totalSteps: template.steps.length,
      location: selectedLocation,
      notes: [],
      photos: []
    };
    setActiveActions(prev => [...prev, newAction]);
    setIsOpen(false);
    toast({ title: 'Action Started', description: `${newAction.title} is now in progress` });
  };

  const completeAction = (actionId: string) => {
    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId ? { ...action, status: 'completed', currentStep: action.totalSteps } : action
      )
    );
    toast({ title: 'Action Completed', description: 'Action marked as completed' });
  };

  const pauseAction = (actionId: string) => {
    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId ? { ...action, status: action.status === 'paused' ? 'in_progress' : 'paused' } : action
      )
    );
  };

  const getElapsedTime = (startTime: Date) => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getProgress = (current: number, total: number) => Math.round((current / total) * 100);

  // --- Variant: Button ---
  if (variant === 'button') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant={action?.urgency === 'urgent' ? 'default' : 'outline'}
            className={clsx("flex items-center gap-2", className)}
          >
            <Play className="h-4 w-4" />
            {action?.urgency === 'urgent' ? 'Take Action Now' : 'Start Action'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Start New Action
            </DialogTitle>
            <DialogDescription>Begin field activities with guided workflows</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Field Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field location" />
                </SelectTrigger>
                <SelectContent>
                  {fieldLocations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Action Type</Label>
              {actionTemplates.map((template, i) => (
                <Card key={i} onClick={() => selectedLocation && startAction(template)} className="cursor-pointer hover:bg-muted transition">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline">{template.estimatedDuration} min</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Variant: Card ---
  return (
    <Card className={clsx("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span>{action?.title}</span>
          <Badge variant="secondary">{action?.priority}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{action?.description}</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2">
          <Progress value={getProgress(1, 5)} className="sm:w-2/3" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="success"
              onClick={() => completeAction(action?.title || "")}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => pauseAction(action?.title || "")}
              className="w-full sm:w-auto"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TakeAction;
