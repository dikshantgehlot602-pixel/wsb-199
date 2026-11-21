import Link from 'next/link';
import Testimonials from '../components/Testimonials';
import { fetchWhyChooseUs } from '../../lib/api';
import './page.css';

export const metadata = {
  title: 'About Us - Online Furniture in India',
  description:
    'Learn more about Online Furniture in India — our furniture store, what we do, our mission and the history of our company.',
};

// "Why chose us?" features taken from the reference site's About page.
// Note: the reference renders each card's icon as an uploaded image inside a
// .chose_icone wrapper. That wrapper has no theme CSS rule (verified: 0 hits
// in style.css), so the card keeps the wrapper for class parity and the
// font icons are only used when the API has nothing to show.
//
// Each fallback entry pairs an icon with the text the reference used, so the
// section looks complete if the API is empty or down.
const FALLBACK_CHOSE_FEATURES = [
  {
    icon: 'ion-ios-checkmark',
    image: '',
    title: '100% Money Back Guarantee',
    text: 'Erat metus sodales eget dolor consectetuer, porta ut purus at et alias, nulla ornare velit amet enim',
  },
  {
    icon: 'ion-headphone',
    image: '',
    title: 'Online Support 24/7',
    text: 'Erat metus sodales eget dolor consectetuer, porta ut purus at et alias, nulla ornare velit amet enim',
  },
  {
    icon: 'ion-ios-lightbulb',
    image: '',
    title: 'Creative-Design',
    text: 'Erat metus sodales eget dolor consectetuer, porta ut purus at et alias, nulla ornare velit amet enim God has created everything like air,water,tree and metal',
  },
];

// Three info columns matching the reference layout (image + heading + text).
// The reference repeats the same paragraph under all three headings.
const galleryParagraph =
  'Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima.';
const infoColumns = [
  {
    img: '/images/about_1.png',
    alt: 'What Do We Do — furniture offered by Online Furniture in India',
    title: 'What Do We Do?',
    text: galleryParagraph,
  },
  {
    img: '/images/about_2.png',
    alt: 'Our Mission — the furniture collection and craft',
    title: 'Our Mission',
    text: galleryParagraph,
  },
  {
    img: '/images/about_3.png',
    alt: 'History Of Us — the story of our furniture store',
    title: 'History Of Us',
    text: galleryParagraph,
  },
];

// Server component, so the API is called with `await` during render — the request is issued
// on the server and the records are baked into the initial HTML (no client waterfall, no
// flash of the fallback list).
export default async function AboutUsPage() {
  // API is the source of truth; the hardcoded list above is only used when the API
  // returns nothing or fails, so the page is never blank.
  const chooseUsItems = await fetchWhyChooseUs();

  const choseFeatures = chooseUsItems.length > 0
    ? chooseUsItems.map((item) => ({
        // Admin records carry an uploaded image and a title, but no body text. The
        // fallback entries below keep a `text`, so fall back to it when the API
        // record has nothing to show.
        icon: '',
        image: item.image,
        title: item.title,
        text: item.description || FALLBACK_CHOSE_FEATURES[0].text,
      }))
    : FALLBACK_CHOSE_FEATURES;

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
                  <li>About Us</li>
                </ul>
                <h3>About Us</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro — reference order: full-width image FIRST, then content */}
      <section className="about_section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-12">
              <div className="about_thumb">
                <img
                  src="/images/trendpage.jpg"
                  alt="Furniture collection by Online Furniture in India"
                />
              </div>
              <div className="about_content">
                <h1>Welcome to Monsta!</h1>
                <p>
                  Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie
                  consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan
                  et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis
                  dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend
                  option congue nihil imperdiet doming id quod mazim placerat facer possim assum.
                  Typi non habent claritatem insitam, est usus legentis in iis qui facit eorum
                  claritatem.
                </p>
                <span>
                  "There are many variations of passages of Lorem Ipsum available, but the majority
                  have suffered alteration in some form."
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why chose us? */}
      <section className="choseus_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="chose_title">
                <h1>Why chose us?</h1>
              </div>
            </div>
          </div>
          <div className="row">
            {choseFeatures.map((f) => (
              <div key={f.title} className="col-lg-4 col-md-6 col-12">
                <div className="single_chose">
                  {/* Admin records supply a real uploaded image, so it is preferred over
                      the font icon. The icon is only rendered when there is no image
                      (i.e. the hardcoded fallback entries). */}
                  <div className="chose_icone">
                    {f.image ? (
                      <img src={f.image} alt={f.title} />
                    ) : (
                      <i className={f.icon}></i>
                    )}
                  </div>
                  <div className="chose_content">
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Do We Do? / Our Mission / History Of Us */}
      <section className="about_gallery_section">
        <div className="container">
          <div className="row">
            {infoColumns.map((col) => (
              <div key={col.title} className="col-lg-4 col-md-6 col-12">
                <div className="single_gallery_section">
                  <div className="gallery_thumb">
                    <img src={col.img} alt={col.alt} />
                  </div>
                  <div className="about_gallery_content">
                    <h3>{col.title}</h3>
                    <p>{col.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — reuses the existing project component; the props copy the
          reference About Us details (title typo, square 100px avatar, 5 stars)
          without changing the Home page's rendering. */}
      <Testimonials
        title="What Our Custumers Say ?"
        squareAvatar
        showRatings
      />
    </main>
  );
}