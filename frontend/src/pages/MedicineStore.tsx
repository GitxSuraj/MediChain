import React, { useState, useEffect } from 'react';
import { getHospitals } from '../services/api';
import { getPublicInventory, createOrder, verifyOrderPayment, type MedicineItem } from '../services/orders';
import { useAuth } from '../context/AuthContext';
import './MedicineStore.css';

interface CartItem extends MedicineItem {
  cartQuantity: number;
}

const CATEGORIES = [
  'All',
  'Analgesic',
  'Antibiotic',
  'Antacid',
  'Gastrointestinal',
  'Antihistamine',
  'Respiratory',
  'Cardiovascular',
  'Antidiabetic',
  'Vitamins',
];

export default function MedicineStore() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Load hospitals on mount
  useEffect(() => {
    getHospitals()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data.hospitals || [];
        setHospitals(list);
        if (list.length > 0 && !selectedHospital) {
          setSelectedHospital(list[0].id);
        }
      })
      .catch((err) => console.error('Error fetching hospitals:', err));
  }, []);

  // Fetch medicines whenever selectedHospital changes
  useEffect(() => {
    if (selectedHospital) {
      setLoading(true);
      setError('');
      getPublicInventory(selectedHospital)
        .then((data) => {
          setMedicines(Array.isArray(data) ? data : []);
        })
        .catch((err) => setError(err.message || 'Failed to load medicines.'))
        .finally(() => setLoading(false));
      setCart([]);
    } else {
      setMedicines([]);
    }
  }, [selectedHospital]);

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.sku && m.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' ||
      (m.category && m.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const addToCart = (medicine: MedicineItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicine.id);
      if (existing) {
        if (existing.cartQuantity >= medicine.quantity) return prev;
        return prev.map((item) =>
          item.id === medicine.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...medicine, cartQuantity: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cartQuantity + delta;
            if (newQty <= 0) return null;
            return { ...item, cartQuantity: Math.min(newQty, item.quantity) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalItemsCount = cart.reduce((a, b) => a + b.cartQuantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price_per_unit * item.cartQuantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const currentHospitalObj = hospitals.find((h) => h.id === selectedHospital);

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedHospital) return;
    setProcessing(true);
    setError('');

    try {
      const itemsPayload = cart.map((c) => ({
        medicine_id: c.id,
        quantity: c.cartQuantity,
      }));

      const orderData = await createOrder(selectedHospital, itemsPayload);

      // Load Razorpay script dynamically
      const loadRazorpay = () => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Razorpay SDK failed to load. Please check your connection.');
      }

      const options = {
        key: orderData.razorpay_key_id || 'rzp_test_TQve7VCYMqj7WX',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: currentHospitalObj?.name || 'MediChain Pharmacy',
        description: `Order #${orderData.order_id.slice(-6)} · Medicine Purchase`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            await verifyOrderPayment(orderData.order_id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentSuccess(orderData.order_id);
            setCart([]);
            // Reload medicines to reflect decremented stock
            getPublicInventory(selectedHospital).then((data) => setMedicines(Array.isArray(data) ? data : []));
          } catch (verifyErr: any) {
            setError(verifyErr.message || 'Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0f766e',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize checkout.');
      setProcessing(false);
    }
  };

  return (
    <div className="medicine-store-page">
      {/* Header */}
      <div className="store-header">
        <div className="store-header-left">
          <h2>🏥 Pharmacy & Medicine Store</h2>
          <p className="text-secondary">
            Order authentic medications, antibiotics, and vitamins directly from hospital pharmacies.
          </p>
        </div>

        {/* Hospital selector */}
        <div className="hospital-picker-wrap">
          <label className="hospital-picker-label">Dispensing Facility:</label>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="store-hospital-select"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city}) {h.type === 'clinic' ? '• Clinic' : '• Hospital'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="store-alert store-alert--error">{error}</div>}

      {paymentSuccess && (
        <div className="store-alert store-alert--success">
          <div>
            <strong>Payment Successful! Order Confirmed.</strong>
            <p>Your order ID is <code>#{paymentSuccess.slice(-8).toUpperCase()}</code>. Medicines have been reserved.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setPaymentSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="store-layout">
        {/* Catalog Section */}
        <div className="store-catalog">
          {/* Search & Category Filter */}
          <div className="store-filter-bar">
            <input
              type="text"
              placeholder="Search by brand name, generic formula, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="store-search-input"
            />
            <div className="category-chips-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${selectedCategory === cat ? 'category-chip--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Grid */}
          {loading ? (
            <div className="store-loading-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="store-empty-catalog card-surface">
              <span style={{ fontSize: '2.5rem' }}>💊</span>
              <h3>No Medicines Found</h3>
              <p className="text-secondary">
                {search || selectedCategory !== 'All'
                  ? 'Try adjusting your search or category filter.'
                  : 'No medicines available in this facility pharmacy right now.'}
              </p>
              {(search || selectedCategory !== 'All') && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="medicines-grid">
              {filteredMedicines.map((med) => {
                const inCart = cart.find((c) => c.id === med.id);
                const isOutOfStock = med.quantity <= 0;

                return (
                  <div key={med.id} className="medicine-card card-surface">
                    <div className="medicine-card-header">
                      <span className="medicine-category-badge">{med.category || 'General'}</span>
                      {med.sku && <span className="medicine-sku-tag">{med.sku}</span>}
                    </div>

                    <div className="medicine-card-body">
                      <h4 className="medicine-name">{med.name}</h4>
                      <p className="medicine-generic">{med.generic_name}</p>
                      {med.description && <p className="medicine-desc">{med.description}</p>}
                    </div>

                    <div className="medicine-card-footer">
                      <div className="medicine-price-stock">
                        <div className="medicine-price">
                          <span className="currency-symbol">₹</span>
                          <span className="price-val">{med.price_per_unit.toFixed(2)}</span>
                          <span className="unit-label">/{med.unit || 'unit'}</span>
                        </div>
                        <span className={`stock-indicator ${med.quantity <= 15 ? 'stock-indicator--low' : 'stock-indicator--ok'}`}>
                          {isOutOfStock ? 'Out of stock' : `${med.quantity} left`}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="cart-qty-inline">
                          <button onClick={() => updateCartQty(med.id, -1)} className="qty-btn">-</button>
                          <span className="qty-val">{inCart.cartQuantity}</span>
                          <button
                            onClick={() => updateCartQty(med.id, 1)}
                            className="qty-btn"
                            disabled={inCart.cartQuantity >= med.quantity}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary add-to-cart-btn"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(med)}
                        >
                          {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="store-cart-sidebar card-surface">
          <div className="cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🛒</span>
              <h3>Your Cart</h3>
            </div>
            {totalItemsCount > 0 && (
              <span className="cart-items-badge">{totalItemsCount} item{totalItemsCount > 1 ? 's' : ''}</span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty-view">
              <span style={{ fontSize: '2rem', opacity: 0.4 }}>🛍️</span>
              <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>Your cart is empty</p>
              <small className="text-secondary">Click "+ Add to Cart" on any medicine to begin.</small>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                        ₹{item.price_per_unit.toFixed(2)} × {item.cartQuantity} = <strong style={{ color: '#0f172a' }}>₹{(item.price_per_unit * item.cartQuantity).toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="cart-item-controls">
                      <button onClick={() => updateCartQty(item.id, -1)} className="qty-btn-sm">-</button>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '16px', textAlign: 'center' }}>{item.cartQuantity}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="qty-btn-sm"
                        disabled={item.cartQuantity >= item.quantity}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="btn-remove-item"
                        title="Remove from cart"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary-section">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>GST Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="summary-line summary-line--total">
                  <strong>Total Payable</strong>
                  <strong style={{ color: '#0f766e', fontSize: '1.2rem' }}>₹{total.toFixed(2)}</strong>
                </div>

                <button
                  className="btn btn-primary btn-checkout"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `💳 Pay ₹${total.toFixed(2)} with Razorpay`}
                </button>
                <small className="checkout-hint">🔒 Instant Verification & Direct Dispatch</small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
