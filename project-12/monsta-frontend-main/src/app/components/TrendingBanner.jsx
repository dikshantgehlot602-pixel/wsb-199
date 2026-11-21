import Link from 'next/link';
import './TrendingBanner.css';


export default function TrendingBanner() {
  return (
    <section className="banner_fullwidth">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12">
            <div className="banner_text">
              <h2>New Trending Collection</h2>
              <span>We Believe That Good Design is Always in Season</span>
              <Link href="/trending-collections">SHOPPING NOW</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}