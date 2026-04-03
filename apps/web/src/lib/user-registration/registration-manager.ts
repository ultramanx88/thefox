interface UserRegistration {
  id: string;
  email: string;
  phone: string;
  name: string;
  userType: 'customer' | 'driver' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  autoApproved: boolean;
}

interface AutoApprovalRules {
  enabled: boolean;
  emailDomains: string[];
  phonePatterns: string[];
  requireVerification: boolean;
  maxAutoApprovalsPerDay: number;
}

export class UserRegistrationManager {
  private registrations: UserRegistration[] = [];
  private autoApprovalRules: AutoApprovalRules = {
    enabled: true,
    emailDomains: ['gmail.com', 'hotmail.com', 'yahoo.com'],
    phonePatterns: ['^08[0-9]{8}$', '^09[0-9]{8}$'],
    requireVerification: false,
    maxAutoApprovalsPerDay: 100
  };

  register(data: Omit<UserRegistration, 'id' | 'status' | 'submittedAt' | 'autoApproved'>) {
    const registration: UserRegistration = {
      ...data,
      id: `reg_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      autoApproved: false
    };

    this.registrations.push(registration);

    if (this.autoApprovalRules.enabled) {
      this.processAutoApproval(registration);
    }

    return registration;
  }

  private processAutoApproval(registration: UserRegistration) {
    if (!this.canAutoApprove()) return;

    const isEligible = this.checkAutoApprovalEligibility(registration);
    
    if (isEligible) {
      registration.status = 'approved';
      registration.approvedAt = new Date().toISOString();
      registration.autoApproved = true;
      this.sendWelcomeEmail(registration);
    }
  }

  private canAutoApprove(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const todayApprovals = this.registrations.filter(r => 
      r.autoApproved && 
      r.approvedAt?.startsWith(today)
    ).length;

    return todayApprovals < this.autoApprovalRules.maxAutoApprovalsPerDay;
  }

  private checkAutoApprovalEligibility(registration: UserRegistration): boolean {
    // Check email domain
    const emailDomain = registration.email.split('@')[1];
    const validEmail = this.autoApprovalRules.emailDomains.includes(emailDomain);

    // Check phone pattern
    const validPhone = this.autoApprovalRules.phonePatterns.some(pattern => 
      new RegExp(pattern).test(registration.phone)
    );

    // Check for duplicate
    const isDuplicate = this.registrations.some(r => 
      r.id !== registration.id && 
      (r.email === registration.email || r.phone === registration.phone)
    );

    return validEmail && validPhone && !isDuplicate;
  }

  private sendWelcomeEmail(registration: UserRegistration) {
    console.log(`Sending welcome email to ${registration.email}`);
  }

  manualApprove(registrationId: string) {
    const registration = this.registrations.find(r => r.id === registrationId);
    if (registration && registration.status === 'pending') {
      registration.status = 'approved';
      registration.approvedAt = new Date().toISOString();
      this.sendWelcomeEmail(registration);
    }
  }

  reject(registrationId: string) {
    const registration = this.registrations.find(r => r.id === registrationId);
    if (registration && registration.status === 'pending') {
      registration.status = 'rejected';
    }
  }

  getPendingRegistrations(): UserRegistration[] {
    return this.registrations.filter(r => r.status === 'pending');
  }

  getRegistrationStats() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: this.registrations.length,
      pending: this.registrations.filter(r => r.status === 'pending').length,
      approved: this.registrations.filter(r => r.status === 'approved').length,
      rejected: this.registrations.filter(r => r.status === 'rejected').length,
      todayAutoApproved: this.registrations.filter(r => 
        r.autoApproved && r.approvedAt?.startsWith(today)
      ).length,
      autoApprovalEnabled: this.autoApprovalRules.enabled
    };
  }

  updateAutoApprovalRules(rules: Partial<AutoApprovalRules>) {
    this.autoApprovalRules = { ...this.autoApprovalRules, ...rules };
  }

  getAutoApprovalRules(): AutoApprovalRules {
    return { ...this.autoApprovalRules };
  }

  toggleAutoApproval(enabled: boolean) {
    this.autoApprovalRules.enabled = enabled;
  }

  bulkApprove(registrationIds: string[]) {
    registrationIds.forEach(id => this.manualApprove(id));
  }

  searchRegistrations(query: string): UserRegistration[] {
    return this.registrations.filter(r => 
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase()) ||
      r.phone.includes(query)
    );
  }
}

export const userRegistrationManager = new UserRegistrationManager();