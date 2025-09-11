"use client";
import * as React from "react";
import {
  Gift,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Heart,
  Check,
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

type CatalogItem = {
  id: string;
  emoji: string;
  label: string;
  price: number;
};

type CartLine = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
};

export default function GiftSection() {
  const CURRENCY = "CLP";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const MAX_QTY = 10;

  // Claves de localStorage
  const CART_KEY = "gift_cart";
  const DONOR_KEY = "gift_donor";

  // Catálogo
  const ITEMS: CatalogItem[] = [
    { id: "brindis",   emoji: "🥂", label: "Brindis bajo las estrellas",       price: 40000 },
    { id: "cafe",      emoji: "☕️", label: "Café de domingo para dos",        price: 50000 },
    { id: "pelis",     emoji: "🎬", label: "Noche de películas y mantita",     price: 60000 },
    { id: "atardecer", emoji: "🌇", label: "Paseo al atardecer de la mano",    price: 70000 },
    { id: "vela",      emoji: "🕯️", label: "Cena a la luz de las velas",      price: 80000 },
    { id: "fotos",     emoji: "📸", label: "Sesión de fotos de luna de miel",  price: 150000 },
    { id: "escapada",  emoji: "🧳", label: "Escapada de fin de semana",        price: 120000 },
    { id: "amanecer",  emoji: "🌅", label: "Amanecer de luna de miel",         price: 200000 },
  ];

  // ------- Carga segura desde storage (evita hydration issues) -------
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
          unitPrice: Number(l.unitPrice ?? 0),
          qty: Number(l.qty ?? 0),
        }))
        .filter((l: CartLine) => l.qty > 0 && l.unitPrice >= 0);
    } catch {
      return [];
    }
  }

  function loadDonor(): { name: string; email: string } {
    if (typeof window === "undefined") return { name: "", email: "" };
    try {
      const raw = localStorage.getItem(DONOR_KEY);
      if (!raw) return { name: "", email: "" };
      const { name = "", email = "" } = JSON.parse(raw) ?? {};
      return { name: String(name), email: String(email) };
    } catch {
      return { name: "", email: "" };
    }
  }

  const [cart, setCart] = React.useState<CartLine[]>(() => loadCart());
  const donor = React.useMemo(loadDonor, []);
  const [name, setName] = React.useState(donor.name);
  const [email, setEmail] = React.useState(donor.email);
  const [customMsg, setCustomMsg] = React.useState("");
  const [customAmount, setCustomAmount] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);

  const priceFmt = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(n);

  // Guardar carrito + notificar al nav
  React.useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      const qty = cart.reduce((acc, l) => acc + l.qty, 0);
      const total = cart.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
      window.dispatchEvent(
        new CustomEvent("gift:cart-changed", { detail: { qty, total } })
      );
    } catch {}
  }, [cart]);

  // Guardar nombre/email con debounce
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DONOR_KEY, JSON.stringify({ name, email }));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [name, email]);

  // ===== Helpers carrito =====
  const qtyFor = (id: string) => cart.find((l) => l.id === id)?.qty ?? 0;

  const setQty = (id: string, title: string, unitPrice: number, qty: number) => {
    const q = Math.max(0, Math.min(MAX_QTY, qty));
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) {
        return q > 0 ? [...prev, { id, title, unitPrice, qty: q }] : prev;
      }
      if (q === 0) return prev.filter((l) => l.id !== id);
      const next = [...prev];
      next[idx] = { ...next[idx], qty: q };
      return next;
    });
  };

  const addItem = (item: CatalogItem) =>
    setQty(item.id, `${item.emoji} ${item.label}`, item.price, qtyFor(item.id) + 1);

  const inc = (id: string) => {
    const l = cart.find((x) => x.id === id);
    if (l) setQty(id, l.title, l.unitPrice, l.qty + 1);
  };
  const dec = (id: string) => {
    const l = cart.find((x) => x.id === id);
    if (l) setQty(id, l.title, l.unitPrice, l.qty - 1);
  };
  const removeLine = (id: string) => setQty(id, "", 0, 0);
  const clearCart = () => setCart([]);

  const addCustomToCart = () => {
    if (!customMsg.trim() || !customAmount || Number(customAmount) <= 0) {
      alert("Completa tu mensaje y un monto válido 💌");
      return;
    }
    const id = `custom:${customMsg.trim()}:${customAmount}`;
    const title = `💖 ${customMsg.trim()}`;
    const unitPrice = Number(customAmount);
    setQty(id, title, unitPrice, qtyFor(id) + 1);
  };

  const subtotal = (l: CartLine) => l.unitPrice * l.qty;
  const total = cart.reduce((a, l) => a + subtotal(l), 0);

  const canPay = !!name.trim() && EMAIL_RE.test(email) && cart.length > 0 && !loading;

  async function pay() {
    if (!canPay) return;
    setLoading(true);
    try {
      const summaryTitle =
        "Regalos para Piero & Debby — " +
        cart.map((l) => `${l.qty}× ${l.title}`).join(", ");

      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          title: summaryTitle,
          amount: Math.round(total),
          currency: CURRENCY,
          external_reference: `gift:${Date.now()}:${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      window.location.href = data.init_point;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No pudimos iniciar el pago. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <Gift className="h-5 w-5" /> Regalos con mensaje
        </CardTitle>
        <CardDescription>
          El mejor regalo es tu presencia. Si quieres dejarnos un detalle, elige
          uno (o varios) de estos gestos románticos y realiza el aporte por
          Mercado Pago. Gracias por ser parte de este capítulo de amor.{" "}
          <Heart className="inline-block h-4 w-4" />
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Catálogo */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((o) => {
            const qty = qtyFor(o.id);
            const title = `${o.emoji} ${o.label}`;
            return (
              <div
                key={o.id}
                className="group relative overflow-hidden rounded-xl border p-2 text-left shadow-sm transition hover:shadow-md"
              >
                {/* Contenido */}
                <div className="relative">
                  {/* Encabezado compacto: emoji + nombre; permite wrap */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex flex-1 items-start gap-2 pr-2">
                      <span className="text-lg leading-none">{o.emoji}</span>
                      <span className="font-medium leading-snug whitespace-normal break-words text-[15px] sm:text-[16px]">
                        {o.label}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {qty > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] text-emerald-700 border-emerald-200 bg-emerald-50">
                          <Check className="h-3.5 w-3.5" /> {qty}
                        </span>
                      )}
                      <div className="text-sm font-semibold tabular-nums">
                        {priceFmt(o.price)}
                      </div>
                    </div>
                  </div>

                  {/* Controles compactos */}
                  <div className="mt-1.5">
                    {qty === 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addItem(o)}
                        className="rounded-lg"
                        aria-label={`Agregar ${title}`}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Agregar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => dec(o.id)}
                          className="h-8 w-8"
                          aria-label={`Quitar una unidad de ${title}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-8 text-center text-sm tabular-nums">
                          {qty}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            setQty(
                              o.id,
                              title,
                              o.price,
                              Math.min(MAX_QTY, qty + 1)
                            )
                          }
                          className="h-8 w-8"
                          aria-label={`Agregar una unidad de ${title}`}
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

          {/* Personalizado */}
          <div className="rounded-xl border p-3 shadow-sm">
            <div className="font-medium">Mensaje y monto personalizados</div>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Tu mensaje (ej: 'Una tarde para recordar')"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Monto</span>
                <Input
                  type="number"
                  className="w-40"
                  min={1000}
                  step={1000}
                  placeholder="40000"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addCustomToCart}
                className="rounded-lg"
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar personalizado
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Datos del regalante */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Tu nombre (obligatorio)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Carolina Pérez"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email (obligatorio)</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.cl"
            />
          </div>
        </div>

        {/* Carrito */}
        <div className="rounded-xl border bg-muted/20">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ShoppingCart className="h-4 w-4" />
            <div className="font-medium">Tu selección</div>
            <div className="ml-auto text-sm text-muted-foreground">
              {cart.length} ítem{cart.length === 1 ? "" : "s"}
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Aún no agregas regalos. Elige uno del catálogo o crea el tuyo 💝
            </div>
          ) : (
            <div className="divide-y">
              {cart.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {priceFmt(l.unitPrice)} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => dec(l.id)}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-8 text-center text-sm tabular-nums">
                      {l.qty}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => inc(l.id)}
                      className="h-8 w-8"
                      disabled={l.qty >= MAX_QTY}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="w-24 text-right text-sm font-medium">
                    {priceFmt(subtotal(l))}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLine(l.id)}
                    className="h-8 w-8"
                    aria-label="Quitar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">Total:</div>
            <div className="ml-auto text-base font-semibold">
              {priceFmt(total)}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Vaciar
            </Button>
          </div>
        </div>

        {/* Pagar */}
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="text-sm">
            <div className="font-medium">Resumen:</div>
            <div className="text-muted-foreground">
              {cart.length === 0
                ? "Sin ítems aún"
                : cart.map((l) => `${l.qty}× ${l.title}`).join(", ")}
            </div>
          </div>

          <Button
            size="lg"
            className="bg-rose-500 text-white hover:bg-rose-600 shadow-lg rounded-xl"
            onClick={pay}
            disabled={!canPay}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? "Conectando a Mercado Pago…" : "Pagar con Mercado Pago"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}