import {
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  Clock3,
  MoveRight,
  PackageCheck,
  Scale,
  Store,
  TriangleAlert,
  UtensilsCrossed
} from 'lucide-react';
import { RoleGuard } from '@/components/auth/role-guard';

const vendorOrders = [
  { id: 'FX-1028', items: 'ผักบุ้งจีนสด, ไข่ไก่เบอร์ 2', eta: 'รับใน 12 นาที' },
  { id: 'FX-1029', items: 'ข้าวหอมมะลิ 5 กก.', eta: 'รอยืนยัน stock' },
  { id: 'FX-1030', items: 'ชุดผักพร้อมครัว', eta: 'จัดของอยู่' }
];

const vendorTools = [
  { icon: Store, title: 'Branch today', body: 'เปิดร้าน 2 สาขา · ปิดรับ 21:30', meta: 'เชียงใหม่ / นิมมาน' },
  { icon: Boxes, title: 'Stock alerts', body: 'สินค้าใกล้หมด 8 รายการ', meta: 'ต้องนับ stock วันนี้' },
  { icon: Scale, title: 'Unit master', body: 'kg, g, pack, tray พร้อม conversion', meta: 'tenant-defined' },
  { icon: PackageCheck, title: 'Ready queue', body: 'รอคนขับเข้ารับ 5 ออเดอร์', meta: 'handoff active' }
];

const inventoryRows = [
  { sku: 'PORK-BELLY-500G', name: 'หมูสามชั้น 500 g', branch: 'นิมมาน', stock: '18 pack', unit: 'pack = 0.5 kg', status: 'พร้อมขาย' },
  { sku: 'EGG-M-TRAY', name: 'ไข่ไก่เบอร์ 2', branch: 'เจ็ดยอด', stock: '4 tray', unit: 'tray = 30 pcs', status: 'ใกล้หมด' },
  { sku: 'JASMINE-RICE-5KG', name: 'ข้าวหอมมะลิ 5 กก.', branch: 'นิมมาน', stock: 'รอนับ', unit: 'bag = 5 kg', status: 'hold' }
];

const swipeTasks = [
  { icon: TriangleAlert, title: 'รับ transfer จากเจ็ดยอด', detail: 'ไข่ไก่เบอร์ 2 · 6 tray · ต้องยืนยันจำนวนรับเข้า' },
  { icon: MoveRight, title: 'Stock variance approval', detail: 'หมูสามชั้น 500 g ขาด 2 pack · ต้องใส่เหตุผลก่อนปรับ ledger' },
  { icon: CheckCircle2, title: 'Order handoff', detail: 'FX-1028 จัดของครบ · รอเลือก driver หรือ tenant self-delivery' }
];

export default function VendorPage() {
  return (
    <RoleGuard allowedRoles={['vendor', 'admin', 'superadmin']} workspaceName="Vendor">
      <main className="fox-console fox-console--vendor">
        <header className="fox-console-hero">
          <a className="fox-console-brand" href="/">
            <span className="fox-logo-mark" aria-hidden="true">
              <img src="/brand/thefox-logo-transparent.png" alt="" />
            </span>
            <span>theFOX Vendor</span>
          </a>
          <div>
            <p className="fox-kicker">PARTNER WORKSPACE</p>
            <h1>Inventory-first workspace สำหรับ tenant และ branch</h1>
            <p>พื้นที่ vendor ต้องเริ่มจาก stock truth: unit, SKU, branch balance, transfer และ order handoff ต้องเดินจาก ledger เดียวกัน</p>
          </div>
        </header>

        <section className="fox-vendor-context" aria-label="Vendor operational context">
          <article>
            <span>Tenant</span>
            <strong>SROS Fresh Supply</strong>
            <p>central catalog · 2 active branches</p>
          </article>
          <article>
            <span>Branch</span>
            <strong>นิมมาน</strong>
            <p>ขายหน้าร้าน + delivery + transfer in/out</p>
          </article>
          <article>
            <span>Next build</span>
            <strong>Unit / SKU / Ledger</strong>
            <p>ก่อนเปิด order flow จริง</p>
          </article>
        </section>

        <section className="fox-console-split">
          <div className="fox-console-list">
            <div className="fox-console-section-head">
              <h2>ออเดอร์เข้าใหม่</h2>
              <span>Stock-gated preview</span>
            </div>
            {vendorOrders.map((order) => (
              <article key={order.id} className="fox-console-row">
                <span>
                  <UtensilsCrossed size={18} />
                </span>
                <div>
                  <strong>{order.id}</strong>
                  <p>{order.items}</p>
                </div>
                <small>{order.eta}</small>
              </article>
            ))}
          </div>

          <div className="fox-console-grid fox-console-grid--compact" aria-label="Vendor tools">
            {vendorTools.map(({ icon: Icon, title, body, meta }) => (
              <article key={title} className="fox-console-card">
                <span>
                  <Icon size={20} />
                </span>
                <h2>{title}</h2>
                <p>{body}</p>
                <small>{meta}</small>
              </article>
            ))}
            <article className="fox-console-next">
              <Clock3 size={20} />
              <div>
                <strong>Guard ถัดไป</strong>
                <p>vendor จะเห็นเฉพาะ tenant และ branch ที่ตัวเองเป็น member เท่านั้น</p>
              </div>
            </article>
          </div>
        </section>

        <section className="fox-inventory-board" aria-label="Inventory UX roadmap">
          <div className="fox-roadmap-panel__head">
            <div>
              <h2>Stock & Inventory Surface</h2>
              <p>นี่คือ UX ชั้นแรกก่อนต่อ API จริง: branch stock ต้องเห็น SKU, unit conversion, status และ action ที่จะบันทึก ledger</p>
            </div>
            <span>
              <ArrowLeftRight size={16} />
              Ledger required
            </span>
          </div>

          <div className="fox-inventory-layout">
            <div className="fox-inventory-table" role="table" aria-label="Branch inventory">
              <div className="fox-inventory-table__head" role="row">
                <span role="columnheader">SKU</span>
                <span role="columnheader">Branch stock</span>
                <span role="columnheader">Unit</span>
                <span role="columnheader">Status</span>
              </div>
              {inventoryRows.map((row) => (
                <article key={row.sku} className="fox-inventory-row" role="row">
                  <div role="cell">
                    <strong>{row.name}</strong>
                    <p>{row.sku}</p>
                  </div>
                  <div role="cell">
                    <strong>{row.stock}</strong>
                    <p>{row.branch}</p>
                  </div>
                  <div role="cell">
                    <p>{row.unit}</p>
                  </div>
                  <div role="cell">
                    <span className={`fox-stock-state fox-stock-state--${row.status === 'พร้อมขาย' ? 'ok' : row.status === 'ใกล้หมด' ? 'warn' : 'hold'}`}>
                      {row.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <aside className="fox-swipe-stack" aria-label="Swipe task preview">
              <div className="fox-console-section-head">
                <h2>Swipe task ต่อไป</h2>
                <span>SROS pattern</span>
              </div>
              {swipeTasks.map(({ icon: Icon, title, detail }) => (
                <article key={title} className="fox-swipe-card">
                  <span>
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </aside>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
