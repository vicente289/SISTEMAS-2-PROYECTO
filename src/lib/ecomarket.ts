import { mockOrders, products } from "@/data/products";
import type { CartLine, Order, OrderStatus, Product } from "@/types";

export const orderStatuses: OrderStatus[] = [
  "Pedido recibido",
  "Pago confirmado",
  "Preparando productos",
  "En camino",
  "Entregado",
];

export const demandPredictions = [
  {
    product: "Café premium",
    insight: "Alta demanda esta semana",
    percent: 88,
  },
  {
    product: "Miel orgánica",
    insight: "Demanda media",
    percent: 64,
  },
  {
    product: "Quinua real",
    insight: "Alta demanda por temporada",
    percent: 92,
  },
  {
    product: "Jabón ecológico",
    insight: "Baja demanda",
    percent: 34,
  },
];

export const uxCards = [
  {
    user: "Usuario impaciente",
    response: "Buscador visible y compra en pocos pasos.",
  },
  {
    user: "Usuario que no lee mucho",
    response: "Textos cortos, imágenes claras y precios visibles.",
  },
  {
    user: "Usuario que se confunde",
    response: "Formularios simples con ayuda contextual.",
  },
  {
    user: "Usuario que desconfía",
    response: "Origen del producto, certificaciones y trazabilidad.",
  },
  {
    user: "Usuario tradicional",
    response: "WhatsApp y teléfono siempre visibles.",
  },
  {
    user: "Usuario recurrente",
    response: "Boletín y ofertas personalizadas.",
  },
];

export const industryCards = [
  "Inventario en tiempo real",
  "Automatización de pedidos",
  "Trazabilidad con QR",
  "Pagos digitales",
  "Analítica de ventas",
  "Sincronización con proveedores",
  "Seguimiento logístico",
  "Panel administrativo",
];

export const academicCards = [
  {
    title: "Comercio electrónico B2C",
    text: "La venta se realiza directamente desde EcoMarket Bolivia SRL hacia el consumidor final.",
  },
  {
    title: "Canvas",
    text: "Conecta propuesta de valor, canales digitales, relación con clientes e ingresos por ventas.",
  },
  {
    title: "IA",
    text: "Personaliza recomendaciones, interpreta búsquedas y predice demanda de productos.",
  },
  {
    title: "Industria 4.0",
    text: "Automatiza inventario, pedidos, pagos, trazabilidad y logística de última milla.",
  },
  {
    title: "UX",
    text: "Reduce fricción con navegación simple, precios claros y formularios breves.",
  },
  {
    title: "Logística",
    text: "Permite seguimiento del pedido y entrega estimada menor a 8 horas.",
  },
];

export const chatbotAnswers = [
  {
    question: "¿Cuánto tarda la entrega?",
    answer:
      "La entrega estimada es menor a 8 horas dentro de la zona habilitada.",
  },
  {
    question: "¿Los productos son orgánicos?",
    answer:
      "Sí, trabajamos con productores nacionales y productos naturales certificados.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos QR, transferencia, tarjeta simulada y pago contra entrega.",
  },
  {
    question: "¿Dónde entregan?",
    answer: "Inicialmente en el área metropolitana de Cochabamba.",
  },
  {
    question: "¿Puedo pedir por WhatsApp?",
    answer: "Sí, también contamos con atención inmediata por WhatsApp.",
  },
];

export function getChatbotAnswer(question: string) {
  const normalizedQuestion = normalizeText(question);

  const rules = [
    {
      terms: ["entrega", "tarda", "tiempo", "demora", "horas"],
      answer: chatbotAnswers[0].answer,
    },
    {
      terms: ["organico", "organicos", "certificado", "natural", "productos"],
      answer: chatbotAnswers[1].answer,
    },
    {
      terms: ["pago", "pagos", "qr", "transferencia", "tarjeta", "contra entrega"],
      answer: chatbotAnswers[2].answer,
    },
    {
      terms: ["donde", "zona", "entregan", "cochabamba", "ubicacion"],
      answer: chatbotAnswers[3].answer,
    },
    {
      terms: ["whatsapp", "telefono", "pedir", "pedido"],
      answer: chatbotAnswers[4].answer,
    },
  ];

  const matchedRule = rules.find((rule) =>
    rule.terms.some((term) => normalizedQuestion.includes(term)),
  );

  return matchedRule?.answer;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function searchProducts(query: string, source: Product[] = products) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return source;
  }

  const semanticMap: Record<string, string[]> = {
    saludable: ["quinua", "frutos secos", "te", "infusion", "granola", "miel"],
    desayuno: ["granola", "miel", "cafe", "panela"],
    energia: ["cafe", "frutos secos", "miel"],
    eco: ["jabon", "detergente", "biodegradable"],
    natural: ["miel", "infusion", "frutos secos", "te"],
    limpieza: ["detergente", "jabon", "biodegradable", "eco"],
    dulce: ["miel", "chocolate", "panela"],
    proteina: ["quinua", "harina", "frutos secos", "granola"],
  };

  const expandedTerms = new Set<string>([normalizedQuery]);

  Object.entries(semanticMap).forEach(([term, relatedTerms]) => {
    if (normalizedQuery.includes(term) || term.includes(normalizedQuery)) {
      relatedTerms.forEach((relatedTerm) => expandedTerms.add(relatedTerm));
    }
  });

  return source.filter((product) => {
    const searchableText = normalizeText(
      [
        product.name,
        product.category,
        product.origin,
        product.badge,
        product.description,
        ...product.keywords,
      ].join(" "),
    );

    return [...expandedTerms].some(
      (term) => searchableText.includes(term) || term.includes(searchableText),
    );
  });
}

export function getProductById(productId: string, source: Product[] = products) {
  return source.find((product) => product.id === productId);
}

export function getRecommendations(productId: string, source: Product[] = products) {
  const recommendationMap: Record<string, string[]> = {
    "cafe-premium": ["chocolate-artesanal", "panela", "granola"],
    "miel-organica": ["te-coca", "manzanilla", "granola"],
    "quinua-real": ["granola", "frutos-secos", "harina-quinua"],
    "harina-quinua": ["quinua-real", "granola", "frutos-secos"],
    "frutos-secos": ["granola", "quinua-real", "miel-organica"],
  };

  const ids = recommendationMap[productId] ?? [
    "miel-organica",
    "cafe-premium",
    "quinua-real",
  ];

  return ids
    .map((id) => source.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
}

export function formatBs(value: number) {
  return `Bs ${value.toFixed(2)}`;
}

export function formatUsdApprox(valueBs: number) {
  return `$us ${(valueBs / 6.96).toFixed(2)}`;
}

export function getCartSubtotal(lines: CartLine[], source: Product[] = products) {
  return lines.reduce((total, line) => {
    const product = getProductById(line.productId, source);
    return total + (product ? product.priceBs * line.quantity : 0);
  }, 0);
}

export function getShipping(subtotal: number) {
  if (subtotal <= 0) {
    return 0;
  }

  return subtotal >= 200 ? 0 : 10;
}

export function getAllOrders(orders: Order[]) {
  const existingIds = new Set(orders.map((order) => order.id));
  return [...orders, ...mockOrders.filter((order) => !existingIds.has(order.id))];
}

export function makeOrderId() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ECO-${new Date().getFullYear()}-${random}`;
}
