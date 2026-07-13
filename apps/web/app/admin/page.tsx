import {
  Boxes,
  BrainCircuit,
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
    status: 'Verified',
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
    status: 'Verified',
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
    status: 'Verified',
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
    status: 'Verified',
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

const systemPrograms = [
  {
    icon: ShieldAlert,
    track: 'Security',
    title: 'Security pentest program',
    status: 'Planned',
    body: 'รวมงาน route isolation, role bypass, ownership bypass, CSRF, rate limit, cookie/CORS/session และ secrets exposure',
    expectedState: 'ทุก protected surface มี pentest checklist, production command, audit expectation และผลทดสอบล่าสุด',
    errorState: 'พบ route bypass, tenant data leak, forged session ผ่าน, origin แปลกผ่าน CORS หรือ mutation สำคัญไม่มี guard',
    auditEvent: 'admin.workspace.access.*, vendor.workspace.access.*, admin.*.forbidden, admin.*.csrf_rejected, admin.*.rate_limited',
    rollbackNote: 'หยุด workflow ที่เสี่ยง, revert เฉพาะ guard/CORS/session change แล้ว redeploy เฉพาะ thefox web/api',
    verificationCommand: "rg -n 'requireRole|requireMutationProtection|cors|cookieOptions|writeAuditLog' apps/api/src/server.ts",
    prompt: 'ทำ program Security pentest ต่อ: แตก task route isolation, role bypass, tenant ownership bypass, CSRF, rate limit, cookie/CORS/session, secrets exposure พร้อม verify production'
  },
  {
    icon: Gauge,
    track: 'Performance',
    title: 'Performance optimization program',
    status: 'Planned',
    body: 'คุม API latency, page/bundle budget, DB query plan, connection pool, cache strategy, cold start และ payload size',
    expectedState: 'มี baseline p50/p95, budget ต่อ endpoint/page, query plan สำคัญ และ regression gate ก่อน/หลัง deploy',
    errorState: 'TTFB spike, bundle โตผิดปกติ, query scan หนัก, connection pool error, cold start fail หรือ payload โตเกินจำเป็น',
    auditEvent: 'No DB audit expected for measurement; runtime endpoints ยัง emit admin.users.list, admin.tenants.list, admin.audit_logs.list',
    rollbackNote: 'revert change ที่ทำให้ latency/bundle/query แย่ แล้ว redeploy; schema rollback เฉพาะ migration ที่เป็นต้นเหตุ',
    verificationCommand: "curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\\n' https://admin.thefox.app",
    prompt: 'ทำ program Performance optimization ต่อ: วัด API/page/DB/cache/cold start/payload baseline, เพิ่ม budget gate และอัปเดตการ์ดตามผล production'
  },
  {
    icon: Workflow,
    track: 'Business',
    title: 'Business logic integrity program',
    status: 'Planned',
    body: 'ล็อก tenant/branch lifecycle, vendor permissions, unit conversion, stock ledger, branch transfer, order reservation และ settlement rules',
    expectedState: 'ทุก business transition มี state machine, permission rule, transaction boundary, audit event และ rollback note',
    errorState: 'stock หลุด ledger, order ไม่ reserve stock, owner/member scope ผิด, transfer variance หาย หรือ settlement คำนวณย้อนรอยไม่ได้',
    auditEvent: 'admin.tenant_status.update, admin.branch_status.update, future stock.*, order.*, settlement.*',
    rollbackNote: 'ปิด mutation path ที่ผิด, เก็บ audit/ledger evidence, ใช้ compensating adjustment แทนการลบประวัติ',
    verificationCommand: "rg -n 'TenantStatus|BranchStatus|StockLedger|BranchStockBalance|settlement|order' apps/api/prisma/schema.prisma docs/product-system",
    prompt: 'ทำ program Business logic integrity ต่อ: วาง state/permission/transaction/audit สำหรับ tenant, branch, inventory, transfer, order และ settlement'
  },
  {
    icon: BrainCircuit,
    track: 'Algorithm',
    title: 'Algorithm engine program',
    status: 'After business',
    body: 'วางสมองระบบสำหรับ inventory truth, delivery assignment, tenant health score, ranking, risk scoring, margin guard และ recommendation rules',
    expectedState: 'algorithm ทุกตัวมี input/source of truth, deterministic rule, explainable score, audit evidence, priority และ fallback path',
    errorState: 'ranking/assignment ทำให้ stock ผิด, delivery cost เพี้ยน, margin หลุด guard, tenant score อธิบายไม่ได้ หรือ recommendation ข้าม permission',
    auditEvent: 'future algorithm.inventory_truth.*, algorithm.delivery_assignment.*, algorithm.tenant_health.*, algorithm.ranking.*, algorithm.risk.*',
    rollbackNote: 'ปิด algorithm flag หรือ revert rule version; ใช้ deterministic fallback และเก็บ score/audit evidence เดิมไว้ตรวจย้อนหลัง',
    verificationCommand: "rg -n 'algorithm|ranking|score|assignment|reserved|margin|recommendation' docs/product-system apps/api/prisma/schema.prisma apps/api/src",
    prompt: 'ทำ program Algorithm engine ต่อ: วาง inventory truth, delivery assignment, tenant health score, ranking, risk scoring, margin guard และ recommendation rules พร้อม audit/rollback/verification'
  },
  {
    icon: Truck,
    track: 'Operations',
    title: 'Operations reliability program',
    status: 'Planned',
    body: 'คุม VPS service isolation, deploy checklist, rollback playbook, health checks, log inspection, migration safety และ incident notes',
    expectedState: 'มี production runbook ที่ระบุ service/port, health command, rollback command, migration safety และห้ามกระทบ stack อื่น',
    errorState: 'deploy แตะ service ผิดตัว, rollback ไม่ชัด, health check ไม่พอ, migration fail แล้วไม่มี recovery path',
    auditEvent: 'No app audit expected for deploy operations; production evidence comes from deploy logs, docker ps, health checks, and migration status',
    rollbackNote: 'rollback เฉพาะ thefox-app web/api image หรือ migration ที่เกี่ยวข้อง; ห้าม restart/drop service อื่นบน VPS',
    verificationCommand: "ssh root@187.77.158.181 \"docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'\"",
    prompt: 'ทำ program Operations reliability ต่อ: สร้าง/ตรวจ runbook deploy, rollback, health, logs, migration safety และ VPS service isolation'
  },
  {
    icon: History,
    track: 'Compliance',
    title: 'Compliance audit program',
    status: 'Planned',
    body: 'ทำ audit coverage สำหรับ critical actions, structured metadata, permission history, retention/archive และ export traceability',
    expectedState: 'critical action ทุกตัวมี audit event ที่ค้นหาได้ พร้อม actor/resource/route/method/metadata และ retention direction',
    errorState: 'action สำคัญไม่มี audit, metadata ไม่มีโครง, permission change ตามย้อนยาก หรือ audit table โตโดยไม่มี retention plan',
    auditEvent: 'auth.*, admin.*, vendor.*, driver.*, future stock.*, order.*, settlement.*',
    rollbackNote: 'ไม่ลบ audit rows; rollback เฉพาะ code ที่ emit ผิดและเพิ่ม compensating audit note ถ้าจำเป็น',
    verificationCommand: 'curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25"',
    prompt: 'ทำ program Compliance audit ต่อ: ตรวจ audit coverage, structured metadata, permission history, retention/archive และ export traceability'
  },
  {
    icon: Database,
    track: 'Data',
    title: 'Data reporting accuracy program',
    status: 'Planned',
    body: 'คุม stock report, sales report, daily summaries, cost/profit basis, tenant health และ slow report prevention',
    expectedState: 'report สำคัญมี source of truth, reconciliation rule, indexed query/read model และ production verification command',
    errorState: 'stock/sales/profit ไม่ตรง ledger, report query หนัก production, summary rebuild ไม่ได้ หรือ tenant health ใช้ข้อมูลไม่ครบ',
    auditEvent: 'No audit expected for read-only reports; adjustments and rebuild actions must emit future report.* or stock.* audit events',
    rollbackNote: 'revert report query/read model change; อย่าแก้ตัวเลขจริงโดยตรง ให้ rebuild summary จาก source of truth',
    verificationCommand: "rg -n 'StockLedger|BranchStockBalance|daily|summary|report|profit|cost' docs/product-system apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Data reporting accuracy ต่อ: วาง stock/sales/profit reports, daily summaries, read models, reconciliation และ slow report prevention'
  },
  {
    icon: ClipboardCheck,
    track: 'QA',
    title: 'QA regression program',
    status: 'Planned',
    body: 'รวม auth/role tests, API contracts, mutation guard tests, migration validation, production smoke และ visual responsive checks',
    expectedState: 'ทุก deploy มี local verification, production smoke, task card status update และ regression checklist ที่รันซ้ำได้',
    errorState: 'ไม่มี test สำหรับ guard สำคัญ, deploy ผ่านแต่ smoke fail, card status ไม่อัปเดต หรือ production behavior ไม่ตรง docs',
    auditEvent: 'No DB audit expected for test runs; failed protected requests should still emit their route-specific audit events',
    rollbackNote: 'ถ้า regression production ให้ rollback last deploy เฉพาะ thefox-app แล้วเปิด task card พร้อมหลักฐาน command/output',
    verificationCommand: 'npm run typecheck',
    prompt: 'ทำ program QA regression ต่อ: วาง auth/role/API/mutation/migration/production smoke/visual responsive checklist และ update card status ทุก task'
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

        <section className="fox-roadmap-panel fox-task-board" aria-label="System track program board">
          <div className="fox-roadmap-panel__head">
            <div>
              <h2>System Track Board: Optimize, Pentest, Business</h2>
              <p>ชุดนี้เป็น program board สำหรับวนงานระบบซ้ำๆ ให้ The Fox โตแบบแข็งแรง: security, performance, business integrity, operations, compliance, data และ QA</p>
            </div>
            <span>
              <ClipboardCheck size={16} />
              Program loop
            </span>
          </div>
          <div className="fox-task-grid">
            {systemPrograms.map(({ icon: Icon, track, title, status, body, expectedState, errorState, auditEvent, rollbackNote, verificationCommand, prompt }) => (
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
