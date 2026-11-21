import Skeleton from '../components/Common/Skeleton';

export default function ShopLoading() {
  return (
    <main>
      <section className="shop_area">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-12">
              <Skeleton variant="text" count={6} />
            </div>
            <div className="col-lg-9 col-md-12">
              <Skeleton variant="product-card" count={12} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
