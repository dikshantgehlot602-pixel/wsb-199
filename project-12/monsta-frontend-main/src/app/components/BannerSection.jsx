import Link from 'next/link';
import Image from 'next/image';
import './BannerSection.css';

export default function BannerSection() {
  const banners = [
    { img: '/images/chairslid1.webp', link: '/top-rated', text: 'Design Creative', title: 'Chair Collection' },
    { img: '/images/chairslid2.webp', link: '/best-selling', text: 'Bestselling Products', title: 'Chair Collection' },
    { img: '/images/chairslid3.webp', link: '/on-sale', text: 'Onsale Products', title: 'Chair Collection' },
  ];

  return (
    <section className="banner_section">
      <div className="container">
        <div className="row">
          {banners.map((banner, idx) => (
            <div className="col-lg-4 col-md-6" key={idx}>
              <div className="single_banner">
                <div className="banner_thumb">
                  <Link href={banner.link}>
                    <Image src={banner.img} alt={banner.text} width={400} height={300} />
                  </Link>
                  <div className="banner_content">
                    <p>{banner.text}</p>
                    <h2>{banner.title}</h2>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}