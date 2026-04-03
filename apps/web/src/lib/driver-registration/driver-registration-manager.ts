interface DriverRegistration {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    idCard: string;
    address: string;
  };
  vehicleInfo: {
    type: 'motorcycle' | 'car' | 'bicycle';
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
  };
  documents: {
    idCardPhoto: string;
    drivingLicense: string;
    vehicleRegistration: string;
    profilePhoto: string;
  };
  status: 'pending' | 'document_review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  score: number;
}

export class DriverRegistrationManager {
  private registrations: DriverRegistration[] = [];

  registerDriver(data: Omit<DriverRegistration, 'id' | 'status' | 'submittedAt' | 'score'>) {
    const registration: DriverRegistration = {
      ...data,
      id: `driver_reg_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      score: this.calculateScore(data)
    };

    this.registrations.push(registration);
    this.autoReview(registration);
    return registration;
  }

  private calculateScore(data: any): number {
    let score = 0;
    
    // Phone validation
    if (/^08[0-9]{8}$|^09[0-9]{8}$/.test(data.personalInfo.phone)) score += 20;
    
    // Email validation
    if (data.personalInfo.email.includes('@')) score += 15;
    
    // ID Card validation (13 digits)
    if (/^[0-9]{13}$/.test(data.personalInfo.idCard)) score += 25;
    
    // Vehicle info completeness
    if (data.vehicleInfo.licensePlate && data.vehicleInfo.brand) score += 20;
    
    // Documents completeness
    const docCount = Object.values(data.documents).filter(doc => doc).length;
    score += (docCount / 4) * 20;
    
    return score;
  }

  private autoReview(registration: DriverRegistration) {
    if (registration.score >= 80) {
      registration.status = 'document_review';
    }
  }

  approveRegistration(id: string, notes?: string) {
    const registration = this.registrations.find(r => r.id === id);
    if (registration) {
      registration.status = 'approved';
      registration.reviewedAt = new Date().toISOString();
      registration.reviewNotes = notes;
      this.createDriverAccount(registration);
    }
  }

  rejectRegistration(id: string, notes: string) {
    const registration = this.registrations.find(r => r.id === id);
    if (registration) {
      registration.status = 'rejected';
      registration.reviewedAt = new Date().toISOString();
      registration.reviewNotes = notes;
    }
  }

  private createDriverAccount(registration: DriverRegistration) {
    // Create driver account in the system
    console.log(`Creating driver account for ${registration.personalInfo.name}`);
  }

  getPendingRegistrations(): DriverRegistration[] {
    return this.registrations.filter(r => r.status === 'pending' || r.status === 'document_review');
  }

  getRegistrationById(id: string): DriverRegistration | undefined {
    return this.registrations.find(r => r.id === id);
  }

  getRegistrationStats() {
    return {
      total: this.registrations.length,
      pending: this.registrations.filter(r => r.status === 'pending').length,
      documentReview: this.registrations.filter(r => r.status === 'document_review').length,
      approved: this.registrations.filter(r => r.status === 'approved').length,
      rejected: this.registrations.filter(r => r.status === 'rejected').length
    };
  }

  bulkApprove(ids: string[]) {
    ids.forEach(id => this.approveRegistration(id, 'Bulk approved'));
  }
}

export const driverRegistrationManager = new DriverRegistrationManager();