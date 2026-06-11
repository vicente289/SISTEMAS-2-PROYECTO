# EcoMarket Bolivia SRL

Prototipo web academico para el modulo **Integrante 9: Plataforma Web y Comercio Electronico** del proyecto de Sistemas II.

EcoMarket Bolivia SRL simula una plataforma B2C para vender productos organicos, naturales y ecologicos bolivianos a familias de Cochabamba. La app integra catalogo, buscador inteligente, carrito, checkout simulado, seguimiento logistico, panel administrativo, IA aplicada e Industria 4.0 con datos mock y `localStorage`.

## Ejecutar el proyecto

```bash
npm install
npm run dev
```

Luego abre:

```text
http://127.0.0.1:3000
```

Si el puerto 3000 esta ocupado, puedes usar:

```bash
npm run dev -- --port 3001
```

## Verificar compilacion

```bash
npm run build
npm audit
```

## Funcionalidades implementadas

- Tienda online con catalogo de 12 productos bolivianos.
- Buscador inteligente con coincidencias por palabras incompletas y terminos relacionados.
- Ficha de producto con beneficios, origen, stock, entrega, QR simulado y recomendaciones por IA.
- Carrito funcional con cantidades, eliminacion, subtotal, envio, total y persistencia en `localStorage`.
- Checkout con datos de cliente, metodo de pago simulado y generacion de numero de pedido.
- Seguimiento de pedido con linea de tiempo visual.
- Modulo IA con recomendaciones, prediccion de demanda, carrito abandonado y chatbot EcoBot.
- Industria 4.0 con flujo de productores, plataforma, inventario, pago, logistica, cliente y postventa.
- Panel admin con ventas, pedidos, stock bajo, mas vendidos, carritos abandonados y stock editable.
- Boletin de ofertas y boton de WhatsApp para atencion inmediata.
- Seccion academica que explica por que cumple comercio B2C, Canvas, IA, UX, logistica e Industria 4.0.

## Guia breve para defensa oral

Puedes explicar que EcoMarket Bolivia SRL no es solo una tienda online: es un sistema digital B2C que conecta productores nacionales con consumidores finales. El catalogo y el carrito muestran la venta directa, el checkout simula pagos digitales, el seguimiento representa la logistica de ultima milla, y el panel administrativo demuestra control de inventario, pedidos y analitica.

La parte de IA se evidencia en el buscador inteligente, recomendaciones de productos, prediccion de demanda, recuperacion de carrito abandonado y EcoBot. La parte de Industria 4.0 se evidencia en inventario en tiempo real, trazabilidad con QR, automatizacion de pedidos, pagos digitales, seguimiento logistico y sincronizacion con proveedores.
