export type ProductBadge =
  | "Orgánico"
  | "Natural"
  | "Eco"
  | "Más vendido"
  | "Oferta";

export type DemandLevel = "Alta" | "Media" | "Baja";

export type Product = {
  id: string;
  name: string;
  category: string;
  priceBs: number;
  stock: number;
  origin: string;
  badge: ProductBadge;
  description: string;
  benefits: string[];
  producer: string;
  delivery: string;
  imageUrl: string;
  keywords: string[];
  demandLevel: DemandLevel;
  demandPercent: number;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CustomerData = {
  name: string;
  phone: string;
  address: string;
  zone: string;
  reference: string;
};

export type PaymentMethod = "QR" | "Transferencia" | "Tarjeta simulada" | "Pago contra entrega";

export type OrderStatus =
  | "Pedido recibido"
  | "Pago confirmado"
  | "Preparando productos"
  | "En camino"
  | "Entregado";

export type Order = {
  id: string;
  customer: CustomerData;
  paymentMethod: PaymentMethod;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedTime: string;
};
