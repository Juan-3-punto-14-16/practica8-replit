import { useMemo, useState, type ReactNode, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowDown,
  ArrowRight,
  Clock3,
  MapPin,
  Menu as MenuIcon,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Truck,
  Utensils,
  X,
} from 'lucide-react';

const queryClient = new QueryClient();

type MenuItem = { id: string; name: string; description: string; price: number; category: 'birria' | 'bebidas' };
const menuItems: MenuItem[] = [
  { id: 'taco', name: 'Taco', description: 'Taco suave de birria de res.', price: 13, category: 'birria' },
  { id: 'orden-chica', name: 'Orden Chica', description: 'Orden chica de birria de res con tortillas.', price: 110, category: 'birria' },
  { id: 'orden-grande', name: 'Orden Grande', description: 'Orden grande de birria de res con tortillas.', price: 130, category: 'birria' },
  { id: 'lonche', name: 'Lonche', description: 'Lonche de birria de res en bolillo normal o salado, sujeto a disponibilidad.', price: 55, category: 'birria' },
  { id: 'consome-individual', name: 'Consomé Individual', description: 'Consomé calientito para acompañar.', price: 10, category: 'birria' },
  { id: 'litro-consome', name: 'Litro de Consomé', description: 'Un litro de consomé de birria.', price: 40, category: 'birria' },
  { id: 'agua-lima', name: 'Agua de Lima · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-guayaba-fresa', name: 'Agua de Guayaba con Fresa · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-jamaica', name: 'Agua de Jamaica · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-limon-chia', name: 'Agua de Limón con Chía · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-tamarindo', name: 'Agua de Tamarindo · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-horchata', name: 'Agua de Horchata · ½ litro', description: 'Agua fresca preparada al día.', price: 20, category: 'bebidas' },
  { id: 'agua-natural', name: 'Agua Natural · 1 Lt', description: 'Agua embotellada.', price: 20, category: 'bebidas' },
  { id: 'pepsi-black', name: 'Pepsi Black · 355 ml', description: 'Refresco.', price: 20, category: 'bebidas' },
  { id: 'pepsi-light', name: 'Pepsi Light · 600 ml', description: 'Refresco.', price: 24, category: 'bebidas' },
  { id: 'pepsi-taparrosca', name: 'Pepsi Taparrosca · 600 ml', description: 'Refresco.', price: 24, category: 'bebidas' },
];

type Cart = Record<string, number>;
type OrderDetails = {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  zone: 'local' | 'zmg';
  payment: string;
  instructions: string;
  contactless: boolean;
  bolillo: string;
};

const initialOrder: OrderDetails = {
  name: '', phone: '', address: '', neighborhood: '', zone: 'local', payment: 'Efectivo',
  instructions: '', contactless: false, bolillo: 'Normal',
};
const formatPrice = (value: number) => `$${value.toFixed(2)} MXN`;

const heartLeafPath = 'M0 0 C-2 -2 -8 -7 -8 -12 C-8 -18 -2 -20 0 -14 C2 -20 8 -18 8 -12 C8 -7 2 -2 0 0 Z';

