"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { products as initialProducts } from "@/data/products";
import {
  academicCards,
  chatbotAnswers,
  demandPredictions,
  formatBs,
  formatUsdApprox,
  getAllOrders,
  getCartSubtotal,
  getChatbotAnswer,
  getProductById,
  getRecommendations,
  getShipping,
  industryCards,
  makeOrderId,
  normalizeText,
  orderStatuses,
  searchProducts,
  uxCards,
} from "@/lib/ecomarket";
import type {
  CartLine,
  CustomerData,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
} from "@/types";

const cartStorageKey = "ecomarket-cart";
const ordersStorageKey = "ecomarket-orders";
const stockStorageKey = "ecomarket-stock";

const emptyCustomer: CustomerData = {
  name: "",
  phone: "",
  address: "",
  zone: "",
  reference: "",
};

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export default function EcoMarketApp() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [customer, setCustomer] = useState<CustomerData>(emptyCustomer);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("QR");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [trackingCode, setTrackingCode] = useState("ECO-DEMO-2026");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [reminderSent, setReminderSent] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hola, soy EcoBot. Puedo ayudarte con entregas, pagos, productos orgánicos y pedidos por WhatsApp.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const savedCart = window.localStorage.getItem(cartStorageKey);
    const savedOrders = window.localStorage.getItem(ordersStorageKey);
    const savedStock = window.localStorage.getItem(stockStorageKey);
    const savedNewsletterCount = window.localStorage.getItem("ecomarket-newsletter-count");

    if (savedCart) {
      setCart(JSON.parse(savedCart) as CartLine[]);
    }

    if (savedOrders) {
      setOrders(JSON.parse(savedOrders) as Order[]);
    }

    if (savedStock) {
      const stockById = JSON.parse(savedStock) as Record<string, number>;
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          stock: stockById[product.id] ?? product.stock,
        })),
      );
    }

    if (savedNewsletterCount) {
      setNewsletterCount(Number(savedNewsletterCount));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!cart.length) {
      setReminderSent(false);
    }
  }, [cart.length]);

  useEffect(() => {
    window.localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    const stockById = Object.fromEntries(
      products.map((product) => [product.id, product.stock]),
    );
    window.localStorage.setItem(stockStorageKey, JSON.stringify(stockById));
  }, [products]);

  useEffect(() => {
    setCart((current) => {
      const next = current
        .map((line) => {
          const product = products.find((item) => item.id === line.productId);

          if (!product || product.stock <= 0) {
            return null;
          }

          return {
            ...line,
            quantity: Math.min(line.quantity, product.stock),
          };
        })
        .filter((line): line is CartLine => Boolean(line));

      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem("ecomarket-newsletter-count", String(newsletterCount));
  }, [newsletterCount]);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const searchedProducts = useMemo(
    () => searchProducts(query, products),
    [products, query],
  );

  const visibleProducts = useMemo(
    () =>
      activeCategory === "Todos"
        ? searchedProducts
        : searchedProducts.filter((product) => product.category === activeCategory),
    [activeCategory, searchedProducts],
  );

  const subtotal = useMemo(() => getCartSubtotal(cart, products), [cart, products]);
  const shipping = getShipping(subtotal);
  const total = subtotal + shipping;
  const cartCount = cart.reduce((count, line) => count + line.quantity, 0);
  const allOrders = useMemo(() => getAllOrders(orders), [orders]);
  const trackedOrder = allOrders.find(
    (order) => normalizeText(order.id) === normalizeText(trackingCode),
  );
  const selectedProductView = selectedProduct
    ? products.find((product) => product.id === selectedProduct.id) ?? selectedProduct
    : null;
  const lowStockProducts = products.filter((product) => product.stock <= 12);
  const mostSold = useMemo(() => {
    const salesByProduct = new Map<string, number>();

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        salesByProduct.set(
          item.productId,
          (salesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      });
    });

    return [...salesByProduct.entries()]
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .map(([productId]) => getProductById(productId, products)?.name)
      .filter((name): name is string => Boolean(name));
  }, [allOrders, products]);

  function addToCart(productId: string) {
    const product = getProductById(productId, products);

    if (!product || product.stock <= 0) {
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);

      if (existing) {
        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) }
            : line,
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
    setIsCartOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    const product = getProductById(productId, products);

    if (!product) {
      return;
    }

    if (quantity <= 0) {
      setCart((current) => current.filter((line) => line.productId !== productId));
      return;
    }

    setCart((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(quantity, product.stock) }
          : line,
      ),
    );
  }

  function confirmOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");

    if (!cart.length) {
      return;
    }

    const invalidLine = cart.find((line) => {
      const product = getProductById(line.productId, products);
      return !product || product.stock < line.quantity;
    });

    if (invalidLine) {
      const product = getProductById(invalidLine.productId, products);
      setCheckoutError(
        product
          ? `Stock insuficiente para ${product.name}. Ajusta la cantidad antes de confirmar.`
          : "Uno de los productos del carrito ya no está disponible.",
      );
      return;
    }

    const newOrder: Order = {
      id: makeOrderId(),
      customer,
      paymentMethod,
      items: cart.map((line) => ({ ...line })),
      subtotal,
      shipping,
      total,
      status: "Pedido recibido",
      createdAt: new Date().toISOString(),
      estimatedTime: "Entrega menor a 8 horas",
    };

    setOrders((current) => [newOrder, ...current]);
    setProducts((current) =>
      current.map((product) => {
        const item = cart.find((line) => line.productId === product.id);
        return item
          ? { ...product, stock: Math.max(product.stock - item.quantity, 0) }
          : product;
      }),
    );
    setConfirmedOrder(newOrder);
    setTrackingCode(newOrder.id);
    setCart([]);
    setCustomer(emptyCustomer);
    setPaymentMethod("QR");
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  }

  function updateOrderStatus(orderId: string, status: Order["status"]) {
    const existingOrder = allOrders.find((order) => order.id === orderId);

    if (!existingOrder) {
      return;
    }

    setOrders((current) => {
      const existsInSavedOrders = current.some((order) => order.id === orderId);

      if (existsInSavedOrders) {
        return current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        );
      }

      return [{ ...existingOrder, status }, ...current];
    });
  }

  function advanceTrackedOrder() {
    if (!trackedOrder) {
      return;
    }

    const currentIndex = orderStatuses.findIndex(
      (status) => status === trackedOrder.status,
    );
    const nextStatus = orderStatuses[Math.min(currentIndex + 1, orderStatuses.length - 1)];
    updateOrderStatus(trackedOrder.id, nextStatus);
  }

  function sendChat(question: string) {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion) {
      return;
    }

    const answer = getChatbotAnswer(cleanedQuestion);

    setChatMessages((current) => [
      ...current,
      { role: "user", text: cleanedQuestion },
      {
        role: "bot",
        text:
          answer ??
          "Puedo ayudarte con entregas, métodos de pago, productos orgánicos y atención por WhatsApp.",
      },
    ]);
    setChatInput("");
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-leaf-900">
      <Navbar cartCount={cartCount} onCartOpen={() => setIsCartOpen(true)} />

      <section id="inicio" className="hero-image min-h-[78vh] px-4 pt-28 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-20 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex border border-white/30 bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.18em] backdrop-blur">
              EcoMarket Bolivia SRL
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Productos orgánicos bolivianos directo a tu hogar
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88 md:text-xl">
              Compra miel, café, quinua, chocolate artesanal, frutos secos e
              infusiones naturales con entrega rápida y recomendaciones
              inteligentes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#productos"
                className="inline-flex justify-center bg-leaf-600 px-6 py-3 text-base font-bold text-white shadow-soft transition hover:bg-leaf-700"
              >
                Comprar ahora
              </a>
              <a
                href="#industria"
                className="inline-flex justify-center border border-white/45 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="grid max-w-md grid-cols-2 gap-3 text-sm font-semibold">
            {[
              "Producto orgánico certificado",
              "Entrega menor a 8 horas",
              "Pago seguro",
              "Apoyo a productores nacionales",
            ].map((item) => (
              <div key={item} className="border border-white/25 bg-white/12 p-4 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-earth-300/60 bg-white px-4 py-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <SmartSearch query={query} setQuery={setQuery} resultCount={visibleProducts.length} />
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value="12+" label="Productos" />
            <Metric value="< 8h" label="Entrega" />
            <Metric value="IA" label="Recomendación" />
          </div>
        </div>
      </section>

      <section id="productos" className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Tienda online"
            title="Catálogo de productos orgánicos y ecológicos"
            text="La tienda muestra stock, origen, precio, trazabilidad y compra directa para familias de Cochabamba."
          />
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={() => setSelectedProduct(product)}
                onAdd={() => addToCart(product.id)}
              />
            ))}
          </div>
          {!visibleProducts.length && (
            <div className="mt-8 border border-earth-300 bg-white p-6 text-center shadow-soft">
              <h3 className="text-xl font-black">No encontramos productos con ese filtro</h3>
              <p className="mt-2 text-leaf-700">
                Prueba con miel, cafe, saludable, limpieza, desayuno o cambia de categoria.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="ia" className="bg-leaf-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="IA EcoMarket"
            title="IA aplicada al comercio electrónico"
            text="El prototipo simula recomendación personalizada, predicción de demanda, recuperación de carrito y atención automatizada."
            dark
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="bg-white p-5 text-leaf-900 shadow-soft">
              <h3 className="text-xl font-black">Recomendaciones inteligentes</h3>
              <p className="mt-2 text-sm text-leaf-700">
                Selecciona una intención de compra y la IA sugiere productos
                complementarios.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["cafe-premium", "miel-organica", "quinua-real"].map((id) => {
                  const product = getProductById(id, products);
                  return (
                    <button
                      key={id}
                      onClick={() => product && setSelectedProduct(product)}
                      className="border border-leaf-100 bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-900 transition hover:border-leaf-600"
                    >
                      Ver {product?.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Si ve café", "recomendar chocolate o panela"],
                  ["Si ve miel", "recomendar té o infusiones"],
                  ["Si ve quinua", "recomendar granola o frutos secos"],
                ].map(([rule, result]) => (
                  <div key={rule} className="border-l-4 border-tech-500 bg-leaf-50 p-3">
                    <strong>{rule}</strong>
                    <span className="block text-sm text-leaf-700">{result}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 text-leaf-900 shadow-soft">
              <h3 className="text-xl font-black">Predicción de demanda</h3>
              <div className="mt-5 space-y-4">
                {demandPredictions.map((item) => (
                  <div key={item.product}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-bold">{item.product}</span>
                      <span className="text-leaf-700">{item.insight}</span>
                    </div>
                    <div className="mt-2 h-3 bg-earth-100">
                      <div
                        className="h-3 bg-tech-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white p-5 text-leaf-900 shadow-soft">
                <h3 className="text-xl font-black">Carrito abandonado</h3>
                {cart.length ? (
                  <div className="mt-3">
                    <p className="text-sm text-leaf-700">
                      IA detectó carrito abandonado. Enviar recordatorio por
                      WhatsApp o correo.
                    </p>
                    <button
                      onClick={() => setReminderSent(true)}
                      className="mt-4 bg-earth-500 px-4 py-2 font-bold text-white transition hover:bg-earth-700"
                    >
                      Enviar recordatorio
                    </button>
                    {reminderSent && (
                      <p className="mt-3 text-sm font-bold text-tech-700">
                        Recordatorio simulado enviado correctamente.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-leaf-700">
                    Agrega productos al carrito para activar esta automatización.
                  </p>
                )}
              </div>

              <Chatbot
                messages={chatMessages}
                input={chatInput}
                setInput={setChatInput}
                onSend={sendChat}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="seguimiento" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Seguimiento"
            title="Sistema logístico integrado con entrega de última milla"
            text="Ingresa un número de pedido real del checkout o usa ECO-DEMO-2026 para mostrar el flujo."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="border border-earth-300 bg-earth-100 p-5">
              <label className="text-sm font-black uppercase tracking-[0.12em] text-leaf-700">
                Número de pedido
              </label>
              <input
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
                className="mt-3 w-full border border-earth-300 bg-white px-4 py-3 text-leaf-900 outline-none focus:focus-ring"
                placeholder="ECO-2026-1234"
              />
              {trackedOrder ? (
                <div className="mt-5 space-y-2 text-sm">
                  <p>
                    <strong>Estado actual:</strong> {trackedOrder.status}
                  </p>
                  <p>
                    <strong>Tiempo estimado:</strong> {trackedOrder.estimatedTime}
                  </p>
                  <p>
                    <strong>Total:</strong> {formatBs(trackedOrder.total)}
                  </p>
                  <button
                    onClick={advanceTrackedOrder}
                    disabled={trackedOrder.status === "Entregado"}
                    className="mt-3 w-full bg-leaf-600 px-4 py-3 font-black text-white transition hover:bg-leaf-700 disabled:bg-stone-400"
                  >
                    Avanzar estado logístico
                  </button>
                </div>
              ) : (
                <p className="mt-5 text-sm text-earth-700">
                  No se encontró el pedido. Puedes confirmar una compra o usar
                  el código de demostración.
                </p>
              )}
            </div>
            <Timeline status={trackedOrder?.status ?? "Pedido recibido"} />
          </div>
        </div>
      </section>

      <section id="ux" className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Experiencia de usuario"
            title="Diseño UX pensado para el consumidor digital"
            text="La interfaz reduce dudas, acelera la compra y mantiene visibles los elementos de confianza."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uxCards.map((card) => (
              <div key={card.user} className="border border-earth-300 bg-white p-5 shadow-soft">
                <h3 className="text-lg font-black">{card.user}</h3>
                <p className="mt-2 text-leaf-700">{card.response}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="industria" className="bg-[#efe5d7] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Industria 4.0"
            title="Industria 4.0 en EcoMarket"
            text="El flujo digital conecta productores, plataforma, inventario, pagos, logística, cliente final y postventa."
          />
          <div className="mt-8 overflow-x-auto">
            <div className="flex min-w-[860px] items-center gap-3">
              {[
                "Productores nacionales",
                "Plataforma web",
                "Inventario en tiempo real",
                "Pago digital",
                "Logística",
                "Cliente final",
                "Postventa",
              ].map((step, index, array) => (
                <div key={step} className="flex flex-1 items-center gap-3">
                  <div className="min-h-20 flex-1 border border-earth-300 bg-white p-4 text-center text-sm font-black shadow-soft">
                    {step}
                  </div>
                  {index < array.length - 1 && (
                    <span className="text-xl font-black text-earth-700">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industryCards.map((card) => (
              <div key={card} className="border border-earth-300 bg-white p-4 font-bold shadow-soft">
                {card}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admin" className="bg-leaf-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Panel administrativo"
            title="Control comercial, inventario y pedidos"
            text="Vista simulada para explicar cómo EcoMarket gestiona ventas, stock, pedidos y analítica."
          />
          <AdminPanel
            products={products}
            orders={allOrders}
            lowStockProducts={lowStockProducts}
            mostSold={mostSold}
            cartCount={cartCount}
            onOrderStatusChange={updateOrderStatus}
            onStockChange={(productId, stock) =>
              setProducts((current) =>
                current.map((product) =>
                  product.id === productId
                    ? { ...product, stock: Math.max(0, Number.isFinite(stock) ? stock : 0) }
                    : product,
                ),
              )
            }
          />
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Boletín"
              title="Ofertas saludables cada 15 días"
              text="Captura de clientes recurrentes para campañas personalizadas y postventa."
            />
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setNewsletterDone(true);
                setNewsletterCount((count) => count + 1);
                setNewsletterEmail("");
              }}
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                className="min-w-0 flex-1 border border-earth-300 px-4 py-3 outline-none focus:focus-ring"
              />
              <button className="bg-leaf-600 px-5 py-3 font-bold text-white transition hover:bg-leaf-700">
                Suscribirme
              </button>
            </form>
            {newsletterDone && (
              <p className="mt-3 font-bold text-tech-700">
                Te enviaremos ofertas saludables cada 15 días.
              </p>
            )}
            <p className="mt-2 text-sm text-leaf-700">
              Suscripciones simuladas registradas: {newsletterCount}
            </p>
          </div>
          <div>
            <SectionHeader
              eyebrow="Datos académicos"
              title="¿Por qué esta plataforma cumple con el proyecto?"
              text="La solución muestra la lógica del negocio, no solo una página estética."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {academicCards.map((card) => (
                <div key={card.title} className="border border-earth-300 bg-earth-100 p-4">
                  <h3 className="font-black">{card.title}</h3>
                  <p className="mt-2 text-sm text-leaf-700">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <a
        href="https://wa.me/59170000000?text=Hola%2C%20quiero%20hacer%20un%20pedido%20en%20EcoMarket%20Bolivia."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 bg-tech-500 px-5 py-3 font-black text-white shadow-soft transition hover:bg-tech-700"
      >
        WhatsApp
      </a>

      {selectedProductView && (
        <ProductModal
          product={selectedProductView}
          products={products}
          onClose={() => setSelectedProduct(null)}
          onAdd={() => addToCart(selectedProductView.id)}
          onOpenRecommendation={setSelectedProduct}
        />
      )}

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          products={products}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          onClose={() => setIsCartOpen(false)}
          onQuantityChange={changeQuantity}
          onCheckout={() => {
            setCheckoutError("");
            setIsCheckoutOpen(true);
            setIsCartOpen(false);
          }}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          products={products}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          checkoutError={checkoutError}
          customer={customer}
          paymentMethod={paymentMethod}
          setCustomer={setCustomer}
          setPaymentMethod={setPaymentMethod}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={confirmOrder}
        />
      )}

      {confirmedOrder && (
        <OrderSuccessModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onTrack={() => {
            setConfirmedOrder(null);
            document.getElementById("seguimiento")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </main>
  );
}

function Navbar({
  cartCount,
  onCartOpen,
}: {
  cartCount: number;
  onCartOpen: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const links = [
    ["#inicio", "Inicio"],
    ["#productos", "Productos"],
    ["#ia", "IA EcoMarket"],
    ["#seguimiento", "Seguimiento"],
    ["#admin", "Panel Admin"],
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/20 bg-leaf-900/92 px-4 text-white backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-4">
        <a href="#inicio" className="text-lg font-black md:text-xl">
          EcoMarket Bolivia
        </a>
        <div className="hidden items-center gap-5 text-sm font-bold lg:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="hover:text-earth-300">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen((value) => !value)}
            className="border border-white/30 px-3 py-2 text-sm font-bold transition hover:bg-white/10 lg:hidden"
          >
            Menú
          </button>
          <a
            href="https://wa.me/59170000000?text=Hola%2C%20quiero%20hacer%20un%20pedido%20en%20EcoMarket%20Bolivia."
            target="_blank"
            rel="noreferrer"
            className="hidden border border-white/30 px-3 py-2 text-sm font-bold transition hover:bg-white/10 sm:inline-flex"
          >
            Atención inmediata
          </a>
          <button
            onClick={onCartOpen}
            className="bg-white px-3 py-2 text-sm font-black text-leaf-900 transition hover:bg-earth-100"
          >
            Carrito ({cartCount})
          </button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="mx-auto grid max-w-7xl gap-2 pb-4 text-sm font-bold lg:hidden">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setIsMenuOpen(false)}
              className="border border-white/15 bg-white/10 px-3 py-2"
            >
              {label}
            </a>
          ))}
          <a
            href="https://wa.me/59170000000?text=Hola%2C%20quiero%20hacer%20un%20pedido%20en%20EcoMarket%20Bolivia."
            target="_blank"
            rel="noreferrer"
            className="border border-white/15 bg-white/10 px-3 py-2"
          >
            Atención inmediata
          </a>
        </div>
      )}
    </header>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-sm font-black uppercase tracking-[0.16em] ${
          dark ? "text-earth-300" : "text-earth-700"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">{title}</h2>
      <p className={`mt-3 leading-7 ${dark ? "text-white/75" : "text-leaf-700"}`}>
        {text}
      </p>
    </div>
  );
}

function SmartSearch({
  query,
  setQuery,
  resultCount,
}: {
  query: string;
  setQuery: (value: string) => void;
  resultCount: number;
}) {
  return (
    <div>
      <label className="text-sm font-black uppercase tracking-[0.14em] text-tech-700">
        Buscador inteligente activado por IA
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 border border-earth-300 px-4 py-3 text-leaf-900 outline-none focus:focus-ring"
          placeholder="Busca miel, cafe, saludable, quinua o eco..."
        />
        <a
          href="#productos"
          className="bg-leaf-600 px-5 py-3 text-center font-bold text-white transition hover:bg-leaf-700"
        >
          Buscar
        </a>
      </div>
      <p className="mt-2 text-sm text-leaf-700">
        {resultCount} resultado(s) encontrados con coincidencia semántica.
      </p>
    </div>
  );
}

function CategoryFilter({
  categories,
  activeCategory,
  onChange,
}: {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`whitespace-nowrap border px-4 py-2 text-sm font-bold transition ${
            activeCategory === category
              ? "border-leaf-600 bg-leaf-600 text-white"
              : "border-earth-300 bg-white text-leaf-900 hover:border-leaf-600"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-earth-300 bg-earth-100 p-3">
      <p className="text-2xl font-black text-leaf-900">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-leaf-700">
        {label}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="overflow-hidden border border-earth-300 bg-white shadow-soft">
      <div className="relative h-48">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-leaf-900">
          {product.badge}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-earth-700">
          {product.category}
        </p>
        <h3 className="mt-2 min-h-14 text-xl font-black leading-tight">{product.name}</h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-leaf-700">{formatBs(product.priceBs)}</p>
            <p className="text-sm text-leaf-700">{formatUsdApprox(product.priceBs)} aprox.</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Stock {product.stock}</p>
            <p className="text-leaf-700">{product.origin}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onOpen}
            className="border border-leaf-600 px-3 py-2 text-sm font-bold text-leaf-700 transition hover:bg-leaf-50"
          >
            Ver detalle
          </button>
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="bg-leaf-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-leaf-700 disabled:bg-stone-400"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductModal({
  product,
  products,
  onClose,
  onAdd,
  onOpenRecommendation,
}: {
  product: Product;
  products: Product[];
  onClose: () => void;
  onAdd: () => void;
  onOpenRecommendation: (product: Product) => void;
}) {
  const recommendations = getRecommendations(product.id, products);
  const qrCells = makeQrCells(product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-leaf-900/70 px-4 py-8">
      <div className="mx-auto max-w-5xl bg-white shadow-soft">
        <div className="grid gap-6 p-5 md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-80 w-full object-cover"
            />
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-4 border border-earth-300 bg-earth-100 p-4">
              <div className="grid h-24 w-24 grid-cols-9 border border-leaf-900 bg-white p-1">
                {qrCells.map((cell, index) => (
                  <span
                    key={index}
                    className={cell ? "bg-leaf-900" : "bg-white"}
                  />
                ))}
              </div>
              <div>
                <h4 className="font-black">Código QR simulado de trazabilidad</h4>
                <p className="mt-2 text-sm text-leaf-700">
                  Escanea el QR para conocer el origen del producto.
                </p>
                <p className="mt-2 text-sm font-bold text-tech-700">
                  Productor: {product.producer}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-earth-700">
                  {product.badge}
                </p>
                <h3 className="mt-2 text-3xl font-black">{product.name}</h3>
              </div>
              <button
                onClick={onClose}
                className="border border-earth-300 px-3 py-2 font-black text-leaf-900 hover:bg-earth-100"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-4 leading-7 text-leaf-700">{product.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoTile label="Precio" value={formatBs(product.priceBs)} />
              <InfoTile label="Stock" value={`${product.stock} unidades`} />
              <InfoTile label="Entrega" value={product.delivery} />
            </div>
            <div className="mt-5">
              <h4 className="font-black">Beneficios</h4>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.benefits.map((benefit) => (
                  <li key={benefit} className="border border-earth-300 bg-earth-100 p-3 text-sm font-bold">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5 border-l-4 border-tech-500 bg-leaf-50 p-4">
              <p className="font-black">Origen del productor</p>
              <p className="text-leaf-700">{product.producer}, {product.origin}</p>
            </div>
            <button
              onClick={onAdd}
              disabled={product.stock <= 0}
              className="mt-6 w-full bg-leaf-600 px-5 py-3 font-black text-white transition hover:bg-leaf-700 disabled:bg-stone-400"
            >
              {product.stock > 0 ? "Agregar al carrito" : "Sin stock disponible"}
            </button>
            <div className="mt-6">
              <h4 className="font-black">Productos recomendados por IA</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onOpenRecommendation(item)}
                    className="border border-earth-300 p-3 text-left transition hover:border-leaf-600 hover:bg-leaf-50"
                  >
                    <span className="block text-sm font-black">{item.name}</span>
                    <span className="text-sm text-leaf-700">{formatBs(item.priceBs)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-earth-300 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-earth-700">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function CartDrawer({
  cart,
  products,
  subtotal,
  shipping,
  total,
  onClose,
  onQuantityChange,
  onCheckout,
}: {
  cart: CartLine[];
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  onClose: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-leaf-900/60">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-earth-300 p-5">
          <h2 className="text-2xl font-black">Carrito</h2>
          <button onClick={onClose} className="border border-earth-300 px-3 py-2 font-black">
            Cerrar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length ? (
            <div className="space-y-4">
              {cart.map((line) => {
                const product = getProductById(line.productId, products);

                if (!product) {
                  return null;
                }

                return (
                  <div key={line.productId} className="grid grid-cols-[72px_1fr] gap-3 border border-earth-300 p-3">
                    <img src={product.imageUrl} alt={product.name} className="h-20 w-full object-cover" />
                    <div>
                      <h3 className="font-black">{product.name}</h3>
                      <p className="text-sm text-leaf-700">{formatBs(product.priceBs)}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => onQuantityChange(product.id, line.quantity - 1)}
                          className="h-8 w-8 border border-earth-300 font-black"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black">{line.quantity}</span>
                        <button
                          onClick={() => onQuantityChange(product.id, line.quantity + 1)}
                          disabled={line.quantity >= product.stock}
                          className="h-8 w-8 border border-earth-300 font-black disabled:bg-stone-200 disabled:text-stone-500"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onQuantityChange(product.id, 0)}
                          className="ml-auto text-sm font-bold text-earth-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-leaf-700">Tu carrito está vacío.</p>
          )}
        </div>
        <div className="border-t border-earth-300 p-5">
          <SummaryLine label="Subtotal" value={formatBs(subtotal)} />
          <SummaryLine
            label={shipping ? "Envío estimado" : "Envío incluido"}
            value={formatBs(shipping)}
          />
          <SummaryLine label="Total" value={formatBs(total)} strong />
          <button
            onClick={onCheckout}
            disabled={!cart.length}
            className="mt-5 w-full bg-leaf-600 px-5 py-3 font-black text-white transition hover:bg-leaf-700 disabled:bg-stone-400"
          >
            Finalizar compra
          </button>
        </div>
      </aside>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between py-2 ${strong ? "text-xl font-black" : "font-bold"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CheckoutModal({
  cart,
  products,
  subtotal,
  shipping,
  total,
  checkoutError,
  customer,
  paymentMethod,
  setCustomer,
  setPaymentMethod,
  onClose,
  onConfirm,
}: {
  cart: CartLine[];
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  checkoutError: string;
  customer: CustomerData;
  paymentMethod: PaymentMethod;
  setCustomer: (customer: CustomerData) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  onClose: () => void;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const methods: PaymentMethod[] = [
    "QR",
    "Transferencia",
    "Tarjeta simulada",
    "Pago contra entrega",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-leaf-900/70 px-4 py-8">
      <form onSubmit={onConfirm} className="mx-auto max-w-4xl bg-white p-5 shadow-soft md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-earth-700">
              Checkout simulado
            </p>
            <h2 className="mt-2 text-3xl font-black">Finalizar compra</h2>
          </div>
          <button type="button" onClick={onClose} className="border border-earth-300 px-3 py-2 font-black">
            Cerrar
          </button>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {[
              ["name", "Nombre"],
              ["phone", "Teléfono"],
              ["address", "Dirección"],
              ["zone", "Zona"],
              ["reference", "Referencia"],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm font-bold">
                {label}
                <input
                  required
                  value={customer[key as keyof CustomerData]}
                  onChange={(event) =>
                    setCustomer({ ...customer, [key]: event.target.value })
                  }
                  className="border border-earth-300 px-4 py-3 text-base font-normal outline-none focus:focus-ring"
                />
              </label>
            ))}
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-leaf-700">
                Método de pago
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {methods.map((method) => (
                  <label
                    key={method}
                    className={`border p-3 text-sm font-bold ${
                      paymentMethod === method
                        ? "border-leaf-600 bg-leaf-50"
                        : "border-earth-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="mr-2"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-earth-300 bg-earth-100 p-5">
            <h3 className="text-xl font-black">Resumen del pedido</h3>
            <div className="mt-4 space-y-3">
              {cart.map((line) => {
                const product = getProductById(line.productId, products);

                if (!product) {
                  return null;
                }

                return (
                  <div key={line.productId} className="flex justify-between gap-3 text-sm">
                    <span>{line.quantity} x {product.name}</span>
                    <strong>{formatBs(product.priceBs * line.quantity)}</strong>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 border-t border-earth-300 pt-3">
              <SummaryLine label="Subtotal" value={formatBs(subtotal)} />
              <SummaryLine label="Envío" value={formatBs(shipping)} />
              <SummaryLine label="Total" value={formatBs(total)} strong />
            </div>
            {checkoutError && (
              <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {checkoutError}
              </p>
            )}
            <button className="mt-5 w-full bg-leaf-600 px-5 py-3 font-black text-white transition hover:bg-leaf-700">
              Confirmar pedido
            </button>
            <p className="mt-3 text-xs text-leaf-700">
              No se procesan pagos reales. La pasarela es una simulación académica.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

function OrderSuccessModal({
  order,
  onClose,
  onTrack,
}: {
  order: Order;
  onClose: () => void;
  onTrack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-leaf-900/70 px-4">
      <div className="max-w-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-tech-700">
          Pedido confirmado
        </p>
        <h2 className="mt-2 text-3xl font-black">Compra simulada registrada</h2>
        <div className="mt-5 space-y-2 text-leaf-700">
          <p><strong>Número de pedido:</strong> {order.id}</p>
          <p><strong>Estado inicial:</strong> {order.status}</p>
          <p><strong>Tiempo estimado:</strong> {order.estimatedTime}</p>
        </div>
        <p className="mt-4 text-sm text-leaf-700">
          El pedido quedó guardado en localStorage para usarlo en seguimiento y panel administrativo.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onTrack} className="bg-leaf-600 px-5 py-3 font-black text-white">
            Ver seguimiento
          </button>
          <button onClick={onClose} className="border border-earth-300 px-5 py-3 font-black">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Timeline({ status }: { status: string }) {
  const activeIndex = Math.max(orderStatuses.findIndex((item) => item === status), 0);

  return (
    <div className="border border-earth-300 bg-white p-5 shadow-soft">
      <div className="grid gap-4">
        {orderStatuses.map((item, index) => {
          const isActive = index <= activeIndex;
          return (
            <div key={item} className="grid grid-cols-[32px_1fr] gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center border font-black ${
                  isActive
                    ? "border-leaf-600 bg-leaf-600 text-white"
                    : "border-earth-300 bg-earth-100 text-earth-700"
                }`}
              >
                {index + 1}
              </div>
              <div className="border-b border-earth-300 pb-4">
                <h3 className="font-black">{item}</h3>
                <p className="text-sm text-leaf-700">
                  {isActive ? "Etapa registrada en el sistema." : "Etapa pendiente."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chatbot({
  messages,
  input,
  setInput,
  onSend,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: (value: string) => void;
}) {
  return (
    <div className="bg-white p-5 text-leaf-900 shadow-soft">
      <h3 className="text-xl font-black">EcoBot</h3>
      <div className="mt-4 h-52 space-y-3 overflow-y-auto border border-earth-300 bg-earth-100 p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] p-3 text-sm ${
              message.role === "bot"
                ? "bg-white text-leaf-900"
                : "ml-auto bg-tech-500 text-white"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chatbotAnswers.map((item) => (
          <button
            key={item.question}
            onClick={() => onSend(item.question)}
            className="border border-earth-300 px-3 py-2 text-xs font-bold transition hover:border-tech-500"
          >
            {item.question}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSend(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 border border-earth-300 px-3 py-2 outline-none focus:focus-ring"
          placeholder="Pregunta a EcoBot..."
        />
        <button className="bg-tech-500 px-4 py-2 font-black text-white">
          Enviar
        </button>
      </form>
    </div>
  );
}

function AdminPanel({
  products,
  orders,
  lowStockProducts,
  mostSold,
  cartCount,
  onOrderStatusChange,
  onStockChange,
}: {
  products: Product[];
  orders: Order[];
  lowStockProducts: Product[];
  mostSold: string[];
  cartCount: number;
  onOrderStatusChange: (orderId: string, status: OrderStatus) => void;
  onStockChange: (productId: string, stock: number) => void;
}) {
  const sales = orders.reduce((total, order) => total + order.total, 0);
  const statusCounts = orderStatuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AdminMetric label="Total ventas" value={formatBs(sales)} />
        <AdminMetric label="Pedidos del día" value={String(orders.length)} />
        <AdminMetric label="Stock bajo" value={String(lowStockProducts.length)} />
        <AdminMetric label="Más vendidos" value={String(mostSold.length)} />
        <AdminMetric label="Clientes registrados" value={String(Math.max(orders.length, 8))} />
        <AdminMetric label="Carritos abandonados" value={cartCount ? "1" : "0"} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statusCounts.map((item) => (
          <div key={item.status} className="border border-earth-300 bg-white p-4 shadow-soft">
            <p className="text-sm font-black">{item.status}</p>
            <p className="mt-2 text-2xl font-black text-tech-700">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-earth-300 bg-white p-5 shadow-soft">
          <h3 className="text-xl font-black">Inventario editable</h3>
          <div className="mt-4 max-h-96 overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-earth-300 text-xs uppercase tracking-[0.12em] text-leaf-700">
                  <th className="py-2">Producto</th>
                  <th className="py-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-earth-100">
                    <td className="py-3 font-bold">{product.name}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(event) =>
                          onStockChange(product.id, Number(event.target.value))
                        }
                        className="w-24 border border-earth-300 px-3 py-2 outline-none focus:focus-ring"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-earth-300 bg-white p-5 shadow-soft">
          <h3 className="text-xl font-black">Tabla de pedidos simulados</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-earth-300 text-xs uppercase tracking-[0.12em] text-leaf-700">
                  <th className="py-2">Pedido</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Pago</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-earth-100">
                    <td className="py-3 font-black">{order.id}</td>
                    <td className="py-3">{order.customer.name}</td>
                    <td className="py-3">{order.paymentMethod}</td>
                    <td className="py-3">
                      <select
                        value={order.status}
                        onChange={(event) =>
                          onOrderStatusChange(order.id, event.target.value as OrderStatus)
                        }
                        className="w-full border border-earth-300 bg-white px-2 py-2 outline-none focus:focus-ring"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-right font-bold">{formatBs(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border border-earth-300 bg-earth-100 p-4">
              <h4 className="font-black">Productos con stock bajo</h4>
              <p className="mt-2 text-sm text-leaf-700">
                {lowStockProducts.map((product) => product.name).join(", ") || "Sin alertas"}
              </p>
            </div>
            <div className="border border-earth-300 bg-earth-100 p-4">
              <h4 className="font-black">Productos más vendidos</h4>
              <p className="mt-2 text-sm text-leaf-700">{mostSold.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-earth-300 bg-white p-4 shadow-soft">
      <p className="text-2xl font-black text-leaf-700">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-earth-700">
        {label}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-leaf-900 px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-black">EcoMarket Bolivia SRL</h2>
          <p className="mt-2 text-white/72">Comercio electrónico B2C</p>
        </div>
        <div>
          <p className="font-black">Productos orgánicos bolivianos</p>
          <p className="mt-2 text-white/72">Miel, café, quinua, chocolate e infusiones.</p>
        </div>
        <div>
          <p className="font-black">Cochabamba, Bolivia</p>
          <p className="mt-2 text-white/72">WhatsApp / Teléfono: +591 70000000</p>
        </div>
        <div>
          <p className="font-black">Proyecto académico de Sistemas II</p>
          <p className="mt-2 text-white/72">Integrante 9: Plataforma Web y Comercio Electrónico.</p>
        </div>
      </div>
    </footer>
  );
}

function makeQrCells(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const inCorner =
      (row < 3 && col < 3) ||
      (row < 3 && col > 5) ||
      (row > 5 && col < 3);

    if (inCorner) {
      return row === 0 || row === 2 || col === 0 || col === 2;
    }

    return ((hash + index * 17 + row * col) % 3) !== 0;
  });
}
