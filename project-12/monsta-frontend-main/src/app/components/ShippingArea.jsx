import './ShippingArea.css';

export default function ShippingArea() {
  return (
    <div className="shipping_area shipping_two product_bottom_two">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-4 col-12">
            <div className="single-shipping">
              <div className="shipping_icone icone_1"></div>
              <div className="shipping_content">
                <h3>Free Shipping</h3>
                <p>Free shipping on all order</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 col-12">
            <div className="single-shipping">
              <div className="shipping_icone icone_2"></div>
              <div className="shipping_content">
                <h3>Money Return</h3>
                <p>Back guarantee under 7 days</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 col-12">
            <div className="single-shipping">
              <div className="shipping_icone icone_4"></div>
              <div className="shipping_content">
                <h3>Online Support</h3>
                <p>Support online 24 hours a day</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}