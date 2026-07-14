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
    status: 'Verified',
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
    status: 'Verified',
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
    icon: ShieldCheck,
    track: 'Foundation',
    title: 'Multi-tenant isolation program',
    status: 'Core foundation 1',
    body: 'คุม tenant data boundary, branch scope, owner/member permission, query-level guard และ cross-tenant leak tests',
    expectedState: 'ทุก API/read model/mutation ถูก scope ด้วย tenant/branch และมี test กัน customer/vendor/driver/admin เห็นข้อมูลข้าม tenant',
    errorState: 'ผู้ใช้เห็น tenant อื่น, owner/member scope ผิด, branch transfer ข้ามสิทธิ์ หรือ report รวมข้อมูลผิด boundary',
    auditEvent: 'future tenant_scope.*, vendor.scope_denied, admin.cross_tenant_review.*, report.scope_guard.*',
    rollbackNote: 'ปิด workflow ที่ leak, preserve audit evidence, revert guard/query change แล้ว redeploy เฉพาะ thefox web/api',
    verificationCommand: "rg -n 'tenantId|branchId|vendorMembership|requireRole|owner|member' apps/api/src apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Multi-tenant isolation ต่อ: ตรวจ tenant data boundary, branch scope, owner/member permission, query guard และ cross-tenant leak tests'
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
    icon: Boxes,
    track: 'Foundation',
    title: 'Inventory truth & ledger program',
    status: 'Core foundation 2',
    body: 'แยกเป็นแกนหลักของระบบ: unit conversion, SKU, stock ledger, reserved stock, transfer, stock take และ adjustment ที่ย้อนรอยได้',
    expectedState: 'stock ทุกตัวมาจาก ledger และ reservation ไม่ใช่ตัวเลขลอย; unit หลัก/ย่อย tenant กำหนดได้และคำนวณย้อนกลับได้',
    errorState: 'stock on hand ไม่ตรง ledger, reserved stock ติดลบ, transfer ไม่ balance, unit conversion ทำให้ cost/profit เพี้ยน',
    auditEvent: 'future stock.ledger.write, stock.reserve, stock.release, stock.transfer, stock.adjustment, stock_take.close',
    rollbackNote: 'ห้ามแก้ตัวเลข stock โดยตรง; ใช้ compensating ledger entry และเก็บ evidence ของ adjustment ทุกครั้ง',
    verificationCommand: "rg -n 'StockLedger|BranchStockBalance|reserved|unit|SKU|stock_take|transfer' docs/product-system apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Inventory truth & ledger ต่อ: วาง unit/SKU/ledger/reserved/transfer/stock take/adjustment พร้อม audit และ reconciliation'
  },
  {
    icon: ChartNoAxesCombined,
    track: 'Foundation',
    title: 'Settlement & payout integrity program',
    status: 'Core foundation 3',
    body: 'คุม cost, profit, platform fee, tenant payable, rider payout, refund, adjustment และ dispute ให้คำนวณซ้ำได้',
    expectedState: 'ทุก order มี settlement basis ที่ย้อนกลับได้ พร้อม fee version, cost basis, payout state และ adjustment ledger',
    errorState: 'กำไร/ทุนไม่ตรง, payout ซ้ำ, refund ไม่หักถูกจุด, platform fee เปลี่ยนแล้ว audit ไม่ชัด หรือ dispute ปิดไม่ได้',
    auditEvent: 'future settlement.calculate, settlement.adjust, payout.schedule, payout.release, refund.issue, dispute.close',
    rollbackNote: 'ใช้ settlement adjustment แทนการลบประวัติ; rollback rule version ได้แต่ต้องคง ledger evidence',
    verificationCommand: "rg -n 'settlement|payout|platform fee|profit|cost|refund|dispute' docs/product-system apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Settlement & payout integrity ต่อ: วาง cost/profit/platform fee/tenant payable/rider payout/refund/dispute พร้อม audit'
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
    icon: BrainCircuit,
    track: 'Marketplace moat',
    title: 'Marketplace intelligence program',
    status: 'Marketplace moat 1',
    body: 'คุม demand/supply matching, product/vendor ranking, freshness score, near-expiry handling และ out-of-stock substitution',
    expectedState: 'ranking อธิบายได้จาก stock readiness, freshness, distance, SLA, margin guard และ tenant quality โดยไม่ข้าม permission',
    errorState: 'แนะนำสินค้าหมด, ranking ดันของ margin ติดลบ, freshness ไม่ถูกนับ, substitution ทำให้ order/stock ผิด',
    auditEvent: 'future marketplace.rank, marketplace.substitute, marketplace.freshness_score, marketplace.supply_match',
    rollbackNote: 'ปิด ranking/substitution rule แล้ว fallback เป็น deterministic sort จาก stock readiness และ distance',
    verificationCommand: "rg -n 'ranking|freshness|substitution|out-of-stock|demand|supply|margin' docs/product-system apps/api/src",
    prompt: 'ทำ program Marketplace intelligence ต่อ: วาง demand/supply matching, product/vendor ranking, freshness score, near-expiry และ substitution rules'
  },
  {
    icon: Boxes,
    track: 'Marketplace moat',
    title: 'Freshness & cold-chain program',
    status: 'Marketplace moat 2',
    body: 'คุม freshness grade, expiry window, cold-chain evidence, quality check และ reject/claim path สำหรับของสด',
    expectedState: 'สินค้าของสดมี freshness/expiry rule, pickup/dropoff evidence, quality status และ claim path ที่ audit ได้',
    errorState: 'ขายของหมดอายุ, cold-chain evidence หาย, quality reject ไม่คืน stock/payment ถูกต้อง หรือ freshness score อธิบายไม่ได้',
    auditEvent: 'future freshness.grade, cold_chain.evidence, quality_check.pass, quality_check.reject, claim.freshness',
    rollbackNote: 'หยุดขาย lot/branch ที่เสี่ยง, preserve evidence, ใช้ stock adjustment/refund/dispute แทนการลบประวัติ',
    verificationCommand: "rg -n 'freshness|expiry|cold|quality|claim|lot|temperature' docs/product-system apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Freshness & cold-chain ต่อ: วาง freshness grade, expiry window, cold-chain evidence, quality check และ claim path'
  },
  {
    icon: ShieldAlert,
    track: 'Marketplace moat',
    title: 'Trust score & risk engine program',
    status: 'Marketplace moat 3',
    body: 'ให้คะแนน risk ของ customer, vendor, driver, tenant, payment/refund abuse และ role/audit anomaly',
    expectedState: 'risk score อธิบายได้ มี threshold/action/fallback และไม่ block ธุรกรรมสำคัญโดยไม่มี audit evidence',
    errorState: 'risk score ดำมืด, false positive สูง, refund abuse ไม่ถูกจับ, role anomaly ไม่แจ้ง หรือ block โดย rollback ไม่ได้',
    auditEvent: 'future risk.customer_score, risk.vendor_score, risk.driver_score, risk.refund_abuse, risk.role_anomaly',
    rollbackNote: 'ลด threshold หรือปิด risk rule version; ใช้ manual review queue และเก็บ score evidence',
    verificationCommand: "rg -n 'risk|fraud|abuse|anomaly|score|refund|role' docs/product-system apps/api/src apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Trust score & risk engine ต่อ: วาง customer/vendor/driver/tenant risk, refund abuse, role anomaly และ review workflow'
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
    icon: Building2,
    track: 'Operations scale',
    title: 'Vendor operations excellence program',
    status: 'Operations scale 1',
    body: 'คุม vendor onboarding, branch readiness, product completeness, stock discipline, fulfillment SLA และ vendor health coaching',
    expectedState: 'vendor/branch มี readiness score, product data completeness, stock discipline และ SLA ที่ admin ติดตาม/coach ได้',
    errorState: 'branch เปิดขายทั้งที่ไม่พร้อม, product data ขาด, stock update ไม่สม่ำเสมอ, fulfillment SLA ตกแต่ไม่มี action',
    auditEvent: 'future vendor.readiness.update, vendor.coaching.note, branch.readiness.approve, product.completeness.review',
    rollbackNote: 'ปรับ branch/tenant status กลับ pending/paused และเก็บ coaching/audit note โดยไม่ลบข้อมูล vendor',
    verificationCommand: "rg -n 'vendor|tenant|branch|readiness|SLA|product completeness|stock discipline' docs/product-system apps/api/src",
    prompt: 'ทำ program Vendor operations excellence ต่อ: วาง onboarding/readiness/product completeness/stock discipline/SLA/vendor health coaching'
  },
  {
    icon: Truck,
    track: 'Operations scale',
    title: 'Driver/rider dispatch reliability program',
    status: 'Operations scale 2',
    body: 'คุม driver availability, batching, assignment, ETA, proof of pickup/dropoff, failed delivery และ handoff',
    expectedState: 'dispatch ตัดสินใจจาก availability, capacity, distance, SLA, cost และมี proof/evidence ทุก transition',
    errorState: 'assign driver ไม่พร้อม, ETA เพี้ยน, batch ทำให้ของสดเสีย, proof หาย, failed delivery ไม่คืน stock/payment ถูกต้อง',
    auditEvent: 'future dispatch.assign, dispatch.reassign, delivery.pickup_proof, delivery.dropoff_proof, delivery.failed',
    rollbackNote: 'ปิด auto-dispatch rule, กลับ manual assignment, preserve proof และใช้ compensating delivery/order event',
    verificationCommand: "rg -n 'driver|rider|dispatch|assignment|ETA|pickup|dropoff|delivery' docs/product-system apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Driver/rider dispatch reliability ต่อ: วาง availability/batching/assignment/ETA/proof/failed delivery/handoff'
  },
  {
    icon: ShieldCheck,
    track: 'Operations scale',
    title: 'Customer trust & issue resolution program',
    status: 'Operations scale 3',
    body: 'คุม refund, claim ของเสีย, evidence photo, SLA, complaint, dispute timeline และ customer communication',
    expectedState: 'ทุก issue มี owner, status, SLA, evidence, refund/adjustment path และ timeline ที่ customer/admin ตามได้',
    errorState: 'เคลมไม่มีหลักฐาน, refund ผิด settlement, complaint หาย, SLA เกินแล้วไม่มี escalation หรือ dispute ปิดไม่ครบ',
    auditEvent: 'future issue.create, issue.evidence.add, issue.escalate, refund.approve, dispute.resolve',
    rollbackNote: 'ไม่ลบ issue timeline; ใช้ adjustment/refund reversal และ compensating audit note เมื่อแก้ผิด',
    verificationCommand: "rg -n 'issue|claim|refund|complaint|dispute|SLA|evidence' docs/product-system apps/api/src apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Customer trust & issue resolution ต่อ: วาง refund/claim/evidence/SLA/complaint/dispute timeline และ escalation'
  },
  {
    icon: Gauge,
    track: 'Operations scale',
    title: 'Observability & incident command program',
    status: 'Operations scale 4',
    body: 'คุม health, logs, metrics, alerts, error budget, incident timeline, postmortem และ rollback drill',
    expectedState: 'critical path ทุกตัวมี metric/log/alert/runbook และ incident timeline ที่บอก impact/owner/rollback ได้',
    errorState: 'ระบบล่มแต่ไม่รู้, alert noise, log ไม่มี correlation id, rollback drill ไม่เคยซ้อม หรือ postmortem ไม่ผูก task',
    auditEvent: 'No app audit expected for observability setup; incident evidence comes from logs, metrics, deploy records, and postmortems',
    rollbackNote: 'rollback เฉพาะ config/agent/dashboard ที่ทำให้ระบบช้า; ห้ามแตะ business data เพื่อแก้ monitoring',
    verificationCommand: "rg -n 'health|log|metric|alert|incident|postmortem|rollback|correlation' docs scripts apps/api/src",
    prompt: 'ทำ program Observability & incident command ต่อ: วาง health/logs/metrics/alerts/error budget/incident timeline/postmortem/rollback drill'
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
    icon: History,
    track: 'Foundation',
    title: 'Data governance & retention program',
    status: 'Core foundation 4',
    body: 'คุม audit retention, PII, export, deletion policy, access logs, backup/restore verification และ data lineage',
    expectedState: 'ข้อมูลสำคัญมี retention class, access policy, export/deletion path, backup restore proof และ lineage ที่ตรวจได้',
    errorState: 'PII export ไม่มี audit, backup restore ไม่เคย verify, retention ไม่ชัด, access log หาย หรือ deletion กระทบ ledger/audit',
    auditEvent: 'future data.export, data.retention.apply, data.deletion.request, data.access_review, backup.restore_verify',
    rollbackNote: 'ห้ามลบ audit/ledger เพื่อแก้ policy; ใช้ legal hold, archive, anonymize หรือ compensating note ตามประเภทข้อมูล',
    verificationCommand: "rg -n 'PII|retention|backup|restore|export|deletion|access log|audit' docs apps/api/src scripts",
    prompt: 'ทำ program Data governance & retention ต่อ: วาง audit retention, PII, export/deletion, access logs, backup/restore และ lineage'
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
    icon: ChartNoAxesCombined,
    track: 'Growth loop',
    title: 'Promotion & growth economics program',
    status: 'Growth loop',
    body: 'คุม coupon, campaign, funded discount, referral, CAC/LTV, margin guard และ abuse protection',
    expectedState: 'promotion ทุกตัวมี funding source, margin guard, eligibility rule, abuse check และ settlement impact ที่คำนวณได้',
    errorState: 'ส่วนลดทำให้ margin ติดลบ, coupon ซ้ำ, referral abuse, campaign cost ไม่รู้เจ้าของ หรือ settlement ไม่สะท้อนส่วนลด',
    auditEvent: 'future promotion.create, promotion.redeem, promotion.abuse_blocked, referral.reward, campaign.settlement',
    rollbackNote: 'ปิด campaign/promo code, preserve redemption evidence, ใช้ settlement adjustment แทนการแก้ยอดย้อนหลังตรงๆ',
    verificationCommand: "rg -n 'promotion|coupon|campaign|discount|referral|CAC|LTV|margin' docs/product-system apps/api/src apps/api/prisma/schema.prisma",
    prompt: 'ทำ program Promotion & growth economics ต่อ: วาง coupon/campaign/funded discount/referral/CAC/LTV/margin guard/abuse protection'
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
