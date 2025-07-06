export interface DeliveryJob {
    id: string;
    orderId: string;
    pickup: string;
    delivery: string;
    payout: number;
    timeWindow: string;
    date: string;
}
  
export interface ScheduledJob {
    id: string;
    orderId: string;
    time: string;
    status: 'Scheduled' | 'In Progress';
}
  
const availableJobs: DeliveryJob[] = [
    { id: 'JOB-001', orderId: 'ORD-101', pickup: 'ร้านผักป้านี', delivery: 'ร้านอาหารเจริญสุข', payout: 80, timeWindow: '14:00 - 15:00', date: 'Today' },
    { id: 'JOB-002', orderId: 'ORD-102', pickup: 'เขียงเนื้อลุงเดช', delivery: 'โรงแรมแกรนด์พาเลซ', payout: 120, timeWindow: '15:30 - 16:30', date: 'Today' },
    { id: 'JOB-003', orderId: 'ORD-103', pickup: 'เจ๊ออยอาหารทะเล', delivery: 'ครัวคุณหน่อย', payout: 95, timeWindow: '09:00 - 10:00', date: 'Tomorrow' },
    { id: 'JOB-004', orderId: 'ORD-104', pickup: 'ฟาร์มไก่ลุงมี', delivery: 'คาเฟ่ The Nest', payout: 70, timeWindow: '10:00 - 11:00', date: 'Tomorrow' },
];
  
const scheduledJobs: ScheduledJob[] = [
    { id: 'SCH-001', orderId: 'ORD-098', time: 'Today, 11:30', status: 'Scheduled' },
    { id: 'SCH-002', orderId: 'ORD-099', time: 'Today, 13:00', status: 'In Progress' },
];
  
  
export async function getAvailableJobs(): Promise<DeliveryJob[]> {
    return Promise.resolve(availableJobs);
}
  
export async function getScheduledJobs(): Promise<ScheduledJob[]> {
    return Promise.resolve(scheduledJobs);
}
  
