import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getMyOrders, type Order } from '../services/orders';
import './MyOrders.css';

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'fulfilled':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="my-orders">
        <div className="skeleton" style={{ height: 40, width: 200 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders">
        <h2 className="my-orders__title">My Orders</h2>
        <div className="badge-danger" style={{ padding: '16px', borderRadius: '8px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <h2 className="my-orders__title">My Orders</h2>

      {orders.length === 0 ? (
        <div className="my-orders__empty">
          You have no medicine orders yet.
        </div>
      ) : (
        <div className="my-orders__list">
          {orders.map(order => {
            const isExpanded = expandedId === order.id;
            const badgeClass = getStatusBadgeClass(order.status);

            return (
              <div key={order.id} className={`my-orders__card ${isExpanded ? 'my-orders__card--expanded' : ''}`}>
                <div
                  className="my-orders__card-header"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="my-orders__order-info">
                    <span className="my-orders__order-num">Order #{order.id.slice(-8).toUpperCase()}</span>
                    <span className="my-orders__order-meta">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.items.length} items
                    </span>
                  </div>

                  <div className="my-orders__order-summary">
                    <span className="my-orders__order-total">
                      ₹{order.total.toFixed(2)}
                    </span>
                    <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                      {order.status}
                    </span>
                    <ChevronDown size={16} className={`my-orders__chevron ${isExpanded ? 'my-orders__chevron--open' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="my-orders__card-body">
                    <h4 className="my-orders__items-title">Order Items</h4>
                    <table className="my-orders__table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th style={{ textAlign: 'right' }}>Price</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
