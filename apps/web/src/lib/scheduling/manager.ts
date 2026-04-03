interface Employee {
  id: string;
  name: string;
  role: 'driver' | 'kitchen' | 'manager' | 'cashier' | 'prep';
  storeId: string;
  status: 'active' | 'inactive' | 'on_leave';
  availability: {
    [day: string]: { available: boolean; preferredStart?: string; preferredEnd?: string };
  };
  skills: string[];
  hourlyRate: number;
  maxHoursPerWeek: number;
  currentHoursThisWeek: number;
}

interface Shift {
  id: string;
  storeId: string;
  employeeId: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  breakTime: number; // minutes
  notes?: string;
}

interface ShiftRequirement {
  storeId: string;
  date: string;
  role: string;
  startTime: string;
  endTime: string;
  minStaff: number;
  maxStaff: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class SchedulingManager {
  private employees: Employee[] = [
    {
      id: 'emp_001',
      name: 'John Smith',
      role: 'driver',
      storeId: 'store_001',
      status: 'active',
      availability: {
        monday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
        tuesday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
        wednesday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
        thursday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
        friday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
        saturday: { available: false },
        sunday: { available: false }
      },
      skills: ['delivery', 'customer_service'],
      hourlyRate: 18.50,
      maxHoursPerWeek: 40,
      currentHoursThisWeek: 32
    },
    {
      id: 'emp_002',
      name: 'Sarah Johnson',
      role: 'kitchen',
      storeId: 'store_001',
      status: 'active',
      availability: {
        monday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
        tuesday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
        wednesday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
        thursday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
        friday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
        saturday: { available: true, preferredStart: '08:00', preferredEnd: '16:00' },
        sunday: { available: false }
      },
      skills: ['cooking', 'food_prep', 'inventory'],
      hourlyRate: 22.00,
      maxHoursPerWeek: 40,
      currentHoursThisWeek: 38
    },
    {
      id: 'emp_003',
      name: 'Mike Chen',
      role: 'driver',
      storeId: 'store_002',
      status: 'active',
      availability: {
        monday: { available: true, preferredStart: '11:00', preferredEnd: '19:00' },
        tuesday: { available: true, preferredStart: '11:00', preferredEnd: '19:00' },
        wednesday: { available: true, preferredStart: '11:00', preferredEnd: '19:00' },
        thursday: { available: true, preferredStart: '11:00', preferredEnd: '19:00' },
        friday: { available: true, preferredStart: '11:00', preferredEnd: '19:00' },
        saturday: { available: true, preferredStart: '10:00', preferredEnd: '18:00' },
        sunday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' }
      },
      skills: ['delivery', 'customer_service', 'navigation'],
      hourlyRate: 19.00,
      maxHoursPerWeek: 35,
      currentHoursThisWeek: 28
    }
  ];

  private shifts: Shift[] = [
    {
      id: 'shift_001',
      storeId: 'store_001',
      employeeId: 'emp_001',
      role: 'driver',
      date: '2024-01-20',
      startTime: '09:00',
      endTime: '17:00',
      status: 'scheduled',
      breakTime: 60
    },
    {
      id: 'shift_002',
      storeId: 'store_001',
      employeeId: 'emp_002',
      role: 'kitchen',
      date: '2024-01-20',
      startTime: '06:00',
      endTime: '14:00',
      status: 'confirmed',
      breakTime: 30
    }
  ];

  private requirements: ShiftRequirement[] = [
    {
      storeId: 'store_001',
      date: '2024-01-21',
      role: 'driver',
      startTime: '09:00',
      endTime: '17:00',
      minStaff: 2,
      maxStaff: 4,
      priority: 'high'
    },
    {
      storeId: 'store_001',
      date: '2024-01-21',
      role: 'kitchen',
      startTime: '06:00',
      endTime: '22:00',
      minStaff: 3,
      maxStaff: 5,
      priority: 'critical'
    }
  ];

  generateSchedule(storeId: string, startDate: string, endDate: string): Shift[] {
    const generatedShifts: Shift[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Get requirements for this date
      const dayRequirements = this.requirements.filter(req => 
        req.storeId === storeId && req.date === dateStr
      );
      
      for (const requirement of dayRequirements) {
        const availableEmployees = this.getAvailableEmployees(
          storeId, 
          requirement.role, 
          dayName, 
          requirement.startTime, 
          requirement.endTime
        );
        
        // Schedule minimum required staff
        const selectedEmployees = availableEmployees.slice(0, requirement.minStaff);
        
        for (const employee of selectedEmployees) {
          const shift: Shift = {
            id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            storeId,
            employeeId: employee.id,
            role: requirement.role,
            date: dateStr,
            startTime: requirement.startTime,
            endTime: requirement.endTime,
            status: 'scheduled',
            breakTime: this.calculateBreakTime(requirement.startTime, requirement.endTime)
          };
          
          generatedShifts.push(shift);
        }
      }
    }
    
    return generatedShifts;
  }

  private getAvailableEmployees(
    storeId: string, 
    role: string, 
    dayName: string, 
    startTime: string, 
    endTime: string
  ): Employee[] {
    return this.employees.filter(emp => {
      // Basic filters
      if (emp.storeId !== storeId || emp.role !== role || emp.status !== 'active') {
        return false;
      }
      
      // Check availability for the day
      const dayAvailability = emp.availability[dayName];
      if (!dayAvailability?.available) {
        return false;
      }
      
      // Check time preferences
      if (dayAvailability.preferredStart && dayAvailability.preferredEnd) {
        if (startTime < dayAvailability.preferredStart || endTime > dayAvailability.preferredEnd) {
          return false;
        }
      }
      
      // Check weekly hour limits
      const shiftHours = this.calculateShiftHours(startTime, endTime);
      if (emp.currentHoursThisWeek + shiftHours > emp.maxHoursPerWeek) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Prioritize by current hours (give more hours to those with fewer)
      return a.currentHoursThisWeek - b.currentHoursThisWeek;
    });
  }

  private calculateShiftHours(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private calculateBreakTime(startTime: string, endTime: string): number {
    const hours = this.calculateShiftHours(startTime, endTime);
    if (hours >= 8) return 60; // 1 hour break for 8+ hour shifts
    if (hours >= 6) return 30; // 30 min break for 6+ hour shifts
    return 0; // No break for shorter shifts
  }

  getShiftsByStore(storeId: string, date?: string): Shift[] {
    return this.shifts.filter(shift => {
      if (shift.storeId !== storeId) return false;
      if (date && shift.date !== date) return false;
      return true;
    });
  }

  getShiftsByEmployee(employeeId: string, startDate?: string, endDate?: string): Shift[] {
    return this.shifts.filter(shift => {
      if (shift.employeeId !== employeeId) return false;
      if (startDate && shift.date < startDate) return false;
      if (endDate && shift.date > endDate) return false;
      return true;
    });
  }

  updateShiftStatus(shiftId: string, status: Shift['status']): boolean {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.status = status;
      return true;
    }
    return false;
  }

  getScheduleConflicts(storeId: string, date: string): Array<{
    type: 'understaffed' | 'overstaffed' | 'no_coverage';
    role: string;
    timeSlot: string;
    current: number;
    required: number;
  }> {
    const conflicts = [];
    const dayShifts = this.getShiftsByStore(storeId, date);
    const dayRequirements = this.requirements.filter(req => 
      req.storeId === storeId && req.date === date
    );

    for (const requirement of dayRequirements) {
      const roleShifts = dayShifts.filter(shift => 
        shift.role === requirement.role &&
        shift.startTime <= requirement.startTime &&
        shift.endTime >= requirement.endTime
      );

      if (roleShifts.length < requirement.minStaff) {
        conflicts.push({
          type: 'understaffed',
          role: requirement.role,
          timeSlot: `${requirement.startTime}-${requirement.endTime}`,
          current: roleShifts.length,
          required: requirement.minStaff
        });
      } else if (roleShifts.length > requirement.maxStaff) {
        conflicts.push({
          type: 'overstaffed',
          role: requirement.role,
          timeSlot: `${requirement.startTime}-${requirement.endTime}`,
          current: roleShifts.length,
          required: requirement.maxStaff
        });
      }
    }

    return conflicts;
  }

  getEmployeeSchedule(employeeId: string, weekStart: string): {
    employee: Employee;
    shifts: Shift[];
    totalHours: number;
    totalPay: number;
  } {
    const employee = this.employees.find(emp => emp.id === employeeId);
    if (!employee) throw new Error('Employee not found');

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const shifts = this.getShiftsByEmployee(
      employeeId, 
      weekStart, 
      weekEnd.toISOString().split('T')[0]
    );

    const totalHours = shifts.reduce((sum, shift) => {
      return sum + this.calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);

    const totalPay = totalHours * employee.hourlyRate;

    return {
      employee,
      shifts,
      totalHours,
      totalPay
    };
  }

  getAllEmployees(): Employee[] {
    return this.employees;
  }

  getEmployeesByStore(storeId: string): Employee[] {
    return this.employees.filter(emp => emp.storeId === storeId);
  }

  addShift(shift: Omit<Shift, 'id'>): string {
    const newShift: Shift = {
      ...shift,
      id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.shifts.push(newShift);
    return newShift.id;
  }

  updateEmployeeAvailability(employeeId: string, availability: Employee['availability']): boolean {
    const employee = this.employees.find(emp => emp.id === employeeId);
    if (employee) {
      employee.availability = availability;
      return true;
    }
    return false;
  }
}