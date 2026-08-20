import React, { useState, useEffect } from 'react';
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef08a', text: '#854d0e' };
      case 'fulfilled': return { bg: '#e0f2fe', text: '#0369a1' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading orders...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#111827' }}>My Orders</h2>
      
      {orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          You have no medicine orders yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const statusStyle = getStatusColor(order.status);
            const isExpanded = expandedId === order.id;
            
            return (
              <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white' }}>
                <div 
                  onClick={() => toggleExpand(order.id)}
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#f9fafb' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Order #{order.id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(order.created_at).toLocaleString()} • {order.items.length} items
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111827' }}>
                      ₹{order.total.toFixed(2)}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem', 
                      fontWeight: 500,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      textTransform: 'capitalize'
                    }}>
                      {order.status}
                    </span>
                    <span style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Order Items</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                          <th style={{ paddingBottom: '0.5rem' }}>Medicine</th>
                          <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Price</th>
                          <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Qty</th>
                          <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right', color: '#6b7280' }}>
                        <span>Subtotal:</span>
                        <span>GST (18%):</span>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Total:</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                        <span>₹{order.subtotal.toFixed(2)}</span>
                        <span>₹{order.tax.toFixed(2)}</span>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
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
