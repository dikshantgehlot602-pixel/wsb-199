'use client';

import { useState } from 'react';

// Generic template Q&A matching the reference site (no business-specific claims).
// The reference itself repeats one question — items 2 and 3 are identical there.
const answer =
  'Donec mattis finibus elit ut tristique. Nullam tempus nunc eget arcu vulputate, eu porttitor tellus commodo. Aliquam erat volutpat. Aliquam consectetur lorem eu viverra lobortis. Morbi gravida, nisi id fringilla ultricies, elit lorem eleifend lorem.';
const faqs = [
  { q: 'Morbi gravida, nisi id fringilla ultricies, elit lorem ipsum?', a: answer },
  { q: 'Aenean elit orci, efficitur quis nisl at, accumsan?', a: answer },
  { q: 'Aenean elit orci, efficitur quis nisl at, accumsan?', a: answer },
  { q: 'Pellentesque habitant morbi tristique senectus et netus?', a: answer },
  { q: 'Nam pellentesque aliquam metus?', a: answer },
  { q: 'Aenean elit orci, efficitur quis nisl at?', a: answer },
];

export default function FaqAccordion() {
  // First item open by default; -1 means all closed. This mirrors the
  // reference's data-parent="#accordion" single-open behaviour.
  const [open, setOpen] = useState(0);

  return (
    <section className="accordion_area">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div id="accordion" className="card__accordion">
              {faqs.map((faq, i) => {
                const isOpen = open === i;
                return (
                  <div className="card card_dipult" key={i}>
                    <div className="card-header card_accor" id={`headingOne${i}`}>
                      <button
                        type="button"
                        className={`btn btn-link${isOpen ? '' : ' collapsed'}`}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        onClick={() => setOpen(isOpen ? -1 : i)}
                      >
                        {faq.q}
                        <i className="fa fa-plus" aria-hidden="true"></i>
                        <i className="fa fa-minus" aria-hidden="true"></i>
                      </button>
                    </div>
                    <div
                      id={`faq-panel-${i}`}
                      className={`collapse${isOpen ? ' show' : ''}`}
                      aria-labelledby={`headingOne${i}`}
                    >
                      <div className="card-body">
                        <p>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}