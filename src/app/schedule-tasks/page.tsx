'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { landMonitoringService } from '@/services/landMonitoring';

const COMMON_TASKS = [
  'Apply fertilizer',
  'Check irrigation',
  'Spray pesticide',
  'Inspect for pests',
  'Weed removal',
  'Soil testing',
  'Harvest preparation'
];

export default function ScheduleTasksPage() {
  const router = useRouter();
  const [lands, setLands] = useState<any[]>([]);
  const [selectedLand, setSelectedLand] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskType, setTaskType] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('09:00');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedLands = JSON.parse(localStorage.getItem('lands') || '[]');
    setLands(storedLands);
    
    if (storedLands.length > 0) {
      setSelectedLand(storedLands[0].id);
      const landTasks = landMonitoringService.getScheduledTasks(storedLands[0].id);
      setTasks(landTasks);
    }
  };

  const handleLandChange = (landId: string) => {
    setSelectedLand(landId);
    const landTasks = landMonitoringService.getScheduledTasks(landId);
    setTasks(landTasks);
  };

  const handleAddTask = () => {
    if (!selectedLand || !taskDate) return;
    
    const taskName = taskType === 'preset' ? selectedPreset : customTask;
    if (!taskName) return;

    const newTask = {
      task: taskName,
      date: taskDate,
      time: taskTime,
      status: 'pending'
    };

    landMonitoringService.addScheduledTask(selectedLand, newTask);
    
    // Reload tasks
    const updatedTasks = landMonitoringService.getScheduledTasks(selectedLand);
    setTasks(updatedTasks);
    
    // Reset form
    setShowAddTask(false);
    setSelectedPreset('');
    setCustomTask('');
    setTaskDate('');
    setTaskTime('09:00');
  };

  const handleCompleteTask = (taskId: string) => {
    const allTasks = JSON.parse(localStorage.getItem('scheduled_tasks') || '{}');
    if (allTasks[selectedLand]) {
      const taskIndex = allTasks[selectedLand].findIndex((t: any) => t.id === taskId);
      if (taskIndex !== -1) {
        allTasks[selectedLand][taskIndex].status = 'completed';
        localStorage.setItem('scheduled_tasks', JSON.stringify(allTasks));
        setTasks(allTasks[selectedLand]);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const allTasks = JSON.parse(localStorage.getItem('scheduled_tasks') || '{}');
    if (allTasks[selectedLand]) {
      allTasks[selectedLand] = allTasks[selectedLand].filter((t: any) => t.id !== taskId);
      localStorage.setItem('scheduled_tasks', JSON.stringify(allTasks));
      setTasks(allTasks[selectedLand]);
    }
  };

  const upcomingTasks = tasks.filter(t => t.status === 'pending' && new Date(t.date) >= new Date());
  const pastTasks = tasks.filter(t => t.status === 'pending' && new Date(t.date) < new Date());
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="ml-4 text-xl font-bold">Task Scheduler</h1>
          </div>
          <Button onClick={() => setShowAddTask(true)} className="bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Land Selector */}
        {lands.length > 1 && (
          <div className="mb-6">
            <Label>Select Land</Label>
            <select
              value={selectedLand}
              onChange={(e) => handleLandChange(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mt-1"
            >
              {lands.map(land => (
                <option key={land.id} value={land.id}>
                  {land.district}, {land.state} - {land.size} acres
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upcoming Tasks */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Upcoming Tasks ({upcomingTasks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(task.date).toLocaleDateString()} at {task.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleCompleteTask(task.id)} className="bg-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No upcoming tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Past Due Tasks */}
        {pastTasks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Clock className="w-5 h-5" />
                <span>Past Due ({pastTasks.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{task.task}</p>
                        <p className="text-sm text-red-600">
                          {new Date(task.date).toLocaleDateString()} at {task.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleCompleteTask(task.id)} className="bg-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Completed ({completedTasks.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.task}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(task.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Task Type</Label>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant={taskType === 'preset' ? 'default' : 'outline'}
                    onClick={() => setTaskType('preset')}
                    className="flex-1"
                  >
                    Preset
                  </Button>
                  <Button
                    variant={taskType === 'custom' ? 'default' : 'outline'}
                    onClick={() => setTaskType('custom')}
                    className="flex-1"
                  >
                    Custom
                  </Button>
                </div>
              </div>

              {taskType === 'preset' ? (
                <div>
                  <Label>Select Task</Label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 mt-1"
                  >
                    <option value="">Choose a task...</option>
                    {COMMON_TASKS.map(task => (
                      <option key={task} value={task}>{task}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label>Custom Task</Label>
                  <Input
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="Enter task description..."
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTask}
                  disabled={!taskDate || (taskType === 'preset' ? !selectedPreset : !customTask)}
                  className="flex-1 bg-green-600"
                >
                  Add Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
