import { Bike, Clock3, MapPin, Navigation, Phone, WalletCards } from 'lucide-react';
import { RoleGuard } from '@/components/auth/role-guard';

const driverJobs = [
  { label: 'Pickup', place: 'ตลาดเช้าสันทราย', time: '8 นาที' },
  { label: 'Dropoff', place: 'เชียงใหม่ · บ้าน', time: '22 นาที' }
];

export default function DriverPage() {
  return (
    <RoleGuard allowedRoles={['driver', 'admin', 'superadmin']} workspaceName="Driver">
      <main className="fox-driver">
        <header className="fox-driver-hero">
          <a className="fox-console-brand" href="/">
            <span className="fox-logo-mark" aria-hidden="true">
              <img src="/brand/thefox-logo-transparent.png" alt="" />
            </span>
            <span>theFOX Driver</span>
          </a>
          <div className="fox-driver-switch">
            <span />
            <strong>Online</strong>
          </div>
        </header>

        <section className="fox-driver-job" aria-label="Active driver job">
          <p className="fox-kicker">NEXT JOB</p>
          <h1>รับวัตถุดิบ 3 รายการ ส่งถึงครัวลูกค้า</h1>
          <div className="fox-driver-route">
            {driverJobs.map((job) => (
              <article key={job.label}>
                <span>{job.label === 'Pickup' ? <Bike size={18} /> : <MapPin size={18} />}</span>
                <div>
                  <strong>{job.label}</strong>
                  <p>{job.place}</p>
                </div>
                <small>{job.time}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="fox-driver-actions" aria-label="Driver quick actions">
          <button type="button">
            <Navigation size={19} />
            นำทาง
          </button>
          <button type="button">
            <Phone size={19} />
            โทรหาร้าน
          </button>
          <button type="button">
            <Clock3 size={19} />
            สถานะ
          </button>
          <button type="button">
            <WalletCards size={19} />
            รายได้
          </button>
        </section>

        <section className="fox-driver-note">
          <strong>Guard ถัดไป</strong>
          <p>driver จะเห็นเฉพาะงานที่ assigned หรือพื้นที่ที่ตัวเอง online อยู่ และทุกสถานะต้องมี timestamp</p>
        </section>
      </main>
    </RoleGuard>
  );
}
