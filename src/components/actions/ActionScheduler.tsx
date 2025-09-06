import { useState } from 'react';
import { Calendar, Clock, Bell, Plus, AlertTriangle, CheckCircle, MapPin, Droplets, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ScheduledAction {
  id: string;
  title: string;
  description: string;
  actionType: string;
  priority: 'High' | 'Medium' | 'Low';
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'completed' | 'overdue';
  location?: string;
  notifications: boolean;
  estimatedDuration: string;
  equipmentNeeded?: string[];
  weatherDependent: boolean;
}

interface ActionSchedulerProps {
  defaultAction?: {
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    urgency: string;
  };
}

const ActionScheduler = ({ defaultAction }: ActionSchedulerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([
    {
      id: '1',
      title: 'Irrigation System Check',
      description: 'Check irrigation system efficiency and soil moisture levels',
      actionType: 'irrigation',
      priority: 'High',
      scheduledDate: '2024-01-08',
      scheduledTime: '06:00',
      status: 'pending',
      location: 'Field Sector A',
      notifications: true,
      estimatedDuration: '2 hours',
      equipmentNeeded: ['Moisture sensors', 'Irrigation controller'],
      weatherDependent: false
    },
    {
      id: '2',
      title: 'Pest Monitoring',
      description: 'Visual inspection for pest activity and damage assessment',
      actionType: 'monitoring',
      priority: 'Medium',
      scheduledDate: '2024-01-09',
      scheduledTime: '08:00',
      status: 'pending',
      location: 'All sectors',
      notifications: true,
      estimatedDuration: '3 hours',
      equipmentNeeded: ['Inspection tools', 'Camera'],
      weatherDependent: true
    }
  ]);

  const [newAction, setNewAction] = useState({
    title: defaultAction?.title || '',
    description: defaultAction?.description || '',
    actionType: 'irrigation',
    priority: defaultAction?.priority || 'Medium' as const,
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notifications: true,
    estimatedDuration: '1 hour',
    equipmentNeeded: '',
    weatherDependent: false
  });

  const { toast } = useToast();

  const actionTypes = [
    { value: 'irrigation', label: 'Irrigation Management', icon: Droplets },
    { value: 'monitoring', label: 'Field Monitoring', icon: MapPin },
    { value: 'maintenance', label: 'Equipment Maintenance', icon: CheckCircle },
    { value: 'treatment', label: 'Crop Treatment', icon: AlertTriangle },
    { value: 'analysis', label: 'Data Analysis', icon: Calendar },
    { value: 'environmental', label: 'Environmental Check', icon: Thermometer }
  ];

  const handleScheduleAction = () => {
    if (!newAction.title || !newAction.scheduledDate || !newAction.scheduledTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const scheduledAction: ScheduledAction = {
      id: Date.now().toString(),
      ...newAction,
      status: 'pending',
      equipmentNeeded: newAction.equipmentNeeded ? newAction.equipmentNeeded.split(',').map(item => item.trim()) : []
    };

    setScheduledActions(prev => [...prev, scheduledAction]);
    
    // Reset form
    setNewAction({
      title: '',
      description: '',
      actionType: 'irrigation',
      priority: 'Medium',
      scheduledDate: '',
      scheduledTime: '',
      location: '',
      notifications: true,
      estimatedDuration: '1 hour',
      equipmentNeeded: '',
      weatherDependent: false
    });

    setIsOpen(false);

    toast({
      title: 'Action Scheduled',
      description: `${scheduledAction.title} has been scheduled for ${scheduledAction.scheduledDate}`,
    });
  };

  const markAsCompleted = (actionId: string) => {
    setScheduledActions(prev => 
      prev.map(action => 
        action.id === actionId 
          ? { ...action, status: 'completed' as const }
          : action
      )
    );

    toast({
      title: 'Action Completed',
      description: 'Action marked as completed successfully',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Action Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Actions</h3>
          <p className="text-sm text-muted-foreground">Manage and track your field activities</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule New Action
              </DialogTitle>
              <DialogDescription>
                Plan and schedule field activities with smart reminders
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Action Title*</Label>
                  <Input
                    id="title"
                    value={newAction.title}
                    onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Irrigation check"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actionType">Action Type</Label>
                  <Select value={newAction.actionType} onValueChange={(value) => setNewAction(prev => ({ ...prev, actionType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAction.description}
                  onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the action and any specific requirements..."
                  rows={3}
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date*</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={newAction.scheduledDate}
                    onChange={(e) => setNewAction(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Time*</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={newAction.scheduledTime}
                    onChange={(e) => setNewAction(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newAction.priority} onValueChange={(value: 'High' | 'Medium' | 'Low') => setNewAction(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newAction.location}
                    onChange={(e) => setNewAction(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Field Sector A"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                  <Select value={newAction.estimatedDuration} onValueChange={(value) => setNewAction(prev => ({ ...prev, estimatedDuration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 minutes">30 minutes</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                      <SelectItem value="2 hours">2 hours</SelectItem>
                      <SelectItem value="3 hours">3 hours</SelectItem>
                      <SelectItem value="Half day">Half day</SelectItem>
                      <SelectItem value="Full day">Full day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentNeeded">Equipment Needed</Label>
                <Input
                  id="equipmentNeeded"
                  value={newAction.equipmentNeeded}
                  onChange={(e) => setNewAction(prev => ({ ...prev, equipmentNeeded: e.target.value }))}
                  placeholder="e.g., Moisture sensors, Spray equipment (comma separated)"
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders before the scheduled action
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={newAction.notifications}
                    onCheckedChange={(checked) => setNewAction(prev => ({ ...prev, notifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weatherDependent">Weather Dependent</Label>
                    <p className="text-sm text-muted-foreground">
                      Reschedule automatically based on weather conditions
                    </p>
                  </div>
                  <Switch
                    id="weatherDependent"
                    checked={newAction.weatherDependent}
                    onCheckedChange={(checked) => setNewAction(prev => ({ ...prev, weatherDependent: checked }))}
                  />
                </div>
              </div>

              <Button onClick={handleScheduleAction} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Action
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Actions List */}
      <div className="space-y-4">
        {scheduledActions.map((action) => {
          const actionType = actionTypes.find(type => type.value === action.actionType);
          const ActionIcon = actionType?.icon || Calendar;
          
          return (
            <Card key={action.id} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ActionIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(action.priority)}>
                      {action.priority}
                    </Badge>
                    <Badge className={getStatusColor(action.status)}>
                      {action.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{action.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{action.scheduledTime}</span>
                  </div>
                  {action.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{action.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{action.estimatedDuration}</span>
                  </div>
                </div>

                {action.equipmentNeeded && action.equipmentNeeded.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-foreground mb-1">Equipment Needed:</p>
                    <div className="flex flex-wrap gap-1">
                      {action.equipmentNeeded.map((equipment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {action.notifications && (
                      <Badge variant="outline" className="text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        Notifications
                      </Badge>
                    )}
                    {action.weatherDependent && (
                      <Badge variant="outline" className="text-xs">
                        Weather Dependent
                      </Badge>
                    )}
                  </div>
                  
                  {action.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => markAsCompleted(action.id)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {scheduledActions.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Actions Scheduled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule field activities and track your progress
              </p>
              <Button variant="outline" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Action
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActionScheduler;