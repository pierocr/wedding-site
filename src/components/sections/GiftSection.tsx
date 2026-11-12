"use client";
import * as React from "react";
import {
  Gift,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Sparkles,
  CreditCard,
  Info,
  Landmark,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import clsx from "clsx";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { FEATURE_FLAGS } from "@/config/featureFlags";

// ============ TYPES ============
type GiftItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: number;
};

type CartLine = {
  id: string;
  title: string;
  icon: string;
  unitPrice: number;
  qty: number;
};

// ============ GIFT CATALOG ============
const GIFT_CATALOG: GiftItem[] = [
  // Detalles hasta $100.000
  {
    id: "primer-cafe",
    icon: "☕",
    title: "El Primer Café Juntos",
    description: "Mañanas con aroma a café.",
    price: 50000,
  },
  {
    id: "brindis-estrellas",
    icon: "🥂",
    title: "Brindis Bajo las Estrellas",
    description: "Un brindis por su amor.",
    price: 60000,
  },
  {
    id: "baile-cocina",
    icon: "🎶",
    title: "Baile en la Cocina",
    description: "Música y pasos juntos.",
    price: 70000,
  },
  {
    id: "paseo-atardecer",
    icon: "🌅",
    title: "Paseo al Atardecer",
    description: "Un paseo de la mano.",
    price: 100000,
  },
  // Experiencias sobre $100.000
  {
    id: "desayuno-especial",
    icon: "🥐",
    title: "Desayuno para Dos",
    description: "Una mañana sin apuro.",
    price: 110000,
  },
  {
    id: "cena-velas",
    icon: "🕯️",
    title: "Cena a la Luz de las Velas",
    description: "Una cena para dos.",
    price: 120000,
  },
  {
    id: "tarde-vinedo",
    icon: "🍷",
    title: "Una Tarde entre Viñedos",
    description: "Un brindis entre viñas.",
    price: 130000,
  },
  {
    id: "noche-estrellas",
    icon: "✨",
    title: "Noche Bajo las Estrellas",
    description: "Una noche para soñar.",
    price: 140000,
  },
  {
    id: "dia-desconexion",
    icon: "🌿",
    title: "Un Día para Desconectar",
    description: "Un momento de calma.",
    price: 150000,
  },
  {
    id: "sabores-viaje",
    icon: "🍽️",
    title: "Sabores de Viaje",
    description: "Nuevos sabores para dos.",
    price: 160000,
  },
  // Luna de miel y hogar
  {
    id: "escapada",
    icon: "🧳",
    title: "Escapada de Fin de Semana",
    description: "Dos días solo para ellos.",
    price: 180000,
  },
  {
    id: "ruta-luna-miel",
    icon: "🚗",
    title: "Una Ruta para Recordar",
    description: "Paisajes y recuerdos.",
    price: 200000,
  },
  {
    id: "sesion-fotos",
    icon: "📸",
    title: "Recuerdos para Siempre",
    description: "Su historia en fotos.",
    price: 220000,
  },
  {
    id: "aventura",
    icon: "🗺️",
    title: "La Gran Aventura",
    description: "Explorar el mundo juntos.",
    price: 280000,
  },
  {
    id: "amanecer-luna-miel",
    icon: "🌄",
    title: "Amanecer de Luna de Miel",
    description: "El primer sol de casados.",
    price: 350000,
  },
  {
    id: "nido",
    icon: "🏡",
    title: "Construyendo su Nido",
    description: "Un aporte a su hogar.",
    price: 500000,
  },
];

