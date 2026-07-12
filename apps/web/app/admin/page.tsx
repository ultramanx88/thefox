import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Gauge,
  KeyRound,
  Route,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Workflow
} from 'lucide-react';
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

const readinessTasks = [
  {
    icon: Workflow,
    track: 'UX + Business',
    title: 'Tenant & Branch approval flow',
    status: 'Build next',
    body: 'สร้าง tenant, ผูก owner/member, อนุมัติ branch, ระบุ operating status และบันทึก audit ทุก transition'
  },
  {
    icon: ShieldAlert,
    track: 'Pentest',
    title: 'Workspace route and auth test',
    status: 'Gate before mutations',
    body: 'ทดสอบ admin/vendor/driver subdomain, cookie domain, CORS, role bypass, unauthenticated access และ audit trail'
  },
  {
    icon: Gauge,
    track: 'Performance',
    title: 'Admin API and page budget',
    status: 'Baseline now',
    body: 'วัด latency ของ auth/me, admin/users, audit logs, cache behavior, bundle size และ cold response หลัง deploy'
  },
  {
    icon: KeyRound,
    track: 'Hardening',
    title: 'Mutation protection',
    status: 'Before create/edit',
    body: 'เพิ่ม CSRF/signed mutation token, rate limit, superadmin-only destructive action และ structured audit metadata'
  },
  {
    icon: ClipboardCheck,
    track: 'QA',
    title: 'Operational acceptance checklist',
    status: 'Pair with UX',
    body: 'ทุก task card ต้องมี expected state, error state, audit event, rollback note และ production verification command'
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

        <section className="fox-roadmap-panel fox-task-board" aria-label="Security and operations task board">
          <div className="fox-roadmap-panel__head">
            <div>
              <h2>Next Task Board: UX, Pentest, Performance</h2>
              <p>ก่อนเปิด workflow ที่เปลี่ยนข้อมูลจริง ให้ track งาน security และ performance เดินคู่กับ UX/business logic เพื่อไม่ให้ระบบสวยแต่เปราะ</p>
            </div>
            <span>
              <ShieldAlert size={16} />
              Production gate
            </span>
          </div>
          <div className="fox-task-grid">
            {readinessTasks.map(({ icon: Icon, track, title, status, body }) => (
              <article key={title} className="fox-task-card">
                <div>
                  <span>
                    <Icon size={18} />
                  </span>
                  <small>{track}</small>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <strong>{status}</strong>
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
