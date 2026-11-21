'use client';

import ImageWithSkeleton from '../components/Common/ImageWithSkeleton';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Skeleton from '../components/Common/Skeleton';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export default function CartPage() {
  const { cart, isHydrated, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (!isHydrated) {
    return (
      <section className="cart_area">
        <div className="container">
          <Skeleton variant="list" count={3} />
        </div>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="shopping_cart_area">
        <div className="container">
          <div className="row mb-5">
            <div className="col-12">
              <div className="about_thumb text-center">
                <img src="/images/my-Order.jpg" alt="" />
              </div>
              <div className="about_content mb-10">Your shopping cart is empty!</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="cart_area">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="table_desc">
              <div className="cart_page cart_table_wrap table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="product_thumb">
                            <Link href={`/product/${item.slug}`}>
                              <ImageWithSkeleton
                                src={item.image}
                                alt={item.name}
                                width={70}
                                height={70}
                                style={{ objectFit: 'contain' }}
                              />
                            </Link>
                            <div className="product_name">
                              <Link href={`/product/${item.slug}`}>{item.name}</Link>
                            </div>
                          </td>
                          <td className="product-price">
                            Rs. {formatPrice(item.price)}
                          </td>
                          <td className="product_quantity">
                            <label>Quantity</label>
                            <div className="qty_controls">
                              <button
                                type="button"
                                className="qty_btn"
                                aria-label="Decrease quantity"
                                disabled={item.quantity <= 1}
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                              >
                                <i className="fa fa-minus"></i>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                aria-label={`Quantity of ${item.name}`}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(val)) {
                                    updateQuantity(item.id, Math.max(1, val));
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="qty_btn"
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <i className="fa fa-plus"></i>
                              </button>
                            </div>
                          </td>
                          <td className="product_total">
                            Rs. {formatPrice(lineTotal)}
                          </td>
                          <td className="product_remove">
                            <button
                              type="button"
                              className="cart_remove_btn"
                              aria-label={`Remove ${item.name} from cart`}
                              title="Remove"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <i className="ion-android-close"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="cart_submit">
                <Link href="/shop" className="continue_shopping">
                  <i className="fa fa-chevron-left"></i> Continue Shopping
                </Link>
              </div>
            </div>

            {/* Totals */}
            <div className="cart_totals">
              <div className="cart_subtotal">
                <p>Sub Total</p>
                <p className="cart_amount">Rs. {formatPrice(getCartTotal())}</p>
              </div>
              <div className="cart_subtotal">
                <p>Cart Total</p>
                <p className="cart_amount">Rs. {formatPrice(getCartTotal())}</p>
              </div>
              <div className="checkout_btn">
                <Link href="/checkout">Proceed to Checkout</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}