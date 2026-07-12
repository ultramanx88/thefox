import { Boxes, Building2, ChartNoAxesCombined, Route, ShieldCheck, Truck } from 'lucide-react';
import { AdminConsole } from './admin-console';
import { RoleGuard } from '@/components/auth/role-guard';

const adminRoadmap = [
  {
    icon: Building2,
    title: 'Tenant & Branch Control',
    status: 'Next UX',
    body: 'สร้าง tenant, อนุมัติสาขา, ดู owner/member และสถานะปฏิบัติการ'
  },
  {
    icon: Boxes,
    title: 'Inventory Backbone',
    status: 'Model first',
    body: 'ผูก units, SKU, stock ledger, stock take และ branch transfer เข้ากับ audit'
  },
  {
    icon: Truck,
    title: 'Delivery Modes',
    status: 'After stock',
    body: 'แยก system driver, tenant self-delivery, pickup และ third party โดยไม่ทำให้ stock หลุด ledger'
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Settlement Reports',
    status: 'After orders',
    body: 'คำนวณ cost, margin, platform fee, payout และยอดที่ tenant ต้องชำระ'
  }
];

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']} workspaceName="Admin">
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
            <p>พื้นที่นี้ใช้ข้อมูลจริงจาก API สำหรับดูบัญชี เปลี่ยน role และตรวจ audit trail ของระบบ</p>
          </div>
        </header>

        <AdminConsole />

        <section className="fox-roadmap-panel" aria-label="Admin UX roadmap">
          <div className="fox-roadmap-panel__head">
            <div>
              <h2>UX Roadmap ต่อจาก Admin Guard</h2>
              <p>ลำดับนี้ยึด business logic ใน markdown: admin เห็นโครงองค์กรก่อน จากนั้นค่อยปลด inventory, delivery และ settlement</p>
            </div>
            <span>
              <Route size={16} />
              Roadmap live
            </span>
          </div>
          <div className="fox-roadmap-grid">
            {adminRoadmap.map(({ icon: Icon, title, status, body }) => (
              <article key={title} className="fox-roadmap-card">
                <div>
                  <span>
                    <Icon size={18} />
                  </span>
                  <small>{status}</small>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fox-console-next">
          <ShieldCheck size={20} />
          <div>
            <strong>Access guard พร้อมใช้งาน</strong>
            <p>Admin ถูกจำกัดเฉพาะ admin/superadmin แล้ว และ API เริ่มบันทึก audit log สำหรับ login, logout และ workspace access</p>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
