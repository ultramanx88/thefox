import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Database,
  Gauge,
  History,
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
    status: 'Shipped',
    body: 'สร้าง tenant, ผูก owner/member, อนุมัติ branch, ระบุ operating status และบันทึก audit ทุก transition',
    expectedState: 'Admin สร้าง tenant/branch เป็น pending แล้วเปลี่ยนสถานะได้ตาม role',
    errorState: 'ข้อมูลไม่ครบตอบ 400, target ไม่พบตอบ 404, lower role ถูก 403',
    auditEvent: 'admin.tenant.create, admin.tenant_status.update, admin.branch.create, admin.branch_status.update',
    rollbackNote: 'เปลี่ยน status กลับ pending/paused หรือปิด workflow จาก admin console; DB migration ไม่ต้อง rollback',
    verificationCommand: 'curl -i https://api.thefox.app/v1/admin/tenants',
    prompt: 'ทำ task Tenant & Branch approval flow ต่อ: ตรวจ UX/API/admin audit, อัปเดต status การ์ด, verify production และ commit/deploy ให้ครบ'
  },
  {
    icon: ShieldAlert,
    track: 'Pentest',
    title: 'Workspace route and auth test',
    status: 'Verified',
    body: 'ทดสอบ admin/vendor/driver subdomain, cookie domain, CORS, role bypass, unauthenticated access และ audit trail',
    expectedState: 'Subdomain rewrite ถูกต้อง, unauth ได้ 401, lower role ได้ 403',
    errorState: 'Origin แปลกไม่มี CORS allow-origin, forged cookie ไม่ผ่าน session verify',
    auditEvent: 'admin.workspace.access.unauthenticated, vendor.workspace.access.forbidden, driver.workspace.access.forbidden',
    rollbackNote: 'ย้อน proxy/CORS config แล้ว redeploy เฉพาะ thefox-app web/api',
    verificationCommand: 'curl -i https://api.thefox.app/v1/admin/me',
    prompt: 'ทำ task Workspace route and auth test ต่อ: ทดสอบ admin/vendor/driver subdomain, cookie domain, CORS, role bypass, unauth access และ audit trail'
  },
  {
    icon: Gauge,
    track: 'Performance',
    title: 'Admin API and page budget',
    status: 'Baseline captured',
    body: 'วัด latency ของ auth/me, admin/users, audit logs, cache behavior, bundle size และ cold response หลัง deploy',
    expectedState: 'Admin page 200, static chunk cache HIT, auth/admin APIs อยู่ใน latency budget',
    errorState: 'API 5xx, cold response ช้า, bundle โตผิดปกติ หรือ static cache ไม่ HIT',
    auditEvent: 'admin.audit_logs.list, admin.users.list, admin.workspace.access',
    rollbackNote: 'ย้อน commit UI/API ล่าสุดแล้ว deploy; ไม่แตะ database ถ้าไม่มี migration',
    verificationCommand: "curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total}\\n' https://admin.thefox.app",
    prompt: 'ทำ task Admin API and page budget ต่อ: วัด auth/me, admin/users, audit logs, cache behavior, bundle size และ cold response หลัง deploy'
  },
  {
    icon: KeyRound,
    track: 'Hardening',
    title: 'Mutation protection',
    status: 'Shipped',
    body: 'เพิ่ม CSRF/signed mutation token, rate limit, superadmin-only destructive action และ structured audit metadata',
    expectedState: 'POST/PATCH ต้องมี signed mutation token และ destructive action ต้อง superadmin',
    errorState: 'Missing/expired token ได้ 403, rate limit ได้ 429, destructive lower role ได้ 403',
    auditEvent: 'admin.user_role.update.csrf_rejected, admin.user_role.update.rate_limited, admin.tenant_status.update.destructive_forbidden',
    rollbackNote: 'ปิด enforcement โดย revert mutation guard commit แล้ว redeploy; audit rows เก็บไว้เป็นหลักฐาน',
    verificationCommand: "curl -i -X OPTIONS https://api.thefox.app/v1/admin/users/example/role -H 'Origin: https://admin.thefox.app' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type,x-thefox-mutation-token'",
    prompt: 'ทำ task Mutation protection ต่อ: ตรวจ CSRF/signed mutation token, rate limit, superadmin-only destructive action และ structured audit metadata'
  },
  {
    icon: History,
    track: 'Compliance',
    title: 'Audit logs filters & pagination',
    status: 'Shipped',
    body: 'เพิ่ม page/pageSize/filter สำหรับ action, actorRole, resourceType และช่วงวันที่ เพื่อไม่ให้ audit query โตแบบ unbounded',
    expectedState: 'Admin filter audit logs ได้และเปลี่ยนหน้าได้โดยไม่ reload ทั้ง console',
    errorState: 'actorRole invalid ได้ 400, page/pageSize ถูก clamp, empty result แสดง empty state',
    auditEvent: 'admin.audit_logs.list พร้อม metadata.page, metadata.pageSize และ metadata.filters',
    rollbackNote: 'revert เฉพาะ audit API/UI แล้ว redeploy; audit rows เดิมไม่ถูกลบ',
    verificationCommand: 'curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25&actorRole=superadmin"',
    prompt: 'ทำ task Audit logs filters & pagination ต่อ: ทบทวน filter/page UX, admin-only guard, audit metadata, production query และอัปเดตการ์ด'
  },
  {
    icon: Database,
    track: 'Performance',
    title: 'Database performance baseline & index plan',
    status: 'Shipped',
    body: 'เพิ่ม index สำหรับ admin/audit/tenant/product/order hot paths และใช้ EXPLAIN ANALYZE เป็น production gate ก่อนขยาย inventory ledger',
    expectedState: 'Prisma schema มี index ตาม query path จริง, migrate status clean และ audit/admin list ใช้ bounded indexed reads',
    errorState: 'migration fail, index ไม่ถูกสร้าง, query plan ยัง scan หนักโดยไม่จำเป็น หรือ write path ช้าลงผิดปกติ',
    auditEvent: 'No DB audit expected for index creation; runtime endpoints ยัง emit admin.users.list, admin.tenants.list, admin.audit_logs.list',
    rollbackNote: 'drop เฉพาะ indexes ใน migration นี้หรือ revert migration ก่อน deploy ถ้ายังไม่เข้า production; ห้ามลบ business data',
    verificationCommand: 'ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -c \'EXPLAIN ANALYZE SELECT * FROM \"AuditLog\" WHERE \"actorRole\" = \'\'superadmin\'\' ORDER BY \"createdAt\" DESC LIMIT 25;\'"',
    prompt: 'ทำ task Database performance baseline & index plan ต่อ: วัด EXPLAIN ANALYZE, migrate status, index presence, latency baseline และ update status การ์ด'
  },
  {
    icon: ClipboardCheck,
    track: 'QA',
    title: 'Operational acceptance checklist',
    status: 'Active standard',
    body: 'ทุก task card ต้องมี expected state, error state, audit event, rollback note และ production verification command',
    expectedState: 'ทุก task card มี acceptance fields ครบและสอดคล้องกับ production behavior',
    errorState: 'card ที่ขาด field ใด field หนึ่งห้ามถือว่า ready for production',
    auditEvent: 'Documentation change maps to the implementation audit events named in each card',
    rollbackNote: 'ย้อนเฉพาะ doc/UI card changes ได้โดยไม่กระทบ runtime',
    verificationCommand: "rg -n 'expectedState|errorState|auditEvent|rollbackNote|verificationCommand|prompt' apps/web/app/admin/page.tsx",
    prompt: 'ทำ task Operational acceptance checklist ต่อ: ตรวจว่าทุกการ์ดมี expected/error/audit/rollback/verify/prompt และ status ล่าสุด'
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
            {readinessTasks.map(({ icon: Icon, track, title, status, body, expectedState, errorState, auditEvent, rollbackNote, verificationCommand, prompt }) => (
              <article key={title} className="fox-task-card">
                <div>
                  <span>
                    <Icon size={18} />
                  </span>
                  <small>{track}</small>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <dl>
                  <div>
                    <dt>Expected</dt>
                    <dd>{expectedState}</dd>
                  </div>
                  <div>
                    <dt>Error</dt>
                    <dd>{errorState}</dd>
                  </div>
                  <div>
                    <dt>Audit</dt>
                    <dd>{auditEvent}</dd>
                  </div>
                  <div>
                    <dt>Rollback</dt>
                    <dd>{rollbackNote}</dd>
                  </div>
                  <div>
                    <dt>Verify</dt>
                    <dd>
                      <code>{verificationCommand}</code>
                    </dd>
                  </div>
                  <div className="fox-task-card__prompt">
                    <dt>Prompt</dt>
                    <dd>
                      <code>{prompt}</code>
                    </dd>
                  </div>
                </dl>
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
