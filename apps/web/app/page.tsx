'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Bike,
  ChevronRight,
  Clock3,
  Loader2,
  Moon,
  Home,
  MapPin,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Star,
  Sun,
  User,
  X
} from 'lucide-react';
import { ProductSchema, type Product } from '@thefox/shared';

type ProductTile = {
  product: Product;
  merchant: string;
  eta: string;
  rating: string;
  distance: string;
};

type LoginReason = 'notifications' | 'cart' | 'orders' | 'account';
type AuthProvider = 'line' | 'google' | 'apple';
type AuthStatus = 'idle' | 'loading' | 'ready';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

const heroHighlights = ['ส่งวันนี้', 'ร้านใกล้คุณ', 'วัตถุดิบพร้อมใช้', 'เช็คเวลาก่อนสั่ง'];

const orderSteps = ['รับออเดอร์', 'ร้านจัดของ', 'คนขับเข้ารับ', 'ส่งถึงครัว'];

const workspaceLinks = [
  { href: '/vendor', label: 'สำหรับร้านค้า' },
  { href: '/driver', label: 'สำหรับคนขับ' },
  { href: '/admin', label: 'สำหรับทีมงาน' }
];

const loginCopy: Record<LoginReason, { eyebrow: string; title: string; body: string }> = {
  notifications: {
    eyebrow: 'แจ้งเตือนส่วนตัว',
    title: 'เข้าสู่ระบบเพื่อรับสถานะร้านและออเดอร์',
    body: 'เราจะใช้บัญชีเดียวกันทั้งเว็บ PWA และ Expo เพื่อให้แจ้งเตือน คำสั่งซื้อ และสิทธิ์ผู้ใช้ต่อกันครบ'
  },
  cart: {
    eyebrow: 'เพิ่มลงตะกร้า',
    title: 'ล็อกอินก่อนเก็บตะกร้าของคุณ',
    body: 'ตะกร้าจะถูกผูกกับ session จาก Fastify auth เพื่อให้ซื้อบนเว็บแล้วตามต่อบนแอปได้'
  },
  orders: {
    eyebrow: 'ประวัติออเดอร์',
    title: 'ดูออเดอร์ได้หลังเข้าสู่ระบบ',
    body: 'คำสั่งซื้อ สถานะจัดส่ง และใบเสร็จจะตามบัญชีเดียวกันทั้ง customer, vendor และทีมปฏิบัติการ'
  },
  account: {
    eyebrow: 'บัญชี theFOX',
    title: 'เลือกวิธีเข้าสู่ระบบ',
    body: 'ระบบนี้ออกแบบไว้สำหรับ Expo AuthSession + Fastify auth endpoints ไม่มีวงจร backend เดิมใน flow ใหม่'
  }
};

const authProviders: Array<{ id: AuthProvider; label: string; detail: string; mark: string }> = [
  {
    id: 'line',
    label: 'LINE',
    detail: 'เหมาะกับผู้ใช้ไทยและแจ้งเตือนออเดอร์',
    mark: 'LINE'
  },
  {
    id: 'google',
    label: 'Google',
    detail: 'ใช้ต่อได้ดีทั้งเว็บ PWA และ Android',
    mark: 'G'
  },
  {
    id: 'apple',
    label: 'Apple',
    detail: 'พร้อมสำหรับ iOS และ Expo build',
    mark: 'A'
  }
];

