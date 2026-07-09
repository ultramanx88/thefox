import { Boxes, Clock3, PackageCheck, Store, UtensilsCrossed } from 'lucide-react';

const vendorOrders = [
  { id: 'FX-1028', items: 'ผักบุ้งจีนสด, ไข่ไก่เบอร์ 2', eta: 'รับใน 12 นาที' },
  { id: 'FX-1029', items: 'ข้าวหอมมะลิ 5 กก.', eta: 'รอยืนยัน stock' },
  { id: 'FX-1030', items: 'ชุดผักพร้อมครัว', eta: 'จัดของอยู่' }
];

const vendorTools = [
  { icon: Store, title: 'Branch today', body: 'เปิดร้าน 2 สาขา · ปิดรับ 21:30' },
  { icon: Boxes, title: 'Stock alerts', body: 'สินค้าใกล้หมด 8 รายการ' },
  { icon: PackageCheck, title: 'Ready queue', body: 'รอคนขับเข้ารับ 5 ออเดอร์' }
];

export default function VendorPage() {
  return (
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
          <h1>รับออเดอร์ จัดการสินค้า และดู stock แยกสาขา</h1>
          <p>พื้นที่ partner merchant จะโฟกัส incoming orders, product readiness, branch operation และ handoff ให้ driver</p>
        </div>
      </header>

      <section className="fox-console-split">
        <div className="fox-console-list">
          <div className="fox-console-section-head">
            <h2>ออเดอร์เข้าใหม่</h2>
            <span>Live preview</span>
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
          {vendorTools.map(({ icon: Icon, title, body }) => (
            <article key={title} className="fox-console-card">
              <span>
                <Icon size={20} />
              </span>
              <h2>{title}</h2>
              <p>{body}</p>
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
    </main>
  );
}
