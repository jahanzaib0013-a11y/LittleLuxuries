import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  User,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  Tag,
  Truck,
  Layers,
} from "lucide-react";
import { orderService, type CartItem } from "@/lib/order-service";
import { productService } from "@/lib/supabase-service";
import { toast } from "sonner";
import { formatPkr } from "@/lib/format-currency";
import {
  fullScreenModalClass,
  modalFooterClass,
  modalScrollPaneClass,
} from "@/components/product-modal-layout";
import { ModalCloseBar } from "@/components/modal-close-bar";
import { OrderSuccessScreen } from "@/components/order-success-screen";
import { cn } from "@/lib/utils";

interface AddOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded: () => void;
}

export function AddOrderModal({ open, onOpenChange, onOrderAdded }: AddOrderModalProps) {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Selector state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [customPrice, setCustomPrice] = useState("");

  // Order state
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [shippingAmount, setShippingAmount] = useState("250");
  const [taxAmount, setTaxAmount] = useState("0");

  // Customer details
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Shipping details
  const [shippingAddress, setShippingAddress] = useState({
    streetAddress: "",
    city: "",
    postalCode: "",
    country: "PK",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    total: number;
    customerName: string;
  } | null>(null);

  // Load products list from Supabase
  useEffect(() => {
    if (open) {
      const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const list = await productService.getProducts("published");
          setProductsList(list);
        } catch (err) {
          console.error("Failed to load products:", err);
          toast.error("Could not fetch product catalog");
        } finally {
          setIsLoadingProducts(false);
        }
      };
      loadProducts();
    }
  }, [open]);

  const currentProduct = productsList.find((p) => p.id === selectedProductId);

  // Pre-fill fields when product is selected
  useEffect(() => {
    if (currentProduct) {
      setCustomPrice(currentProduct.price.toString());
      if (currentProduct.sizes && currentProduct.sizes.length > 0) {
        setSelectedSize(currentProduct.sizes[0]);
      } else {
        setSelectedSize("One Size");
      }
    } else {
      setCustomPrice("");
      setSelectedSize("");
    }
  }, [selectedProductId, currentProduct]);

  // Dynamic values
  const productSizes =
    currentProduct?.sizes && currentProduct.sizes.length > 0
      ? currentProduct.sizes
      : ["Newborn", "0–3M", "3–6M", "6–12M", "One Size"];

  const subtotal = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const discount = parseFloat(discountAmount) || 0;
  const shipping = parseFloat(shippingAmount) || 0;
  const tax = parseFloat(taxAmount) || 0;
  const total = Math.max(0, subtotal + shipping + tax - discount);

  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedProductId || !currentProduct) {
      toast.error("Please select a product");
      return;
    }

    const qty = parseInt(selectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive integer");
      return;
    }

    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Price must be a valid positive number");
      return;
    }

    const existingIndex = orderItems.findIndex(
      (item) => item.product_id === selectedProductId && item.size === selectedSize,
    );

    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += qty;
      setOrderItems(updated);
      toast.success(`Updated quantity for ${currentProduct.name}`);
    } else {
      const newItem: CartItem = {
        product_id: currentProduct.id,
        product_name: currentProduct.name,
        product_image_url: currentProduct.image_url || null,
        size: selectedSize,
        quantity: qty,
        unit_price: price,
      };
      setOrderItems([...orderItems, newItem]);
      toast.success(`Added ${currentProduct.name} to order`);
    }

    // Reset item selectors
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const handleRemoveItem = (index: number) => {
    const item = orderItems[index];
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
    toast.info(`Removed ${item.product_name} from order`);
  };

  const resetForm = () => {
    setOrderItems([]);
    setDiscountAmount("0");
    setShippingAmount("250");
    setTaxAmount("0");
    setCustomerInfo({ email: "", firstName: "", lastName: "", phone: "" });
    setShippingAddress({ streetAddress: "", city: "", postalCode: "", country: "PK" });
    setValidationSummary(null);
    setPlacedOrder(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSuccessDone = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const issues: string[] = [];
    if (orderItems.length === 0) issues.push("Add at least one product to the order.");
    if (!customerInfo.firstName.trim()) issues.push("Client first name is required.");
    if (!customerInfo.lastName.trim()) issues.push("Client last name is required.");
    if (!customerInfo.email.trim()) issues.push("Client email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim())) {
      issues.push("Enter a valid client email.");
    }
    if (!shippingAddress.streetAddress.trim()) issues.push("Street address is required.");
    if (!shippingAddress.city.trim()) issues.push("City is required.");
    if (!shippingAddress.postalCode.trim()) issues.push("Postal code is required.");

    if (issues.length > 0) {
      setValidationSummary(issues.join(" "));
      return;
    }
    setValidationSummary(null);

    setIsSubmitting(true);
    try {
      const { order, error } = await orderService.createOrder({
        customer_email: customerInfo.email.trim(),
        customer_first_name: customerInfo.firstName.trim(),
        customer_last_name: customerInfo.lastName.trim(),
        customer_phone: customerInfo.phone.trim() || undefined,
        shipping_address: {
          first_name: customerInfo.firstName.trim(),
          last_name: customerInfo.lastName.trim(),
          street_address: shippingAddress.streetAddress.trim(),
          city: shippingAddress.city.trim(),
          postal_code: shippingAddress.postalCode.trim(),
          country: shippingAddress.country,
        },
        subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        discount_amount: discount,
        total_amount: total,
        items: orderItems,
      });

      if (error) {
        toast.error(error);
        return;
      }

      onOrderAdded();
      setPlacedOrder({
        orderNumber: order?.order_number ?? "—",
        total,
        customerName: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`.trim(),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create new order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={fullScreenModalClass}>
        <ModalCloseBar onClose={handleClose} />
        {placedOrder ? (
          <div className={cn(modalScrollPaneClass, "flex flex-col justify-center")}>
            <OrderSuccessScreen
              variant="modal"
              orderNumber={placedOrder.orderNumber}
              total={placedOrder.total}
              customerName={placedOrder.customerName}
              doneLabel="Done"
              onDone={handleSuccessDone}
            />
          </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              modalScrollPaneClass,
              "custom-scrollbar lg:flex lg:flex-row lg:overflow-hidden",
            )}
          >
          {/* Left Column: Order Items Workspace */}
          <div className="w-full shrink-0 border-b border-border/50 bg-muted/20 p-4 sm:p-6 lg:min-h-0 lg:w-[450px] lg:shrink-0 lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r lg:p-10 custom-scrollbar">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                    Order Items Workspace
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add pieces from your store catalog and build the financial package.
                </p>
              </div>

              {/* Selector Block */}
              <div className="p-5 rounded-2xl bg-white/60 border border-border/50 space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="product-select"
                    className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                  >
                    Select Product
                  </Label>
                  <select
                    id="product-select"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-border/50 focus:ring-primary/20 text-xs focus:outline-none transition-all cursor-pointer font-medium text-foreground hover:bg-muted/10"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    disabled={isLoadingProducts}
                  >
                    <option value="">
                      {isLoadingProducts ? "Loading products..." : "Choose a piece..."}
                    </option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatPkr(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {currentProduct && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in-50 duration-200">
                    <div className="space-y-1.5 col-span-2">
                      <Label
                        htmlFor="size-select"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Size
                      </Label>
                      <select
                        id="size-select"
                        className="w-full h-10 px-3 rounded-lg bg-white border border-border/50 focus:ring-primary/20 text-xs focus:outline-none transition-all cursor-pointer font-medium text-foreground"
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                      >
                        {productSizes.map((s: string) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="qty-input"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Qty
                      </Label>
                      <Input
                        id="qty-input"
                        type="number"
                        min="1"
                        className="h-10 rounded-lg bg-white border-border/50 text-xs text-center"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-3">
                      <Label
                        htmlFor="price-input"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Unit Price (PKR)
                      </Label>
                      <Input
                        id="price-input"
                        type="number"
                        className="h-10 rounded-lg bg-white border-border/50 text-xs"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full rounded-xl h-10 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none text-xs font-bold transition-all"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add to Order
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Pieces In Order ({orderItems.length})
                </h4>

                {orderItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/20 p-6 bg-white/40 flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="h-8 w-8 text-primary/30 mb-2" />
                    <h5 className="text-xs font-semibold text-foreground/80">Workspace Empty</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                      Select items above to custom craft this client's shipment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {orderItems.map((item, idx) => (
                      <div
                        key={`${item.product_id}-${item.size}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border/40 hover:border-border/80 transition-all duration-200 shadow-xs group animate-in slide-in-from-bottom-2"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-semibold bg-primary-soft">
                              {item.product_name.substring(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold text-foreground truncate">
                            {item.product_name}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
                              Size: {item.size}
                            </span>
                            <span>
                              Qty: {item.quantity} × {formatPkr(item.unit_price)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 grid place-items-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Math */}
              <div className="border-t border-border/60 pt-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="shipping-input"
                      className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                    >
                      Shipping (PKR)
                    </Label>
                    <Input
                      id="shipping-input"
                      type="number"
                      className="h-9 rounded-lg bg-white border-border/50 text-xs"
                      value={shippingAmount}
                      onChange={(e) => setShippingAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="discount-input"
                      className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                    >
                      Discount (PKR)
                    </Label>
                    <Input
                      id="discount-input"
                      type="number"
                      className="h-9 rounded-lg bg-white border-border/50 text-xs"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary-soft/50 border border-primary/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground/70 font-medium">
                    <span>Subtotal:</span>
                    <span>{formatPkr(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/70 font-medium">
                    <span>Discount:</span>
                    <span className="text-destructive">- {formatPkr(discount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/70 font-medium">
                    <span>Courier Delivery:</span>
                    <span>+ {formatPkr(shipping)}</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 flex items-center justify-between text-sm font-bold text-primary">
                    <span>Total Amount:</span>
                    <span className="font-serif text-base">{formatPkr(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Client & Delivery Details */}
          <div className="flex w-full min-w-0 flex-col bg-white lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-col lg:flex-1 lg:overflow-hidden">
              <div
                className={cn(
                  "space-y-8 p-4 pt-5 sm:p-6 lg:space-y-10 lg:p-10 lg:pt-8",
                  "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain custom-scrollbar",
                )}
              >
                {validationSummary && (
                  <div
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {validationSummary}
                  </div>
                )}
                {/* Section 1: Customer Profile */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                      Client Identity
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Client Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g. client@luxury.com"
                        className="h-11 rounded-xl border-border/50"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="first-name"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                        >
                          First Name *
                        </Label>
                        <Input
                          id="first-name"
                          placeholder="First Name"
                          className="h-11 rounded-xl border-border/50"
                          value={customerInfo.firstName}
                          onChange={(e) =>
                            setCustomerInfo((prev) => ({ ...prev, firstName: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="last-name"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                        >
                          Last Name *
                        </Label>
                        <Input
                          id="last-name"
                          placeholder="Last Name"
                          className="h-11 rounded-xl border-border/50"
                          value={customerInfo.lastName}
                          onChange={(e) =>
                            setCustomerInfo((prev) => ({ ...prev, lastName: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="phone"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Contact Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. +92 300 1234567"
                        className="h-11 rounded-xl border-border/50"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Delivery Coordinates */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                      Fulfillment coordinates
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="street-address"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Street Address *
                      </Label>
                      <Input
                        id="street-address"
                        placeholder="Suite, apartment, street coordinates..."
                        className="h-11 rounded-xl border-border/50"
                        value={shippingAddress.streetAddress}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, streetAddress: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="city"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                        >
                          City *
                        </Label>
                        <Input
                          id="city"
                          placeholder="e.g. Lahore, Karachi"
                          className="h-11 rounded-xl border-border/50"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="postal-code"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                        >
                          Postal / Zip Code *
                        </Label>
                        <Input
                          id="postal-code"
                          placeholder="e.g. 54000"
                          className="h-11 rounded-xl border-border/50"
                          value={shippingAddress.postalCode}
                          onChange={(e) =>
                            setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="country"
                        className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
                      >
                        Country
                      </Label>
                      <select
                        id="country"
                        className="w-full h-11 px-3.5 rounded-xl bg-white border border-border/50 focus:ring-primary/20 text-xs focus:outline-none transition-all cursor-pointer font-medium text-foreground"
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({ ...prev, country: e.target.value }))
                        }
                      >
                        <option value="PK">Pakistan (PKR)</option>
                        <option value="AE">United Arab Emirates (AED)</option>
                        <option value="US">United States (USD)</option>
                        <option value="GB">United Kingdom (GBP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Footer */}
              <div className={cn(modalFooterClass, "bg-muted/5 sm:bg-muted/5")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-primary">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      </div>
                    </div>
                    <span>Drafting Custom Luxury Package</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClose}
                      className="min-h-11 w-full rounded-full text-base font-semibold sm:w-auto sm:px-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-h-11 w-full rounded-full bg-primary text-base font-semibold text-white shadow-md sm:w-auto sm:min-w-[160px]"
                    >
                      {isSubmitting ? "Placing Order..." : "Create Order"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
