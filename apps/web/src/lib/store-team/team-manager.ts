interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'packer' | 'quality_checker' | 'inventory_manager' | 'supervisor';
  permissions: string[];
  isActive: boolean;
  joinedAt: string;
  performance: {
    ordersCompleted: number;
    averageTime: number;
    rating: number;
  };
}

interface OrderAssignment {
  id: string;
  orderId: string;
  storeId: string;
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAt: string;
  completedAt?: string;
  notes?: string;
}

interface Store {
  id: string;
  name: string;
  ownerId: string;
  teamMembers: TeamMember[];
  activeOrders: OrderAssignment[];
}

export class StoreTeamManager {
  private stores: Store[] = [
    {
      id: 'store_001',
      name: 'ร้านวัตถุดิบอาหาร ABC',
      ownerId: 'owner_001',
      teamMembers: [],
      activeOrders: []
    }
  ];

  private rolePermissions = {
    packer: ['pack_orders', 'view_orders'],
    quality_checker: ['check_quality', 'approve_orders', 'view_orders'],
    inventory_manager: ['manage_inventory', 'update_stock', 'view_reports'],
    supervisor: ['manage_team', 'assign_orders', 'view_all', 'approve_all']
  };

  // Team Management
  addTeamMember(storeId: string, memberData: Omit<TeamMember, 'id' | 'permissions' | 'joinedAt' | 'performance'>) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return null;

    const member: TeamMember = {
      ...memberData,
      id: `member_${Date.now()}`,
      permissions: this.rolePermissions[memberData.role],
      joinedAt: new Date().toISOString(),
      performance: {
        ordersCompleted: 0,
        averageTime: 0,
        rating: 5.0
      }
    };

    store.teamMembers.push(member);
    return member;
  }

  updateMemberRole(storeId: string, memberId: string, newRole: TeamMember['role']) {
    const store = this.stores.find(s => s.id === storeId);
    const member = store?.teamMembers.find(m => m.id === memberId);
    
    if (member) {
      member.role = newRole;
      member.permissions = this.rolePermissions[newRole];
    }
  }

  removeMember(storeId: string, memberId: string) {
    const store = this.stores.find(s => s.id === storeId);
    if (store) {
      store.teamMembers = store.teamMembers.filter(m => m.id !== memberId);
    }
  }

  // Order Assignment
  assignOrder(storeId: string, orderId: string, memberIds: string[], priority: OrderAssignment['priority'] = 'medium') {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return null;

    const assignment: OrderAssignment = {
      id: `assignment_${Date.now()}`,
      orderId,
      storeId,
      assignedTo: memberIds,
      status: 'pending',
      priority,
      assignedAt: new Date().toISOString()
    };

    store.activeOrders.push(assignment);
    return assignment;
  }

  updateOrderStatus(storeId: string, assignmentId: string, status: OrderAssignment['status'], notes?: string) {
    const store = this.stores.find(s => s.id === storeId);
    const assignment = store?.activeOrders.find(a => a.id === assignmentId);
    
    if (assignment) {
      assignment.status = status;
      assignment.notes = notes;
      
      if (status === 'completed') {
        assignment.completedAt = new Date().toISOString();
        this.updateMemberPerformance(storeId, assignment);
      }
    }
  }

  private updateMemberPerformance(storeId: string, assignment: OrderAssignment) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store || !assignment.completedAt) return;

    const completionTime = new Date(assignment.completedAt).getTime() - new Date(assignment.assignedAt).getTime();
    
    assignment.assignedTo.forEach(memberId => {
      const member = store.teamMembers.find(m => m.id === memberId);
      if (member) {
        member.performance.ordersCompleted++;
        member.performance.averageTime = (member.performance.averageTime + completionTime) / 2;
      }
    });
  }

  // Getters
  getStore(storeId: string): Store | undefined {
    return this.stores.find(s => s.id === storeId);
  }

  getTeamMembers(storeId: string): TeamMember[] {
    const store = this.getStore(storeId);
    return store?.teamMembers || [];
  }

  getActiveOrders(storeId: string): OrderAssignment[] {
    const store = this.getStore(storeId);
    return store?.activeOrders || [];
  }

  getMembersByRole(storeId: string, role: TeamMember['role']): TeamMember[] {
    return this.getTeamMembers(storeId).filter(m => m.role === role && m.isActive);
  }

  getAvailableMembers(storeId: string): TeamMember[] {
    const members = this.getTeamMembers(storeId);
    const busyMembers = this.getActiveOrders(storeId)
      .filter(o => o.status === 'in_progress')
      .flatMap(o => o.assignedTo);
    
    return members.filter(m => m.isActive && !busyMembers.includes(m.id));
  }

  getTeamStats(storeId: string) {
    const members = this.getTeamMembers(storeId);
    const orders = this.getActiveOrders(storeId);
    
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.isActive).length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
      completedToday: orders.filter(o => 
        o.status === 'completed' && 
        o.completedAt?.startsWith(new Date().toISOString().split('T')[0])
      ).length
    };
  }

  getRoleDisplayName(role: TeamMember['role']): string {
    const names = {
      packer: 'พนักงานจัดของ',
      quality_checker: 'ตรวจสอบคุณภาพ',
      inventory_manager: 'จัดการสต็อก',
      supervisor: 'หัวหน้างาน'
    };
    return names[role];
  }
}

export const storeTeamManager = new StoreTeamManager();