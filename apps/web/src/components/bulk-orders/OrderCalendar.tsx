'use client';

import { useState } from 'react';

interface OrderCalendarProps {
  orders: any[];
  onDateSelect: (date: string) => void;
}

export default function OrderCalendar({ orders, onDateSelect }: OrderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return orders.filter(order => 
      order.items.some((item: any) => item.deliveryDate === dateStr)
    );
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button 
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2"></div>;
          }

          const dayOrders = getOrdersForDate(day);
          const hasOrders = dayOrders.length > 0;
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`p-2 min-h-[60px] border cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
              } ${hasOrders ? 'bg-green-50 border-green-300' : ''}`}
              onClick={() => onDateSelect(day.toISOString().split('T')[0])}
            >
              <div className="text-sm font-medium">{day.getDate()}</div>
              {hasOrders && (
                <div className="mt-1">
                  <div className="text-xs bg-green-500 text-white px-1 rounded">
                    {dayOrders.length} คำสั่ง
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}