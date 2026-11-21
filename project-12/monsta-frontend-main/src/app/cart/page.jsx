import Link from 'next/link';
import CartPage from './CartPage';
import './page.css';

export const metadata = {
  title: 'Shopping Cart - Online Furniture in India',
  description: 'Review the items in your cart before proceeding to checkout.',
};

export default function CartRoute() {
  return (
    <main>
      {/* Breadcrumb */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <h3>Shopping Cart</h3>
                <ul>
                  <li><Link href="/">home</Link></li>
                  <li>&gt;</li>
                  <li>Shopping Cart</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CartPage />
    </main>
  );
}