// ============ COMPONENT ============
export default function GiftSection() {
  const CURRENCY = "CLP";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const MAX_QTY = 10;

  const CART_KEY = "gift_cart";
  const DONOR_KEY = "gift_donor";

  // ------- Safe localStorage loading -------
  function loadCart(): CartLine[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((l: any) => l && typeof l.id === "string")
        .map((l: any) => ({
          id: String(l.id),
          title: String(l.title ?? ""),
          icon: String(l.icon ?? "💝"),
          unitPrice: Number(l.unitPrice ?? 0),
          qty: Number(l.qty ?? 0),
        }))
        .filter((l: CartLine) => l.qty > 0 && l.unitPrice >= 0);
    } catch {
      return [];
    }
  }

  function loadDonor(): { name: string; email: string; message: string } {
    if (typeof window === "undefined")
      return { name: "", email: "", message: "" };
    try {
      const raw = localStorage.getItem(DONOR_KEY);
      if (!raw) return { name: "", email: "", message: "" };
      const { name = "", email = "", message = "" } = JSON.parse(raw) ?? {};
      return {
        name: String(name),
        email: String(email),
        message: String(message),
      };
    } catch {
      return { name: "", email: "", message: "" };
    }
  }

  const [cart, setCart] = React.useState<CartLine[]>(() => loadCart());
  const donor = React.useMemo(loadDonor, []);
  const [name, setName] = React.useState(donor.name);
  const [email, setEmail] = React.useState(donor.email);
  const [message, setMessage] = React.useState(donor.message);
  const [customMsg, setCustomMsg] = React.useState("");
  const [customAmount, setCustomAmount] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [paymentPausedOpen, setPaymentPausedOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const ls = loadCart();
    if (ls.length) setCart(ls);
    const d = loadDonor();
    if (d.name) setName(d.name);
    if (d.email) setEmail(d.email);
    if (d.message) setMessage(d.message);
  }, []);

  const priceFmt = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(n);

  // Save cart + notify nav
  React.useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      const qty = cart.reduce((acc, l) => acc + l.qty, 0);
      const total = cart.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
      window.dispatchEvent(
        new CustomEvent("gift:cart-changed", { detail: { qty, total } }),
      );
    } catch {}
  }, [cart]);

  // Save donor info with debounce
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DONOR_KEY,
          JSON.stringify({ name, email, message }),
        );
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [name, email, message]);

  // ===== Cart helpers =====
  const qtyFor = (id: string) => cart.find((l) => l.id === id)?.qty ?? 0;

  const setQty = (
    id: string,
    title: string,
    icon: string,
    unitPrice: number,
    qty: number,
  ) => {
    const q = Math.max(0, Math.min(MAX_QTY, qty));
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) {
        return q > 0 ? [...prev, { id, title, icon, unitPrice, qty: q }] : prev;
      }
      if (q === 0) return prev.filter((l) => l.id !== id);
      const next = [...prev];
      next[idx] = { ...next[idx], qty: q };
      return next;
    });
  };

  const addItem = (item: GiftItem) => {
    trackEvent("gift_info_click", {
      action: "add_catalog_item",
      gift_id: item.id,
      gift_title: item.title,
      value: item.price,
      currency: CURRENCY,
    });
    setQty(item.id, item.title, item.icon, item.price, qtyFor(item.id) + 1);
  };

  const inc = (id: string) => {
    const l = cart.find((x) => x.id === id);
    if (l) setQty(id, l.title, l.icon, l.unitPrice, l.qty + 1);
  };
  const dec = (id: string) => {
    const l = cart.find((x) => x.id === id);
    if (l) setQty(id, l.title, l.icon, l.unitPrice, l.qty - 1);
  };
  const removeLine = (id: string) => setQty(id, "", "", 0, 0);
  const clearCart = () => setCart([]);

  const addCustomToCart = () => {
    if (!customMsg.trim() || !customAmount || Number(customAmount) <= 0) {
      alert("Completa tu mensaje y un monto válido");
      return;
    }
    const id = `custom:${customMsg.trim()}:${customAmount}`;
    const title = customMsg.trim();
    const unitPrice = Number(customAmount);
    trackEvent("gift_info_click", {
      action: "add_custom_item",
      value: unitPrice,
      currency: CURRENCY,
    });
    setQty(id, title, "💝", unitPrice, qtyFor(id) + 1);
    setCustomMsg("");
    setCustomAmount("");
  };

  const subtotal = (l: CartLine) => l.unitPrice * l.qty;
  const total = cart.reduce((a, l) => a + subtotal(l), 0);
  const itemCount = cart.reduce((a, l) => a + l.qty, 0);

  const canPay =
    !!name.trim() &&
    EMAIL_RE.test(email) &&
    cart.length > 0 &&
    !loading;

  const groupedGifts = [
    {
      title: "Detalles",
      description: "Gestos simples para acompanar nuestro nuevo comienzo.",
      items: GIFT_CATALOG.filter((gift) => gift.price <= 70000),
    },
    {
      title: "Experiencias",
      description: "Momentos para celebrar, descansar y recordar.",
      items: GIFT_CATALOG.filter(
        (gift) => gift.price > 70000 && gift.price <= 140000,
      ),
    },
    {
      title: "Luna de miel y hogar",
      description: "Aportes para nuestros primeros planes como matrimonio.",
      items: GIFT_CATALOG.filter((gift) => gift.price > 140000),
    },
  ];

  async function pay() {
    if (!canPay) return;
    if (!FEATURE_FLAGS.flowGiftPaymentsEnabled) {
      trackEvent("gift_info_click", {
        action: "payment_temporarily_disabled",
        value: total,
        currency: CURRENCY,
        items: itemCount,
      });
      setPaymentPausedOpen(true);
      return;
    }

    trackEvent("gift_info_click", {
      action: "start_payment",
      value: total,
      currency: CURRENCY,
      items: itemCount,
    });
    setLoading(true);
    try {
      const res = await fetch("/api/flow/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: name,
          donor_email: email,
          message,
          currency: CURRENCY,
          amount: total,
          cart: cart.map((l) => ({
            id: l.id,
            title: `${l.icon} ${l.title}`,
            unitPrice: l.unitPrice,
            qty: l.qty,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (!data?.redirectUrl) throw new Error("No se pudo iniciar el pago");
      window.location.href = data.redirectUrl as string;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No pudimos iniciar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="rounded-xl border-border/50 shadow-[0_4px_18px_rgba(0,0,0,0.035)]">
        <CardHeader className="items-center pb-2 pt-5 text-center">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Gift aria-hidden="true" className="h-5 w-5 text-primary" />
            Regalos con Mensaje
          </CardTitle>
          <CardDescription>
            Elige un regalo para acompañarnos en esta nueva etapa.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-3">
          {/* Gift Catalog Grid */}
          <div className="grid gap-2 lg:grid-cols-3">
            {GIFT_CATALOG.map((gift) => {
              const qty = qtyFor(gift.id);
              const isSelected = mounted && qty > 0;

              return (
                <div
                  key={gift.id}
                  className={clsx(
                    "group relative flex items-start gap-3 overflow-hidden rounded-xl border bg-card p-2.5 transition active:scale-[0.99]",
                    isSelected
                      ? "border-primary/45 bg-primary/5 pr-32"
                      : "border-border/55 pr-14 hover:border-primary/25",
                  )}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="hidden">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" />
                        {qty}
                      </span>
                    </div>
                  )}

                  {/* Icon Area */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/70">
                    <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                      {gift.icon}
                    </span>
                    {/* Decorative flourish */}
                    <div className="hidden">❦</div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-tight">
                      {gift.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground leading-relaxed">
                      {gift.description}
                    </p>

                    {/* Price & Action */}
                    <div className="flex items-center gap-2 pt-0">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {priceFmt(gift.price)}
                      </span>

                      {!mounted ? (
                        <div className="absolute right-2.5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg bg-muted/40 animate-pulse" />
                      ) : qty === 0 ? (
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => addItem(gift)}
                          className="absolute right-2.5 top-1/2 h-10 w-10 -translate-y-1/2 shrink-0 rounded-lg bg-primary hover:bg-primary/90"
                          aria-label={`Agregar ${gift.title}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => dec(gift.id)}
                            className="h-10 w-10 rounded-lg"
                            aria-label={`Quitar una unidad de ${gift.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-5 text-center text-sm font-medium tabular-nums">
                            {qty}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => addItem(gift)}
                            className="h-10 w-10 rounded-lg"
                            aria-label={`Agregar una unidad de ${gift.title}`}
                            disabled={qty >= MAX_QTY}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Gift Card */}
            <details className="group rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <div className="rounded-full bg-accent/20 p-2.5">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Tu propio deseo</h3>
                  <p className="text-sm text-muted-foreground">
                    Crea un mensaje personalizado
                  </p>
                </div>
                <ChevronDown aria-hidden="true" className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-4 space-y-4">
                <Input
                  placeholder="Escribe tu bendición o deseo..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="h-11 bg-background/80"
                />

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <Input
                    type="number"
                    placeholder="50000"
                    min={1000}
                    step={1000}
                    value={customAmount}
                    onChange={(e) =>
                      setCustomAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-11 bg-background/80"
                  />
                  <span className="text-sm text-muted-foreground">CLP</span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomToCart}
                  className="w-full rounded-xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar deseo
                </Button>
              </div>
            </details>
          </div>

          <Separator className="my-4" />

          {/* Donor Form */}
          <div id="datos-pago" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-center">Tus Datos</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="gift-name" className="text-sm font-medium">
                  Tu nombre (obligatorio)
                </label>
                <Input
                  id="gift-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carolina Pérez"
                  className="h-11 bg-background"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="gift-email" className="text-sm font-medium">
                  Email (obligatorio)
                </label>
                <Input
                  id="gift-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@correo.cl"
                  className="h-11 bg-background"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="gift-message" className="text-sm font-medium">
                  Mensaje para los novios (opcional)
                </label>
                <Textarea
                  id="gift-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Déjanos un mensaje bonito que acompañe tu regalo..."
                  rows={2}
                  className="min-h-[60px] bg-background resize-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/30">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-semibold">Tu Selección</span>
              </div>
              <span
                className="text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {mounted
                  ? `${itemCount} ${itemCount === 1 ? "regalo" : "regalos"}`
                  : "—"}
              </span>
            </div>

            {/* Cart Items */}
            {!mounted ? (
              <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : cart.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                Elige un regalo del catálogo.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {cart.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-4"
                  >
                    <span className="row-span-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/70 text-2xl sm:row-span-1 sm:h-auto sm:w-auto sm:bg-transparent">
                      {l.icon}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight sm:truncate sm:text-base">
                        {l.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        {priceFmt(l.unitPrice)} c/u
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="block text-xs text-muted-foreground sm:hidden">
                        Subtotal
                      </span>
                      <span className="block whitespace-nowrap text-base font-semibold tabular-nums sm:w-24">
                        {priceFmt(subtotal(l))}
                      </span>
                    </div>

                    <div className="col-start-2 flex items-center justify-between pt-1 sm:col-auto sm:justify-start sm:gap-3 sm:pt-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => dec(l.id)}
                          className="h-9 w-9 rounded-lg"
                          aria-label={`Quitar una unidad de ${l.title}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">
                          {l.qty}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => inc(l.id)}
                          className="h-9 w-9 rounded-lg"
                          disabled={l.qty >= MAX_QTY}
                          aria-label={`Agregar una unidad de ${l.title}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLine(l.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar ${l.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Footer */}
            <div className="px-4 py-2 bg-secondary/20 border-t">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  disabled={!mounted || cart.length === 0}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Vaciar
                </Button>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p
                    className="text-2xl font-bold text-primary tabular-nums"
                    suppressHydrationWarning
                  >
                    {mounted ? priceFmt(total) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl bg-[#c03221] hover:bg-[#a92a1c] text-primary-foreground shadow-lg h-14 sm:h-12 sm:px-6 sm:text-sm md:text-base font-semibold"
                onClick={pay}
                disabled={!mounted || !canPay}
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Preparando tu regalo...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pagar (WebPay)
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Puedes pagar con tarjeta o transferencia bancaria.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="Información sobre las formas de pago"
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Info className="size-5" aria-hidden="true" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Formas de pago</DialogTitle>
                      <DialogDescription className="leading-relaxed">
                        Elige la alternativa que te acomode. Al continuar, podrás
                        seleccionar cómo pagar tu regalo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <h3 className="font-semibold">Webpay</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Paga con tu tarjeta de débito o crédito a través de Webpay.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <h3 className="font-semibold">Webpay en cuotas</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Si prefieres, puedes pagar con tarjeta de crédito en
                            2 a 12 cuotas sin interés. Selecciona las cuotas entre
                            las opciones disponibles durante el pago.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Landmark className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <h3 className="font-semibold">Transferencia bancaria con Khipu</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Paga directamente desde tu banco seleccionando Khipu y
                            siguiendo las instrucciones que aparecerán en pantalla.
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" className="w-full rounded-xl sm:w-auto">
                          Entendido
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex shrink-0 items-center justify-center gap-3">
                <Image
                  src="/flow-logo.png"
                  alt="Flow"
                  width={36}
                  height={36}
                  className="size-9 rounded-md object-contain"
                />
                <Image
                  src="/1.Webpay_FB_800px.png"
                  alt="WebPay"
                  width={90}
                  height={30}
                  className="h-auto w-[90px] object-contain"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={paymentPausedOpen} onOpenChange={setPaymentPausedOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Opción de regalos en actualización</DialogTitle>
            <DialogDescription className="space-y-4 pt-2 text-left leading-relaxed">
              <span className="block">
                Estamos actualizando momentáneamente la opción para regalos del
                matrimonio.
              </span>
              <span className="block">
                Si deseas hacernos un regalo, puedes escribirnos directamente
                con Debby o Piero y con gusto te compartiremos las alternativas
                disponibles.
              </span>
              <span className="block">
                Gracias por tu cariño y comprensión.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" className="w-full rounded-xl sm:w-auto">
                Entendido
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
