'use client';

import { useState } from 'react';
import { Calendar, Users, Clock, AlertTriangle, Plus, CheckCircle } from 'lucide-react';
import { SchedulingManager } from '@/lib/scheduling/manager';

export default function SchedulingDashboard() {
  const [schedulingManager] = useState(new SchedulingManager());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStore, setSelectedStore] = useState('store_001');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const shifts = schedulingManager.getShiftsByStore(selectedStore, selectedDate);
  const conflicts = schedulingManager.getScheduleConflicts(selectedStore, selectedDate);
  const employees = schedulingManager.getEmployeesByStore(selectedStore);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver': return 'bg-blue-500';
      case 'kitchen': return 'bg-green-500';
      case 'manager': return 'bg-purple-500';
      case 'cashier': return 'bg-yellow-500';
      case 'prep': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const generateWeekSchedule = () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const newShifts = schedulingManager.generateSchedule(
      selectedStore,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    console.log('Generated shifts:', newShifts);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff Scheduling</h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="store_001">Downtown Flagship</option>
              <option value="store_002">Cambridge Branch</option>
            </select>
            <button
              onClick={generateWeekSchedule}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Auto Schedule
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium text-red-800">Scheduling Conflicts ({conflicts.length})</h3>
              </div>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <p key={index} className="text-sm text-red-700">
                    {conflict.role} {conflict.timeSlot}: {conflict.type} 
                    (Current: {conflict.current}, Required: {conflict.required})
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule View */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Schedule</h2>
            
            {shifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No shifts scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shifts.map((shift) => {
                  const employee = employees.find(emp => emp.id === shift.employeeId);
                  return (
                    <div key={shift.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getRoleColor(shift.role)}`} />
                          <div>
                            <h3 className="font-medium">{employee?.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{shift.role}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shift.status)}`}>
                          {shift.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="text-gray-600">
                          Break: {shift.breakTime}min
                        </div>
                        <div className="text-gray-600">
                          Hours: {((new Date(`2000-01-01T${shift.endTime}:00`).getTime() - 
                                   new Date(`2000-01-01T${shift.startTime}:00`).getTime()) / 
                                   (1000 * 60 * 60)).toFixed(1)}
                        </div>
                      </div>
                      
                      {shift.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{shift.notes}</p>
                      )}
                      
                      <div className="flex space-x-2 mt-3">
                        {shift.status === 'scheduled' && (
                          <button
                            onClick={() => schedulingManager.updateShiftStatus(shift.id, 'confirmed')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Staff Overview */}
          <div className="space-y-6">
            {/* Staff List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Staff Overview
              </h2>
              
              <div className="space-y-3">
                {employees.map((employee) => {
                  const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
                  const todayHours = employeeShifts.reduce((sum, shift) => {
                    return sum + ((new Date(`2000-01-01T${shift.endTime}:00`).getTime() - 
                                   new Date(`2000-01-01T${shift.startTime}:00`).getTime()) / 
                                   (1000 * 60 * 60));
                  }, 0);
                  
                  return (
                    <div key={employee.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{employee.role}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Today:</span>
                          <span>{todayHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>This Week:</span>
                          <span>{employee.currentHoursThisWeek}h / {employee.maxHoursPerWeek}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span>${employee.hourlyRate}/hr</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(employee.currentHoursThisWeek / employee.maxHoursPerWeek) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </button>
                
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All
                </button>
                
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">
                  View Payroll
                </button>
                
                <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                  Export Schedule
                </button>
              </div>
            </div>

            {/* Schedule Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Today's Stats</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Shifts:</span>
                  <span className="font-medium">{shifts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">
                    {shifts.reduce((sum, shift) => {
                      return sum + ((new Date(`2000-01-01T${shift.endTime}:00`).getTime() - 
                                     new Date(`2000-01-01T${shift.startTime}:00`).getTime()) / 
                                     (1000 * 60 * 60));
                    }, 0).toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed:</span>
                  <span className="font-medium text-green-600">
                    {shifts.filter(s => s.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">
                    {shifts.filter(s => s.status === 'scheduled').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}