import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableCell } from './Table';
import Badge from './Badge';
import { useAdminOrders } from '../../../hooks/useAdminApi';

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'currentColor' }}>
    <path d="M2.29 5.9h15.42M17.708 14.1H2.292M12.083 3.333a2.56 2.56 0 110 5.142 2.56 2.56 0 010-5.142zM7.917 11.525a2.56 2.56 0 110 5.142 2.56 2.56 0 010-5.142z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'light' => {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'success';
    case 'shipped':   return 'success';
    case 'processing':
    case 'pending':   return 'warning';
    case 'cancelled':
    case 'canceled':  return 'error';
    default:          return 'light';
  }
};

const RecentOrders: React.FC = () => {
  const { data: orders, pagination, loading } = useAdminOrders({ limit: 5, page: 1 });
  const recent = (orders ?? []).slice(0, 5);
  const totalOrders = pagination?.total ?? 0;

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 8, border: '1px solid #d0d5dd',
    background: '#ffffff', padding: '8px 14px',
    fontSize: 13, fontWeight: 500, color: '#344054',
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    transition: 'background 0.15s ease',
    textDecoration: 'none',
  };

  return (
    <div style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid #e4e7ec', background: '#ffffff', padding: '16px 24px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101828', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Recent Orders
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
            {loading ? 'Loading…' : `${totalOrders} total orders`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={btnStyle}>
            <FilterIcon /> Filter
          </button>
          <Link to="/admin/orders" style={btnStyle}>
            See all
          </Link>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderBottom: 'none' }}>
              <TableCell isHeader>Products</TableCell>
              <TableCell isHeader>Category</TableCell>
              <TableCell isHeader>Price</TableCell>
              <TableCell isHeader>Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell style={{ textAlign: 'center', padding: '24px 0', color: '#98a2b3' }}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : recent.length === 0 ? (
              <TableRow>
                <TableCell style={{ textAlign: 'center', padding: '24px 0', color: '#98a2b3' }}>
                  No orders yet
                </TableCell>
              </TableRow>
            ) : (
              recent.map((order) => {
                const firstItem = order.items?.[0];
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {firstItem?.image ? (
                          <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={firstItem.image} alt={firstItem.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: 50, height: 50, borderRadius: 8, background: '#f2f4f7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#98a2b3"><path d="M3 6l9-4 9 4v1L12 11 3 7V6zm0 2.5l9 4 9-4V17l-9 4-9-4V8.5z"/></svg>
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: '#101828', fontFamily: 'Outfit, sans-serif' }}>
                            {firstItem?.name || `Order #${order.id.slice(-6)}`}
                          </p>
                          <span style={{ fontSize: 12, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
                            {order.items?.length || 1} item{(order.items?.length || 1) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.address?.city || order.userName || '—'}
                    </TableCell>
                    <TableCell>
                      ${(order.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" color={statusColor(order.status)}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecentOrders;
