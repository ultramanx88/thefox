export interface StaffMember {
  id: string;
  name: string;
  role: 'packer' | 'manager';
}

// In a real application, this would be a database.
const staffMembers: StaffMember[] = [
  { id: '1', name: 'สมศรี มีสุข', role: 'manager' },
  { id: '2', name: 'มานะ ใจดี', role: 'packer' },
  { id: '3', name: 'ปิติ ชูใจ', role: 'packer' },
];

export async function getStaffMembers(): Promise<StaffMember[]> {
  // Simulate async operation
  return Promise.resolve(staffMembers);
}
