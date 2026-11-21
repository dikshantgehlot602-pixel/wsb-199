import Link from 'next/link';
import ContactForm from './ContactForm';
import './page.css';

export const metadata = {
  title: 'Contact Us - Online Furniture in India',
  description:
    'Get in touch with our furniture team. Contact us for queries, orders and support.',
};

// Google Maps embed (public, no API key required) matching the reference site.
const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3577.631421124823!2d73.0283626508787!3d26.27362318332549!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39418c5b1ea7d0c7%3A0xf14d81eb1531921c!2sLaxmi%20Kirana%20Store!5e0!3m2!1sen!2sin!4v1580291833220!5m2!1sen!2sin';

export default function ContactPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li>Contact Us</li>
                </ul>
                <h3>Contact Us</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact_area">
        <div className="container">
          <div className="row">
            {/* Contact form */}
            <div className="col-lg-7 col-md-12 col-12">
              <div className="contact_message form">
                <h3>Send Us a Message</h3>
                <ContactForm />
              </div>
            </div>

            {/* Contact information */}
            <div className="col-lg-5 col-md-12 col-12">
              <div className="contact_message content">
                <h3>Contact Information</h3>
                <ul>
                  <li>
                    <i className="fa fa-home"></i>
                    <span>Address :</span>
                    <p>Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum.</p>
                  </li>
                  <li>
                    <i className="fa fa-phone"></i>
                    <span>Phone :</span>
                    <a href="tel:+9198745612330">+91-98745612330</a>
                  </li>
                  <li>
                    <i className="fa fa-envelope"></i>
                    <span>Email :</span>
                    <a href="mailto:furniture@gmail.com">furniture@gmail.com</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="contact_map">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="map-area" id="googleMap">
                <iframe
                  src={MAP_SRC}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Our location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}