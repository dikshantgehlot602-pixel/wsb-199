'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import './Newsletter.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');

    // Local demo only — no email is sent or stored on any server.
    setTimeout(() => {
      setStatus('done');
      setEmail('');
      toast.success('Subscribed successfully!', {
        toastId: 'newsletter-subscribed',
      });
    }, 600);
  };

  const submitting = status === 'submitting';

  return (
    <div className="newsletter_area product_bottom_two">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="newsletter_content">
              <h2>Our Newsletter</h2>
              <p>Get E-mail updates about our latest shop and special offers.</p>
              <div className="subscribe_form">
                <form onSubmit={handleSubmit} className="mc-form footer-newsletter">
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={submitting}>
                      {submitting ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </div>
                </form>
                {status === 'done' && (
                  <p className="text-muted">
                    This is a demo subscription form — your email has not been stored on a server.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
