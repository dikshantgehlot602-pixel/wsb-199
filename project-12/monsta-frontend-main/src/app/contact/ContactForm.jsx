'use client';

import { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear a previous submission message when the user edits the form again.
    if (successMsg) setSuccessMsg('');
    if (errorMsg) setErrorMsg('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.message.trim()) next.message = 'Message is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;
    if (sending) return; // Prevent duplicate submissions while sending.

    setSending(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('email', form.email);
    payload.append('subject', form.subject);
    payload.append('message', form.message);

    axios
      .post(`${API_BASE}query/send`, payload)
      .then((result) => {
        if (result.data._status === true) {
          setSuccessMsg(result.data._message || 'Your message has been sent successfully.');
          setForm({ name: '', email: '', subject: '', message: '' });
        } else {
          setErrorMsg(result.data._message || 'Something went wrong. Please try again.');
        }
      })
      .catch(() => {
        setErrorMsg('Something went wrong. Please try again.');
      })
      .finally(() => {
        setSending(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} noValidate autoComplete="off">
      <div className="row">
        <div className="col-lg-6 col-md-6 col-12">
          <label>Name <span className="required">*</span></label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        <div className="col-lg-6 col-md-6 col-12">
          <label>Email <span className="required">*</span></label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div className="col-12">
          <label>Subject <span className="required">*</span></label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Enter subject"
          />
          {errors.subject && <p className="form-error">{errors.subject}</p>}
        </div>
        <div className="col-12">
          <label>Message <span className="required">*</span></label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Write your message..."
          ></textarea>
          {errors.message && <p className="form-error">{errors.message}</p>}
        </div>
        <div className="col-12">
          {successMsg && <p className="form-messege success">{successMsg}</p>}
          {errorMsg && <p className="form-messege error">{errorMsg}</p>}
          <button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      </div>
    </form>
  );
}