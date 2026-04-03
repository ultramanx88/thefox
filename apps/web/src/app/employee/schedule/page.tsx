'use client';

import { useState } from 'react';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { SchedulingManager } from '@/lib/scheduling/manager';

export default function EmployeePortal() {
  const [schedulingManager] = useState(new SchedulingManager());
  const [employeeId] = useState('emp_001');
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);

  const employeeSchedule = schedulingManager.getEmployeeSchedule(employeeId, selectedWeek);
  const { employee, shifts, totalHours, totalPay } = employeeSchedule;

  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);

  const getShiftForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.find(shift => shift.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-gray-600 capitalize">{employee.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">This Week</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Estimated Pay</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${totalPay.toFixed(2)}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <span className="font-medium text-purple-900">Status</span>
              <p className="text-lg font-bold text-purple-600 capitalize">{employee.status}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Weekly Schedule
            </h2>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => {
              const shift = getShiftForDate(date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = date.getDate();
              
              return (
                <div key={index} className="text-center">
                  <div className="font-medium text-gray-700 mb-2">{dayName}</div>
                  <div className="text-sm text-gray-500 mb-3">{dayNumber}</div>
                  
                  {shift ? (
                    <div className="bg-white border-2 border-blue-200 rounded-lg p-3 min-h-[120px]">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {shift.startTime}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">to</div>
                      <div className="text-sm font-medium text-gray-900">
                        {shift.endTime}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-3 min-h-[120px] flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Off</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}