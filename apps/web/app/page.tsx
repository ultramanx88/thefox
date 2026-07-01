import {
  Bell,
  Bike,
  ChevronRight,
  Moon,
  Home,
  MapPin,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Star,
  Sun,
  User
} from 'lucide-react';
import { ProductSchema, type Product } from '@thefox/shared';

type ProductTile = {
  product: Product;
  merchant: string;
  eta: string;
  rating: string;
  distance: string;
};

const products: ProductTile[] = [
  {
    product: ProductSchema.parse({
      id: 'morning-glory',
      name: 'ผักบุ้งจีนสด',
      price: 25,
      unit: 'กำ',
      category: 'ผักสด',
      imageUrl: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=900&q=80',
      vendorId: 'vendor-local-1',
      stock: 80,
      description: 'คัดจากตลาดเช้า ส่งถึงครัวในวันเดียว'
    }),
    merchant: 'ตลาดเช้าสันทราย',
    eta: '18-25 นาที',
    rating: '4.8',
    distance: '1.4 กม.'
  },
  {
    product: ProductSchema.parse({
      id: 'eggs-pack',
      name: 'ไข่ไก่เบอร์ 2',
      price: 125,
      unit: 'แผง',
      category: 'เนื้อและไข่',
      imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=900&q=80',
      vendorId: 'vendor-local-1',
      stock: 40,
      description: 'ไข่สดจากฟาร์มท้องถิ่น'
    }),
    merchant: 'ฟาร์มบ้านเหนือ',
    eta: '22-30 นาที',
    rating: '4.9',
    distance: '2.1 กม.'
  },
  {
    product: ProductSchema.parse({
      id: 'jasmine-rice',
      name: 'ข้าวหอมมะลิ',
      price: 210,
      unit: 'ถุง 5 กก.',
      category: 'ข้าวสาร',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
      vendorId: 'vendor-local-2',
      stock: 120,
      description: 'ข้าวใหม่ หอม นุ่ม เหมาะสำหรับทุกบ้าน'
    }),
    merchant: 'โกดังข้าวแม่ริม',
    eta: '30-40 นาที',
    rating: '4.7',
    distance: '4.8 กม.'
  }
];

const services = ['ของสด', 'พร้อมส่ง', 'ร้านใกล้ฉัน', 'ดีลวันนี้'];

const rails = [
  { label: 'ค่าส่งเริ่มต้น', value: '฿12' },
  { label: 'ร้านเปิดอยู่', value: '42' },
  { label: 'เฉลี่ยส่งถึง', value: '24 นาที' }
];

export default function HomePage() {
  return (
    <main className="fox-app">
      <fieldset className="fox-theme-switcher" aria-label="Theme preview">
        <legend>Theme</legend>
        <label>
          <input type="radio" name="fox-theme" value="light" />
          <Sun size={15} />
          <span>Light</span>
        </label>
        <label>
          <input type="radio" name="fox-theme" value="dark" />
          <Moon size={15} />
          <span>Dark</span>
        </label>
      </fieldset>

      <header className="fox-topbar" aria-label="Delivery app header">
        <div className="fox-location">
          <span className="fox-logo-mark" aria-hidden="true">
            FOX
          </span>
          <div>
            <span className="fox-overline">ส่งไปที่</span>
            <strong>
              <MapPin size={15} />
              เชียงใหม่ · บ้าน
            </strong>
          </div>
        </div>
        <button className="fox-icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </header>

      <section className="fox-search-card" aria-label="Search and delivery summary">
        <label className="fox-search">
          <Search size={19} />
          <input type="search" placeholder="ค้นหาของสด ร้านค้า หรือวัตถุดิบ" />
        </label>

        <div className="fox-hero-strip">
          <div>
            <p className="fox-kicker">THEFOX MARKET</p>
            <h1>ของสดใกล้บ้าน ส่งเร็วแบบแอปเดลิเวอรี</h1>
            <p>สั่งง่ายแบบแอปเดลิเวอรี แต่บุคลิกเป็น black-silver modern สำหรับแบรนด์หัวจิ้งจอกสีเงิน</p>
          </div>
          <div className="fox-delivery-badge">
            <Bike size={22} />
            <span>18-40 นาที</span>
          </div>
        </div>
      </section>

      <section className="fox-service-row" aria-label="Service categories">
        {services.map((service) => (
          <button key={service} className="fox-chip">
            {service}
          </button>
        ))}
      </section>

      <section className="fox-rail" aria-label="Marketplace status">
        {rails.map((rail) => (
          <div key={rail.label} className="fox-rail-card">
            <span>{rail.label}</span>
            <strong>{rail.value}</strong>
          </div>
        ))}
      </section>

      <section className="fox-section">
        <div className="fox-section-head">
          <div>
            <h2>ร้านแนะนำใกล้คุณ</h2>
            <p>คัดจากระยะทาง เวลาเปิดร้าน และสินค้าพร้อมส่ง</p>
          </div>
          <button className="fox-text-button">
            ดูทั้งหมด
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="fox-product-feed">
          {products.map(({ product, merchant, eta, rating, distance }) => (
            <article key={product.id} className="fox-product-card">
              <img src={product.imageUrl} alt={product.name} className="fox-product-card__image" />
              <div className="fox-product-card__body">
                <div className="fox-product-card__meta">
                  <span>{product.category}</span>
                  <span>
                    <Star size={13} fill="currentColor" />
                    {rating}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p>{merchant}</p>
                <div className="fox-product-card__footer">
                  <span>{eta}</span>
                  <span>{distance}</span>
                  <span>คงเหลือ {product.stock}</span>
                </div>
                <div className="fox-buy-row">
                  <strong>฿{product.price}</strong>
                  <span>/{product.unit}</span>
                  <button aria-label={`Add ${product.name} to cart`}>
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fox-trust-panel" aria-label="Production trust">
        <ShieldCheck size={20} />
        <div>
          <strong>พร้อมต่อระบบจริง</strong>
          <p>สินค้า คำสั่งซื้อ และ role จะต่อเข้ากับ API, PostgreSQL และ audit trail โดยใช้ shared schema เดียวกัน</p>
        </div>
      </section>

      <nav className="fox-bottom-nav" aria-label="Primary">
        <a href="#" aria-current="page">
          <Home size={20} />
          หน้าหลัก
        </a>
        <a href="#">
          <Search size={20} />
          ค้นหา
        </a>
        <a href="#">
          <ReceiptText size={20} />
          ออเดอร์
        </a>
        <a href="#">
          <User size={20} />
          บัญชี
        </a>
      </nav>
    </main>
  );
}
