import { AlertTriangle, BarChart3, Building2, ClipboardList, ShieldCheck, Truck, UsersRound } from 'lucide-react';

const adminMetrics = [
  { label: 'Active tenants', value: '24' },
  { label: 'Open orders', value: '118' },
  { label: 'Drivers online', value: '32' },
  { label: 'Support queue', value: '7' }
];

const adminLanes = [
  { icon: Building2, title: 'Tenant control', body: 'อนุมัติร้านค้า partner, branch, service area และสถานะเปิดขาย' },
  { icon: ClipboardList, title: 'Order operations', body: 'มองเห็น order ทุก tenant พร้อมสถานะ vendor และ driver handoff' },
  { icon: Truck, title: 'Dispatch monitor', body: 'ติดตามคนขับที่ online งานที่ค้างรับ และเคสส่งล่าช้า' },
  { icon: ShieldCheck, title: 'Security & audit', body: 'ตรวจ role, tenant scope, session, และ action log ของทีมงาน' }
];

export default function AdminPage() {
  return (
    <main className="fox-console fox-console--admin">
      <header className="fox-console-hero">
        <a className="fox-console-brand" href="/">
          <span className="fox-logo-mark" aria-hidden="true">
            <img src="/brand/thefox-logo-transparent.png" alt="" />
          </span>
          <span>theFOX Admin</span>
        </a>
        <div>
          <p className="fox-kicker">TEAM CONSOLE</p>
          <h1>ควบคุม tenant, order, driver และความปลอดภัยจากที่เดียว</h1>
          <p>พื้นที่นี้สำหรับ superadmin และทีม operation ที่ต้องเห็นระบบทั้งภาพรวม ไม่ใช่ flow สั่งของของลูกค้า</p>
        </div>
      </header>

      <section className="fox-console-metrics" aria-label="Admin operating metrics">
        {adminMetrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="fox-console-grid" aria-label="Admin lanes">
        {adminLanes.map(({ icon: Icon, title, body }) => (
          <article key={title} className="fox-console-card">
            <span>
              <Icon size={20} />
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="fox-console-next">
        <AlertTriangle size={20} />
        <div>
          <strong>Guard ถัดไป</strong>
          <p>ต่อจาก shell นี้ควรทำ role guard: admin/superadmin เท่านั้น และบันทึก audit ทุก action สำคัญ</p>
        </div>
      </section>
    </main>
  );
}