function CloverIcon({ size }: { size: 'header' | 'footer' }) {
  return (
    <svg
      className={`brand-clover brand-clover-${size}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      data-testid={`icon-clover-${size}`}
    >
      <path
        d="M24 23 C24 31 25 37 30 41 C32 43 34 44 37 45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {[45, 135, 225, 315].map((angle) => (
        <g key={angle} transform={`translate(24 23) rotate(${angle}) translate(0 -2.5)`}>
          <path d={heartLeafPath} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

function Home() {
  const [cart, setCart] = useState<Cart>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails>(initialOrder);
  const [error, setError] = useState('');
  const [folio, setFolio] = useState('');

  const cartEntries = useMemo(
    () => menuItems.filter((item) => (cart[item.id] || 0) > 0).map((item) => ({ ...item, quantity: cart[item.id] || 0 })),
    [cart],
  );
  const subtotal = cartEntries.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = order.zone === 'local' ? 20 : 30;
  const total = subtotal + (itemCount ? deliveryFee : 0);
  const hasLonche = (cart.lonche || 0) > 0;

  const changeQuantity = (id: string, delta: number) => {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] || 0) + delta);
      const updated = { ...current };
      if (quantity === 0) delete updated[id];
      else updated[id] = quantity;
      return updated;
    });
    setFolio('');
    setError('');
  };
  const updateOrder = (key: keyof OrderDetails, value: string | boolean) => {
    setOrder((current) => ({ ...current, [key]: value }));
    setFolio('');
    setError('');
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemCount) {
      setError('Agrega al menos un producto a tu pedido desde el menú.');
      return;
    }
    if (!order.name.trim() || !order.phone.trim() || !order.address.trim() || !order.neighborhood.trim()) {
      setError('Completa todos los campos obligatorios para continuar.');
      return;
    }
    if (!/^\d{10}$/.test(order.phone)) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    setError('');
    setFolio(`TRE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
  };

  const whatsappMessage = useMemo(() => {
    if (!folio) return '';
    const lines = [
      `Hola, quiero hacer un pedido a domicilio. Folio ${folio}`,
      '',
      ...cartEntries.map((item) => `• ${item.quantity} x ${item.name} — ${formatPrice(item.price * item.quantity)}`),
      `Subtotal: ${formatPrice(subtotal)}`,
      `Envío: ${formatPrice(deliveryFee)}`,
      `Total: ${formatPrice(total)}`,
      '',
      `Nombre: ${order.name}`,
      `Teléfono: ${order.phone}`,
      `Domicilio: ${order.address}`,
      `Colonia y referencias: ${order.neighborhood}`,
      `Zona: ${order.zone === 'local' ? 'Loma Dorada y alrededores' : 'Fuera de la zona, ZMG'}`,
      `Pago: ${order.payment}`,
      ...(hasLonche ? [`Bolillo: ${order.bolillo.toLowerCase()}`] : []),
      `Entrega sin contacto: ${order.contactless ? 'Sí' : 'No'}`,
      ...(order.instructions.trim() ? [`Instrucciones: ${order.instructions.trim()}`] : []),
      '',
      'Quedo pendiente de confirmación. Gracias.',
    ];
    return `https://wa.me/523332224040?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [folio, cartEntries, subtotal, deliveryFee, total, order, hasLonche]);

  const navItems = [
    ['Inicio', '#inicio'], ['Menú', '#menu'], ['Reseñas', '#resenas'], ['Ubicación', '#ubicacion'],
  ];

  return (
    <div className="site-shell">
      <header className="topbar">
        <nav className="nav-wrap" aria-label="Navegación principal">
          <a className="brand" href="#inicio" aria-label="Tacos el Trebol, inicio" onClick={() => setMobileMenuOpen(false)}>
            <CloverIcon size="header" />
            <span><span className="brand-name">Tacos el Trebol</span><span className="brand-sub">Tradición de familia</span></span>
          </a>
          <button className="menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} data-testid="button-mobile-menu">
            {mobileMenuOpen ? <X size={19} /> : <MenuIcon size={19} />}
          </button>
          <div className={`nav-links${mobileMenuOpen ? ' open' : ''}`}>
            {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} data-testid={`link-nav-${label.toLowerCase()}`}>{label}</a>)}
            <a href="#pedidos" onClick={() => setMobileMenuOpen(false)} data-testid="link-nav-pedidos">Pedidos a domicilio</a>
          </div>
          <a className="nav-order" href="#menu" data-testid="link-ver-menu">Ver menú <ArrowRight size={15} /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-inner">
            <span className="eyebrow">Tonalá, Jalisco · Desde hace más de 20 años</span>
            <h1>La birria que<br />sabe a <em>casa.</em></h1>
            <p className="hero-copy">Tacos suaves de birria de res, consomé bien servido y aguas frescas. Una tradición familiar que se disfruta sin prisa.</p>
            <div className="hero-actions">
              <a href="#menu" className="btn secondary" data-testid="button-explorar-menu">Explorar el menú <ArrowRight size={16} /></a>
              <a href="#ubicacion" className="btn outline" data-testid="button-como-llegar">Cómo llegar <MapPin size={15} /></a>
            </div>
          </div>
          <span className="hero-note">BIRRIA HECHA CON TIEMPO</span>
        </section>

        <div className="quick-strip" aria-label="Información rápida">
          <div className="quick-inner">
            <div className="quick-item"><Clock3 size={20} /><div><strong>Todos los días</strong><span>8:00 a.m. — 1:00 p.m.</span></div></div>
            <div className="quick-item"><Utensils size={20} /><div><strong>Hecho al momento</strong><span>Birria de res y consomé</span></div></div>
            <div className="quick-item"><Truck size={20} /><div><strong>Servicio a domicilio</strong><span>Loma Dorada y ZMG</span></div></div>
            <div className="quick-item"><Phone size={20} /><div><strong>33 3222 4040</strong><span>Llámanos para consultar</span></div></div>
          </div>
        </div>

        <section className="section menu-section" id="menu">
          <div className="section-heading">
            <div><p className="section-kicker">Del comal a tu mesa</p><h2>Un antojo que<br />siempre vuelve.</h2><p className="section-lede">Pide tus favoritos y arma tu orden. Los precios están en pesos mexicanos; agrega o quita productos y verás el subtotal al instante.</p></div>
            <a className="btn outline" href="#pedidos" data-testid="button-ir-pedidos">Pedir a domicilio <ArrowDown size={15} /></a>
          </div>
          <div className="menu-layout">
            <div className="menu-content">
              <h3 className="category-title">Alimentos · Birria de res</h3>
              <div className="menu-items">
                {menuItems.filter((item) => item.category === 'birria').map((item) => (
                  <MenuCard key={item.id} item={item} quantity={cart[item.id] || 0} onAdd={() => changeQuantity(item.id, 1)} onChange={(delta) => changeQuantity(item.id, delta)} />
                ))}
              </div>
              <h3 className="category-title">Bebidas</h3>
              <div className="menu-items">
                {menuItems.filter((item) => item.category === 'bebidas').map((item) => (
                  <MenuCard key={item.id} item={item} quantity={cart[item.id] || 0} onAdd={() => changeQuantity(item.id, 1)} onChange={(delta) => changeQuantity(item.id, delta)} />
                ))}
              </div>
            </div>
            <aside className="cart-panel" aria-label="Tu pedido" data-testid="panel-cart">
              <div className="cart-top"><h3>Tu pedido</h3><span className="cart-count" data-testid="text-cart-count">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span></div>
              {cartEntries.length === 0 ? <div className="cart-empty" data-testid="empty-cart"><ShoppingBag size={27} color="#9b2226" /><p>Tu orden empieza con un antojo.<br />Agrega algo del menú para comenzar.</p></div> : (
                <div className="cart-lines">
                  {cartEntries.map((item) => <div className="cart-line" key={item.id} data-testid={`cart-item-${item.id}`}>
                    <div><div className="cart-line-name">{item.name}</div><div className="cart-line-detail">{formatPrice(item.price)} c/u · {formatPrice(item.price * item.quantity)}</div></div>
                    <QuantityControl quantity={item.quantity} label={item.name} onChange={(delta) => changeQuantity(item.id, delta)} />
                  </div>)}
                </div>
              )}
              <div className="subtotal-row"><span>Subtotal de productos</span><span data-testid="text-cart-subtotal">{formatPrice(subtotal)}</span></div>
              <a href="#pedidos" className="btn cart-cta" data-testid="button-continuar-pedido">Continuar con domicilio <ArrowRight size={15} /></a>
            </aside>
          </div>
        </section>

        <section className="section reviews-section" id="resenas">
          <div className="section-inner">
            <div className="section-heading"><div><p className="section-kicker">La voz de quienes vuelven</p><h2>Más que un taco,<br />un recuerdo.</h2><p className="section-lede">La mejor recomendación viene de la gente que nos acompaña desde hace años.</p></div></div>
            <div className="reviews-grid">
              <ReviewCard featured initials="MV" name="Mariana Victoria" quote="Siguen siendo mis favoritos después de más de 20 años dando servicio. En horas de gran demanda la espera puede ser hasta de 30 min." />
              <ReviewCard initials="JG" name="Juanjo Gomez" quote="Estos tacos son adictivos, excelente sazón y acompañados de un consomé que le dan el toque final, a mi familia les encantan." />
              <ReviewCard initials="JR" name="Jocelyn Rodríguez" quote="Tacos muy ricos, llegamos por una recomendación y sin duda no se equivocaron." />
            </div>
          </div>
        </section>

        <section className="section" id="ubicacion">
          <div className="location-layout">
            <div>
              <p className="section-kicker">Aquí nos encuentras</p>
              <h2>Un punto de<br />encuentro en Tonalá.</h2>
              <p className="section-lede">Date una vuelta por Loma Dorada. Estamos cerca de la Glorieta Arcos de Loma Dorada y Av. Río Nilo.</p>
              <div className="hours-list">
                <div className="hours-line"><Clock3 size={18} /><span><strong>Lunes a domingo</strong> · 8:00 a.m. a 1:00 p.m.</span></div>
                <div className="hours-line"><Phone size={18} /><a href="tel:+523332224040" data-testid="link-phone">33 3222 4040</a></div>
                <div className="hours-line"><ShoppingBag size={18} /><span>Precio aproximado: $1–$100 MXN por persona</span></div>
              </div>
              <a className="btn" href="https://www.google.com/maps/search/?api=1&query=P.%C3%B3+Lomas+del+Sur+7809+B%2C+Loma+Dorada%2C+Tonal%C3%A1%2C+Jalisco" target="_blank" rel="noreferrer" data-testid="link-maps-main">Abrir en Google Maps <ArrowRight size={15} /></a>
            </div>
            <div className="location-card">
              <div className="map-pin"><MapPin size={23} /></div>
              <h3>Tacos el Trebol</h3>
              <p>P.º Lomas del Sur 7809 B<br />Loma Dorada Delegación A<br />C.P. 45418, Tonalá, Jalisco</p>
              <p><strong>Plus Code:</strong> JPJM+2J Tonalá, Jalisco<br /><strong>Referencia:</strong> Glorieta Arcos de Loma Dorada y Av. Río Nilo</p>
            </div>
          </div>
        </section>

        <section className="section order-section" id="pedidos">
          <div className="section-inner">
            <div className="order-layout">
              <div className="order-aside">
                <p className="section-kicker">Tu birria, hasta tu puerta</p>
                <h2>Ya casi se te hace.</h2>
                <p className="section-lede">Cuéntanos dónde estás y deja listo tu pedido. Al final podrás abrir WhatsApp con todos los detalles para enviarlo directamente al restaurante.</p>
                <h3>Cómo funciona</h3>
                <p>Completa tus datos y revisa el total. El pedido no se envía automáticamente: se comparte con Tacos el Trebol cuando abres WhatsApp y tocas enviar.</p>
                <div className="delivery-fees">
                  <div className="fee-line"><span>Loma Dorada y alrededores</span><strong>+$20 MXN</strong></div>
                  <div className="fee-line"><span>Fuera de la zona, dentro de ZMG</span><strong>+$30 MXN</strong></div>
                </div>
                <p>Tiempo estimado una vez confirmado: <strong>30–45 min</strong>.</p>
              </div>
              <form className="order-form" onSubmit={submitOrder} noValidate data-testid="form-delivery-order">
                <div className="form-title"><div><h3>Arma tu pedido</h3><p>Los campos con * son obligatorios.</p></div><span className="cart-count">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span></div>
                <div className="form-grid">
                  <div className="field full"><label htmlFor="customer-name">Nombre completo *</label><input id="customer-name" value={order.name} onChange={(e) => updateOrder('name', e.target.value)} autoComplete="name" required placeholder="¿A nombre de quién?" data-testid="input-customer-name" /></div>
                  <div className="field full"><label htmlFor="customer-phone">Teléfono de contacto *</label><input id="customer-phone" type="tel" inputMode="numeric" maxLength={10} value={order.phone} onChange={(e) => updateOrder('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} autoComplete="tel" required placeholder="10 dígitos" data-testid="input-customer-phone" /><span className="helper">Escribe los 10 dígitos de tu teléfono.</span></div>
                  <div className="field full"><label htmlFor="delivery-address">Calle y número *</label><input id="delivery-address" value={order.address} onChange={(e) => updateOrder('address', e.target.value)} autoComplete="street-address" required placeholder="Calle, número exterior e interior" data-testid="input-delivery-address" /></div>
                  <div className="field full"><label htmlFor="delivery-neighborhood">Colonia y referencias *</label><input id="delivery-neighborhood" value={order.neighborhood} onChange={(e) => updateOrder('neighborhood', e.target.value)} required placeholder="Colonia, entre calles o referencias" data-testid="input-delivery-neighborhood" /></div>
                  <div className="field full"><span className="field-label">Zona de entrega *</span><div className="choice-row">
                    <label className="choice"><input type="radio" name="zone" checked={order.zone === 'local'} onChange={() => updateOrder('zone', 'local')} data-testid="radio-zone-local" /> Loma Dorada y alrededores · $20</label>
                    <label className="choice"><input type="radio" name="zone" checked={order.zone === 'zmg'} onChange={() => updateOrder('zone', 'zmg')} data-testid="radio-zone-zmg" /> Fuera de la zona, ZMG · $30</label>
                  </div></div>
                  <div className="field full"><span className="field-label">Forma de pago *</span><div className="choice-row">
                     {['Efectivo al recibir', 'Transferencia'].map((method) => <label className="choice" key={method}><input type="radio" name="payment" checked={order.payment === method} onChange={() => updateOrder('payment', method)} data-testid={`radio-payment-${method === 'Efectivo al recibir' ? 'cash' : 'transfer'}`} /> {method}</label>)}
                  </div></div>
                  {hasLonche && <div className="field full"><span className="field-label">Tipo de bolillo para tu lonche *</span><div className="choice-row">
                    {['Normal', 'Salado'].map((type) => <label className="choice" key={type}><input type="radio" name="bolillo" checked={order.bolillo === type} onChange={() => updateOrder('bolillo', type)} data-testid={`radio-bolillo-${type.toLowerCase()}`} /> {type}</label>)}
                  </div><span className="helper">Sujeto a disponibilidad.</span></div>}
                  <div className="field full"><label htmlFor="special-instructions">Instrucciones especiales <span className="helper">(opcional)</span></label><textarea id="special-instructions" value={order.instructions} onChange={(e) => updateOrder('instructions', e.target.value)} placeholder="¿Alguna indicación para encontrar tu domicilio?" data-testid="input-special-instructions" /></div>
                  <div className="field full"><label className="choice"><input type="checkbox" checked={order.contactless} onChange={(e) => updateOrder('contactless', e.target.checked)} data-testid="checkbox-contactless" /> Prefiero una entrega sin contacto</label></div>
                </div>
                <div className="order-summary" data-testid="order-summary">
                  <div className="summary-head"><span>Resumen de tu pedido</span><span>{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</span></div>
                  {cartEntries.length ? cartEntries.map((item) => <div className="summary-line" key={item.id}><span>{item.quantity} × {item.name}</span><span>{formatPrice(item.price * item.quantity)}</span></div>) : <div className="summary-line" data-testid="text-order-empty"><span>Aún no agregas productos</span><a href="#menu">Ver menú</a></div>}
                  <div className="summary-line"><span>Subtotal</span><span data-testid="text-order-subtotal">{formatPrice(subtotal)}</span></div>
                  <div className="summary-line"><span>Envío · {order.zone === 'local' ? 'Loma Dorada y alrededores' : 'ZMG'}</span><span data-testid="text-delivery-fee">{itemCount ? formatPrice(deliveryFee) : formatPrice(0)}</span></div>
                  <div className="summary-total"><span>Total</span><span data-testid="text-order-total">{formatPrice(total)}</span></div>
                </div>
                {error && <p className="form-error" role="alert" data-testid="status-order-error">{error}</p>}
                {folio ? <div className="confirmation" role="status" data-testid="status-order-confirmation">
                  <h4>Pedido listo, {order.name.split(' ')[0]}.</h4>
                  <p><strong>Folio {folio}</strong> · Estimado de entrega: 30–45 min.<br />Subtotal: {formatPrice(subtotal)} · Envío: {formatPrice(deliveryFee)} · Total: <strong>{formatPrice(total)}</strong></p>
                  <p>{cartEntries.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}</p>
                  <a className="btn" href={whatsappMessage} target="_blank" rel="noreferrer" data-testid="button-send-whatsapp">Abrir WhatsApp para enviar <ArrowRight size={15} /></a>
                  <p className="whatsapp-note">WhatsApp abrirá con tu mensaje. Toca “Enviar” para que el restaurante reciba tu solicitud.</p>
                </div> : <button className="btn submit-btn" type="submit" data-testid="button-prepare-order">Preparar mi pedido <ArrowRight size={15} /></button>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <a className="mobile-cart" href="#menu" aria-label={`Ver menú, ${itemCount} productos en el pedido`} data-testid="link-mobile-cart">
        <span><ShoppingBag size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />Mi pedido · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span><span>{formatPrice(subtotal)}</span>
      </a>
    </div>
  );
}

function MenuCard({ item, quantity, onAdd, onChange }: { item: MenuItem; quantity: number; onAdd: () => void; onChange: (delta: number) => void }) {
  return <article className="menu-card" data-testid={`card-menu-${item.id}`}>
    <div><h3>{item.name}</h3><p>{item.description}</p>{quantity > 0 ? <QuantityControl quantity={quantity} label={item.name} onChange={onChange} /> : <button className="add-btn" type="button" onClick={onAdd} data-testid={`button-add-${item.id}`}><Plus size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Agregar</button>}</div>
    <span className="menu-card-price" data-testid={`text-price-${item.id}`}>{formatPrice(item.price)}</span>
  </article>;
}

function QuantityControl({ quantity, label, onChange }: { quantity: number; label: string; onChange: (delta: number) => void }) {
  return <div className="qty-control" aria-label={`Cantidad de ${label}`}>
    <button type="button" aria-label={`Quitar uno de ${label}`} onClick={() => onChange(-1)} data-testid={`button-decrease-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><Minus size={12} /></button>
    <span data-testid={`text-quantity-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{quantity}</span>
    <button type="button" aria-label={`Agregar uno de ${label}`} onClick={() => onChange(1)} data-testid={`button-increase-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><Plus size={12} /></button>
  </div>;
}

function ReviewCard({ name, initials, quote, featured = false }: { name: string; initials: string; quote: string; featured?: boolean }) {
  return <article className={`review-card${featured ? ' featured' : ''}`} data-testid={`review-${initials.toLowerCase()}`}>
    <div className="stars" aria-label="5 de 5 estrellas">★★★★★</div>
    <p className="review-quote">“{quote}”</p>
    <div className="review-author"><span className="author-mark">{initials}</span><span>{name}<small>Local Guide · 5 estrellas</small></span></div>
  </article>;
}

function Footer() {
  const [imageFailed, setImageFailed] = useState(false);
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=P.%C3%B3+Lomas+del+Sur+7809+B%2C+Loma+Dorada+Delegaci%C3%B3n+A%2C+Tonal%C3%A1%2C+Jalisco';
  return <footer className="academic-footer">
    <div className="footer-inner">
      <div className="footer-top">
        <div className="footer-brand"><a className="brand" href="#inicio"><CloverIcon size="footer" /><span><span className="brand-name">Tacos el Trebol</span><span className="brand-sub">Tradición de familia</span></span></a><p>Birria de res, lonches, consomé y aguas frescas. Una mesa familiar en Tonalá, Jalisco, desde hace más de 20 años.</p></div>
        <div className="footer-col"><h3>Visítanos</h3><p>P.º Lomas del Sur 7809 B<br />Loma Dorada Delegación A<br />C.P. 45418, Tonalá, Jalisco</p><a className="footer-map" href={mapUrl} target="_blank" rel="noreferrer" data-testid="link-maps-footer"><MapPin size={14} /> Ver ubicación en Google Maps</a></div>
        <div className="footer-col"><h3>Horario y contacto</h3><p>Lunes a domingo<br />8:00 a.m. — 1:00 p.m.</p><p><a href="tel:+523332224040" data-testid="link-footer-phone">33 3222 4040</a><br />Comer aquí · Recoger en auto · A domicilio</p></div>
      </div>
      <div className="credit-block">
        <div className="credit-text">
          <p><strong>Alumno:</strong> Juan Pablo Valladolid Ramirez</p>
          <p><strong>Materia:</strong> Desarrollo de Aplicaciones Web en la Nube y Móviles</p>
          <p><strong>Profesor:</strong> Mtro. Zeus Cobián</p>
          <p><strong>Calendario:</strong> 2026B</p>
          <p><strong>Institución:</strong> CUCEI - Universidad de Guadalajara</p>
        </div>
        <div className="cucei-logo">
          {!imageFailed && <img src="/escudo-cucei.png" alt="Logo de CUCEI" height="60" onError={() => setImageFailed(true)} data-testid="img-cucei-logo" />}
          <span className="cucei-fallback" style={{ display: imageFailed ? 'block' : 'none' }}>CUCEI<br />UdeG</span>
        </div>
      </div>
      <div className="footer-bottom"><span>© Tacos el Trebol · Tonalá, Jalisco</span><a href="#inicio" data-testid="link-back-top">Volver al inicio ↑</a></div>
    </div>
  </footer>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
