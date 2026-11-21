'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import './page.css';

/**
 * Order confirmation page.
 *
 * Data source: the checkout writes a minimal snapshot of the confirmed order to
 * localStorage under LAST_ORDER_KEY right before redirecting here (see
 * CheckOut.jsx -> orderStatusChange). The orderId query param is the durable
 * handle for the order, but the page deliberately does NOT re-fetch from the
 * backend: there is no "get order by id/number" endpoint in the API (the only
 * candidate, /checkout/my-orders, is the known-broken myOrders handler being
 * fixed separately), and a receipt must survive a page refresh.
 *
 * The snapshot is read once and then removed, so a later visit to this URL shows
 * the "no recent order" state rather than a stale receipt.
 */
const LAST_ORDER_KEY = 'lastOrder';

// Mirrors the customer-facing payment method used at checkout (Razorpay).
const PAYMENT_METHOD_LABEL = 'Razorpay (Online)';

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN').format(amount).toString();
}

function formatAddress(address) {
  if (!address || typeof address !== 'object') {
    return '';
  }

  return [address.address, address.city, address.state, address.country]
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .join(', ');
}


function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  // null while the snapshot is being read, then true/false for found/not-found.
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    let snapshot = null;

    try {
      const raw = window.localStorage.getItem(LAST_ORDER_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          snapshot = parsed;
        }
        // Read once, then clear: a receipt is a one-time confirmation, and
        // leaving it behind would show a stale order on the next visit.
        window.localStorage.removeItem(LAST_ORDER_KEY);
      }
    } catch {
      // Malformed snapshot - treat exactly like "no order".
      snapshot = null;
    }

    setOrder(snapshot);
    setLoaded(true);
  }, []);

  // ── No recent order (direct visit, or refreshed after the snapshot was cleared) ──
  if (loaded && !order) {
    return (
      <div className="order_success_area">
        <div className="container">
          <div className="order_success_card order_success_empty">
            <h1>No recent order</h1>
            <p>
              We could not find a recently placed order on this device. Once you
              place an order, the confirmation will appear here.
            </p>
            <Link href="/shop" className="order_success_btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const address = order?.shippingAddress;
  const addressLines = formatAddress(address);


  return (
    <div className="order_success_area">
      <div className="container">

        <div className="order_success_card">

          {/* ── Success header ── */}
          <div className="order_success_header">
            <span className="order_success_icon" aria-hidden="true">
              <i className="fa fa-check" />
            </span>
            <h1>Thank you for your order!</h1>
            <p className="order_success_lead">
              Your payment was successful and your order is now confirmed. A copy
              of these details is shown below for your records.
            </p>
          </div>

          {/* ── Order meta: id, payment method, amount paid ── */}
          <div className="order_success_meta">
            <div className="order_success_meta_item">
              <span className="order_success_meta_label">Order ID</span>
              <span className="order_success_meta_value">{order?.orderNumber || orderId || '-'}</span>
            </div>
            <div className="order_success_meta_item">
              <span className="order_success_meta_label">Payment Method</span>
              <span className="order_success_meta_value">{order?.paymentMethod || PAYMENT_METHOD_LABEL}</span>
            </div>
            <div className="order_success_meta_item">
              <span className="order_success_meta_label">Amount Paid</span>
              <span className="order_success_meta_value">Rs. {formatPrice(order?.netAmount)}</span>
            </div>
          </div>

          <div className="order_success_body">

            {/* ── Left: items + totals ── */}
            <div className="order_success_items">
              <h2>Order Summary</h2>

              {items.length === 0 ? (
                <p className="order_success_note">No item details are available for this order.</p>
              ) : (
                <ul className="order_success_item_list">
                  {items.map((item, index) => {
                    // Fall back to the array index: the cart snapshot may not
                    // always carry a stable id (e.g. placeholder products).
                    const key = item?.id ?? item?._id ?? `${item?.name ?? 'item'}-${index}`;
                    const quantity = Number(item?.quantity) || 0;
                    const lineTotal = quantity * (Number(item?.price) || 0);

                    return (
                      <li key={key} className="order_success_item">
                        <div className="order_success_item_info">
                          <p className="order_success_item_name">{item?.name || 'Product'}</p>
                          {item?.category && (
                            <p className="order_success_item_category">{item.category}</p>
                          )}
                        </div>
                        <span className="order_success_item_qty">Qty: {quantity}</span>
                        <span className="order_success_item_total">Rs. {formatPrice(lineTotal)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="order_success_totals">
                <div className="order_success_total_row">
                  <span>Subtotal</span>
                  <span>Rs. {formatPrice(order?.totalAmount)}</span>
                </div>
                <div className="order_success_total_row">
                  <span>Discount (-)</span>
                  <span>Rs. {formatPrice(order?.discountAmount)}</span>
                </div>
                <div className="order_success_total_row order_success_total_grand">
                  <span>Order Total</span>
                  <span>Rs. {formatPrice(order?.netAmount)}</span>
                </div>
              </div>
            </div>

            {/* ── Right: customer + delivery address ── */}
            <aside className="order_success_address">
              <h2>Delivery Details</h2>

              <div className="order_success_address_block">
                <span className="order_success_address_label">Customer</span>
                <p className="order_success_address_value">{address?.name || order?.name || '-'}</p>
                {order?.mobileNumber && (
                  <p className="order_success_address_value">{order.mobileNumber}</p>
                )}
                {address?.email && (
                  <p className="order_success_address_value">{address.email}</p>
                )}
              </div>

              <div className="order_success_address_block">
                <span className="order_success_address_label">Shipping Address</span>
                {addressLines ? (
                  <p className="order_success_address_value">{addressLines}</p>
                ) : (
                  <p className="order_success_address_value">-</p>
                )}
              </div>

              {order?.orderNote && (
                <div className="order_success_address_block">
                  <span className="order_success_address_label">Order Notes</span>
                  <p className="order_success_address_value">{order.orderNote}</p>
                </div>
              )}
            </aside>

          </div>

          {/* ── Actions ── */}
          <div className="order_success_actions">
            <Link href="/shop" className="order_success_btn">
              Continue Shopping
            </Link>
            <button
              type="button"
              className="order_success_btn order_success_btn_secondary"
              onClick={() => router.push('/')}
            >
              Go to Homepage
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  // useSearchParams needs a Suspense boundary so the page can still be
  // statically prerendered by Next.js.
  return (
    <Suspense
      fallback={
        <div className="order_success_area">
          <div className="container">
            <div className="order_success_card">
              <p className="order_success_note">Loading your order...</p>
            </div>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
