import { Bike, Boxes, Building2, ClipboardList, ShieldCheck, Store, Truck, UserRound } from 'lucide-react';

const operatingLanes = [
  {
    icon: Building2,
    title: 'Tenant',
    body: 'ผู้ประกอบการหลายเจ้า ลงทะเบียนธุรกิจและบริหารข้อมูลกลางของแบรนด์'
  },
  {
    icon: Store,
    title: 'Branch',
    body: 'หลายสาขาต่อ tenant พร้อมเวลาเปิดปิด พื้นที่ให้บริการ และ stock แยกสาขา'
  },
  {
    icon: Boxes,
    title: 'Catalog',
    body: 'วัตถุดิบ หน่วยนับ ราคา รูปภาพ และสถานะพร้อมขายที่ต้องตรวจสอบได้'
  },
  {
    icon: ClipboardList,
    title: 'Order',
    body: 'คำสั่งซื้อที่ผูก tenant, branch, customer, รายการสินค้า และ audit trail'
  },
  {
    icon: Truck,
    title: 'Driver',
    body: 'คนส่งสมัครในระบบ รับงาน ส่งสถานะ และเชื่อมกับ dispatch flow'
  },
  {
    icon: ShieldCheck,
    title: 'Ops',
    body: 'ทีมกลางดูแลความปลอดภัย สิทธิ์ผู้ใช้ การแก้ปัญหา และ performance'
  }
];

export default function InsidePage() {
  return (
    <main className="fox-inside">
      <header className="fox-inside-hero">
        <a className="fox-inside-brand" href="/">
          <span className="fox-logo-mark" aria-hidden="true">
            <img src="/brand/thefox-logo-transparent.png" alt="" />
          </span>
          <span>theFOX</span>
        </a>

        <div className="fox-inside-hero__copy">
          <p className="fox-kicker">THEFOX OPERATING SYSTEM</p>
          <h1>พื้นที่ด้านในสำหรับวาง tenant, branch, order และ driver flow</h1>
          <p>
            ตอนนี้เป็นประตูแรกหลัง LINE Auth เพื่อให้เราค่อย ๆ ต่อ business logic, security, performance และ UX/UI ไปทีละชั้นแบบแน่น ๆ
          </p>
        </div>

        <div className="fox-inside-session">
          <UserRound size={18} />
          <div>
            <strong>LINE Auth connected</strong>
            <span>session จะย้ายไปฐานข้อมูลและ role guard ในรอบถัดไป</span>
          </div>
        </div>
      </header>

      <section className="fox-inside-grid" aria-label="theFOX operating lanes">
        {operatingLanes.map(({ icon: Icon, title, body }) => (
          <article key={title} className="fox-inside-card">
            <span>
              <Icon size={20} />
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="fox-inside-next">
        <Bike size={20} />
        <div>
          <strong>ลำดับถัดไปที่ควรต่อ</strong>
          <p>auth guard จริง, tenant schema, branch schema, session table, driver onboarding และ order assignment</p>
        </div>
      </section>
    </main>
  );
}