export default function HomePage() {
  const [loginReason, setLoginReason] = useState<LoginReason | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');

  const loginOpen = loginReason !== null;
  const activeCopy = loginReason ? loginCopy[loginReason] : loginCopy.account;

  const openLogin = (reason: LoginReason) => {
    setLoginReason(reason);
    setSelectedProvider(null);
    setAuthStatus('idle');
  };

  const closeLogin = () => {
    setLoginReason(null);
    setSelectedProvider(null);
    setAuthStatus('idle');
  };

  const chooseProvider = (provider: AuthProvider) => {
    setSelectedProvider(provider);
    setAuthStatus('loading');

    if (provider === 'line' || provider === 'google') {
      window.location.href = `${apiBaseUrl}/v1/auth/${provider}/start`;
    }
  };

  useEffect(() => {
    if (!loginOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLogin();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loginOpen]);

  useEffect(() => {
    if (authStatus !== 'loading') {
      return undefined;
    }

    const timer = window.setTimeout(() => setAuthStatus('ready'), 680);
    return () => window.clearTimeout(timer);
  }, [authStatus, selectedProvider]);

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
            <img src="/brand/thefox-logo-transparent.png" alt="" />
          </span>
          <div>
            <span className="fox-overline">ส่งไปที่</span>
            <strong>
              <MapPin size={15} />
              เชียงใหม่ · บ้าน
            </strong>
          </div>
        </div>
        <button className="fox-icon-button" type="button" aria-label="Notifications" onClick={() => openLogin('notifications')}>
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
            <h1>วัตถุดิบสดจากร้านใกล้บ้าน</h1>
            <div className="fox-hero-highlights" aria-label="Marketplace benefits">
              {heroHighlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
          </div>
          <div className="fox-delivery-badge">
            <Bike size={22} />
            <span>18-40 นาที</span>
          </div>
        </div>
      </section>

      <section className="fox-service-row" aria-label="Service categories">
        {services.map((service) => (
          <button key={service} className="fox-chip" type="button">
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
          <button className="fox-text-button" type="button">
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
                  <button type="button" aria-label={`Add ${product.name} to cart`} onClick={() => openLogin('cart')}>
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fox-order-status" aria-label="Order confidence">
        <div className="fox-order-status__head">
          <span>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>ออเดอร์ชัดเจนทุกขั้น</strong>
            <p>ร้านยืนยันสินค้า คนขับรับงาน และติดตามสถานะได้ใน flow เดียว</p>
          </div>
        </div>
        <div className="fox-order-steps" aria-label="Order status steps">
          {orderSteps.map((step, index) => (
            <div key={step} className="fox-order-step">
              <span>{index === 0 ? <ReceiptText size={14} /> : index === 3 ? <MapPin size={14} /> : <Clock3 size={14} />}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="fox-workspace-links" aria-label="Partner and team workspaces">
        <span>เข้าสู่ workspace</span>
        <div>
          {workspaceLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <nav className="fox-bottom-nav" aria-label="Primary">
        <button type="button" aria-current="page">
          <Home size={20} />
          หน้าหลัก
        </button>
        <button type="button">
          <Search size={20} />
          ค้นหา
        </button>
        <button type="button" onClick={() => openLogin('orders')}>
          <ReceiptText size={20} />
          ออเดอร์
        </button>
        <button type="button" onClick={() => openLogin('account')}>
          <User size={20} />
          บัญชี
        </button>
      </nav>

      {loginOpen ? (
        <div className="fox-auth-layer" role="presentation">
          <button className="fox-auth-scrim" type="button" aria-label="Close login" onClick={closeLogin} />
          <section
            className="fox-auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fox-auth-title"
            aria-describedby="fox-auth-description"
          >
            <span className="fox-auth-grabber" aria-hidden="true" />
            <div className="fox-auth-head">
              <div>
                <p className="fox-auth-eyebrow">{activeCopy.eyebrow}</p>
                <h2 id="fox-auth-title">{activeCopy.title}</h2>
              </div>
              <button className="fox-auth-close" type="button" aria-label="Close login" onClick={closeLogin}>
                <X size={18} />
              </button>
            </div>

            <p id="fox-auth-description" className="fox-auth-copy">
              {activeCopy.body}
            </p>

            <div className="fox-auth-stack" aria-label="Sign in providers">
              {authProviders.map((provider) => {
                const active = selectedProvider === provider.id;

                return (
                  <button
                    key={provider.id}
                    className="fox-provider-button"
                    type="button"
                    data-provider={provider.id}
                    aria-pressed={active}
                    disabled={authStatus === 'loading' && !active}
                    onClick={() => chooseProvider(provider.id)}
                  >
                    <span className="fox-provider-mark" aria-hidden="true">
                      {provider.mark}
                    </span>
                    <span className="fox-provider-text">
                      <strong>ดำเนินการต่อด้วย {provider.label}</strong>
                      <small>{provider.detail}</small>
                    </span>
                    {authStatus === 'loading' && active ? (
                      <Loader2 className="fox-provider-spinner" size={18} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={18} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="fox-auth-status" data-status={authStatus} aria-live="polite">
              <span />
              <p>
                {authStatus === 'ready'
                  ? 'Apple จะใช้ contract เดียวกันหลังจาก LINE และ Google flow นิ่งแล้ว'
                  : authStatus === 'loading'
                    ? selectedProvider === 'line' || selectedProvider === 'google'
                      ? `กำลังส่งคุณไป ${selectedProvider === 'line' ? 'LINE' : 'Google'} Login ผ่าน Fastify auth endpoint`
                      : 'กำลังเตรียม OAuth redirect และ PKCE verifier สำหรับ AuthSession'
                    : 'เลือก provider แล้วระบบจะต่อ flow เดียวกันสำหรับเว็บ PWA และ Expo'}
              </p>
            </div>

            <button className="fox-auth-secondary" type="button" onClick={closeLogin}>
              ดูต่อก่อน
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
