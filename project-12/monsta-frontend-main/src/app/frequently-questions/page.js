import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import './page.css';

export const metadata = {
  title: 'Frequently Questions - Online Furniture in India',
  description:
    'Find answers to frequently asked questions about shopping on Online Furniture in India.',
};

export default function FrequentlyQuestionsPage() {
  return (
    <main>
      {/* Breadcrumb — reference order: h3 first, then the ul, with a plain ">"
          separator (no icon) */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <h3>Frequently Questions</h3>
                <ul>
                  <li><Link href="/">home</Link></li>
                  <li>&gt;</li>
                  <li>Frequently Questions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ accordion — the reference has no intro section between the
          breadcrumb and the accordion */}
      <FaqAccordion />
    </main>
  );
}