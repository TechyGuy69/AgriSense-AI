import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, Timer, MapPin, Camera, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ActionInProgress {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  estimatedDuration: number; // in minutes
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
}

const TakeAction = ({ action, variant = 'button' }: TakeActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeActions, setActiveActions] = useState<ActionInProgress[]>([]);
  const [newActionNote, setNewActionNote] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const { toast } = useToast();

  // Predefined action templates
  const actionTemplates = [
    {
      title: 'Irrigation System Check',
      description: 'Complete inspection and adjustment of irrigation system',
      estimatedDuration: 120,
      steps: [
        'Check water pressure and flow rates',
        'Inspect sprinkler heads for clogs',
        'Test soil moisture sensors',
        'Adjust watering schedule if needed',
        'Document findings and recommendations'
      ]
    },
    {
      title: 'Pest Monitoring',
      description: 'Visual inspection for pest activity and damage',
      estimatedDuration: 90,
      steps: [
        'Walk field perimeter and inspect plants',
        'Photograph any pest damage or insects found',
        'Check pest trap stations',
        'Record pest levels and locations',
        'Recommend treatment if needed'
      ]
    },
    {
      title: 'Soil Sampling',
      description: 'Collect soil samples for laboratory analysis',
      estimatedDuration: 60,
      steps: [
        'Mark sampling locations on field map',
        'Collect soil samples from designated points',
        'Label and package samples properly',
        'Complete sample submission forms',
        'Schedule laboratory pickup'
      ]
    },
    {
      title: 'Nutrient Application',
      description: 'Apply fertilizers or nutrients to designated areas',
      estimatedDuration: 180,
      steps: [
        'Prepare equipment and calibrate spreader',
        'Calculate application rates',
        'Apply nutrients to designated zones',
        'Record application rates and coverage',
        'Clean and store equipment'
      ]
    }
  ];

  const fieldLocations = [
    'Field Sector A - North',
    'Field Sector B - East',
    'Field Sector C - South',
    'Field Sector D - West',
    'Greenhouse Complex',
    'Equipment Shed',
    'Irrigation Control Station'
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

    toast({
      title: 'Action Started',
      description: `${newAction.title} is now in progress`,
    });
  };

  const updateActionProgress = (actionId: string, step: number) => {
    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, currentStep: step }
          : action
      )
    );
  };

  const addNote = (actionId: string, note: string) => {
    if (!note.trim()) return;

    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, notes: [...action.notes, `${new Date().toLocaleTimeString()}: ${note}`] }
          : action
      )
    );

    setNewActionNote('');
    toast({
      title: 'Note Added',
      description: 'Note has been added to the action log',
    });
  };

  const completeAction = (actionId: string) => {
    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, status: 'completed', currentStep: action.totalSteps }
          : action
      )
    );

    toast({
      title: 'Action Completed',
      description: 'Action has been marked as completed successfully',
    });
  };

  const pauseAction = (actionId: string) => {
    setActiveActions(prev =>
      prev.map(action =>
        action.id === actionId
          ? { ...action, status: action.status === 'paused' ? 'in_progress' : 'paused' }
          : action
      )
    );
  };

  const getElapsedTime = (startTime: Date) => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60); // minutes
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getProgress = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  if (variant === 'card' && activeActions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="text-center py-8">
          <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No Active Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start field activities and track progress in real-time
          </p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Start New Action
              </Button>
            </DialogTrigger>
            <ActionDialog />
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  function ActionDialog() {
    return (
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Start New Action
          </DialogTitle>
          <DialogDescription>
            Begin field activities with guided workflows and progress tracking
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Location Selection */}
          <div className="space-y-2">
            <Label>Field Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select field location" />
              </SelectTrigger>
              <SelectContent>
                {fieldLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Templates */}
          <div className="space-y-2">
            <Label>Select Action Type</Label>
            <div className="space-y-2">
              {actionTemplates.map((template, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer transition-colors hover:bg-muted"
                  onClick={() => selectedLocation && startAction(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{template.title}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {template.estimatedDuration} min
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.steps.length} steps
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {!selectedLocation && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please select a field location to continue
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Actions Header */}
      {activeActions.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Actions in Progress</h3>
            <p className="text-sm text-muted-foreground">Real-time field activity tracking</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                New Action
              </Button>
            </DialogTrigger>
            <ActionDialog />
          </Dialog>
        </div>
      )}

      {/* Take Action Button */}
      {variant === 'button' && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant={action?.urgency === 'urgent' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {action?.urgency === 'urgent' ? 'Take Action Now' : 'Start Action'}
            </Button>
          </DialogTrigger>
          <ActionDialog />
        </Dialog>
      )}

      {/* Active Actions List */}
      {activeActions.map((activeAction) => (
        <Card key={activeAction.id} className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeAction.status === 'completed' ? 'bg-green-100 text-green-600' :
                  activeAction.status === 'paused' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {activeAction.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : activeAction.status === 'paused' ? (
                    <Timer className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{activeAction.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{activeAction.description}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={
                  activeAction.status === 'completed' ? 'default' :
                  activeAction.status === 'paused' ? 'secondary' : 'outline'
                }>
                  {activeAction.status === 'completed' ? 'Completed' :
                   activeAction.status === 'paused' ? 'Paused' : 'In Progress'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Elapsed: {getElapsedTime(activeAction.startTime)}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: Step {activeAction.currentStep} of {activeAction.totalSteps}</span>
                <span>{getProgress(activeAction.currentStep, activeAction.totalSteps)}%</span>
              </div>
              <Progress value={getProgress(activeAction.currentStep, activeAction.totalSteps)} />
            </div>

            {/* Location and Time Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{activeAction.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span>Est. {activeAction.estimatedDuration} min</span>
              </div>
            </div>

            {/* Step Controls */}
            {activeAction.status !== 'completed' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateActionProgress(activeAction.id, Math.max(1, activeAction.currentStep - 1))}
                  disabled={activeAction.currentStep <= 1}
                >
                  Previous Step
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (activeAction.currentStep >= activeAction.totalSteps) {
                      completeAction(activeAction.id);
                    } else {
                      updateActionProgress(activeAction.id, activeAction.currentStep + 1);
                    }
                  }}
                >
                  {activeAction.currentStep >= activeAction.totalSteps ? 'Complete Action' : 'Next Step'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pauseAction(activeAction.id)}
                >
                  {activeAction.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Action Notes</Label>
              {activeAction.notes.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {activeAction.notes.map((note, index) => (
                    <p key={index} className="text-xs bg-muted p-2 rounded">
                      {note}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newActionNote}
                  onChange={(e) => setNewActionNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addNote(activeAction.id, newActionNote);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNote(activeAction.id, newActionNote)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* No Actions State for Button Variant */}
      {variant === 'button' && activeActions.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-6">
            <Play className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No actions currently in progress
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TakeAction;