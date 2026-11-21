"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/ReduxToolkit/LoginSlice";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from 'js-cookie'
import Skeleton from './Common/Skeleton';
import './MyDashboard.css';

const menuItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "profile", label: "My Profile" },
  { id: "password", label: "Change Password" },
  { id: "logout", label: "Logout" },
];

const orders = [
  { id: 1, date: "May 10, 2018", status: "Completed", total: "Rs. 25.00 For 1 Item" },
  { id: 2, date: "May 10, 2018", status: "Processing", total: "Rs. 17.00 For 1 Item" },
];

export default function MyDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const dispatch = useDispatch();

  const router = useRouter();

  const [profile, setProfile] = useState({ salutation: "Mr", name: "", email: "email", mobile: "", address: "" });
  const [billing, setBilling] = useState({ name: "", email: "", mobile: "", address: "", country: "", state: "", city: "" });
  const [shipping, setShipping] = useState({ name: "", email: "", mobile: "", address: "", country: "", state: "", city: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const breadcrumbLabel = menuItems.find(m => m.id === activeTab)?.label || "My Dashboard";

  const logoutUser = () => {
    dispatch(logout());
    toast.success('Logged out successfully', { toastId: 'auth-logout' })
    router.push('/');
  };

  const [userProfile, setUserProfile] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    axios.post(`${process.env.NEXT_PUBLIC_API_URL}user/view-profile`, {}, {
      headers: {
        Authorization: `bearer ${Cookies.get('user_login')}`
      }
    })
      .then((result) => {
        if (result.data._status) {
          const data = result.data._data;
          setUserProfile(data);
          setProfile({
            salutation: data.gender || "",
            name: data.name || "",
            email: data.email || "",
            mobile: data.mobile_number || "",
            address: data.address || "",
          });
        } else {
          setUserProfile('');
          setProfile('');
        }
      })
      .catch(() => {
        toast.error('Something went wrong !')
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [])

  const updateProfile = (e) => {
    e.preventDefault();
    axios.put(`${process.env.NEXT_PUBLIC_API_URL}user/update-profile`, {
      name: profile.name,
      mobile_number: profile.mobile,
      address: profile.address,
      gender: profile.salutation,
    }, {
      headers: {
        Authorization: `bearer ${Cookies.get('user_login')}`
      }
    })
      .then((result) => {
        if (result.data._status) {
          toast.success(result.data._message)
        } else {
          toast.error(result.data._message)
        }
      })
      .catch(() => {
        toast.error('Something went wrong !')
      })
  }

  const changePassword = (e) => {
    e.preventDefault();
    axios.put(`${process.env.NEXT_PUBLIC_API_URL}user/change-password`, {
      current_password: passwords.current,
      new_password: passwords.newPass,
      confirm_password: passwords.confirm,
    }, {
      headers: {
        Authorization: `bearer ${Cookies.get('user_login')}`
      }
    })
      .then((result) => {
        if (result.data._status) {
          toast.success(result.data._message)
          setPasswords({ current: "", newPass: "", confirm: "" });
        } else {
          toast.error(result.data._message)
        }
      })
      .catch(() => {
        toast.error('Something went wrong !')
      })
  }

  return (
    <div className="dashboard_page" style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .menu-item { transition: background-color 0.2s ease; }
        .menu-item:hover { background-color: #c79a77 !important; cursor: pointer; }
        .view-link { color: #c79a77; cursor: pointer; text-decoration: none; font-size: 14px; }
        .view-link:hover { text-decoration: underline; }
        .update-btn { transition: background-color 0.2s ease; }
        .update-btn:hover { background-color: #b5866a !important; cursor: pointer; }
        input:focus, select:focus { outline: 1px solid #c79a77; }
      `}</style>

      {/* Hero Section */}
      <div style={{ backgroundColor: "#ffffff", paddingTop: "48px", paddingBottom: "20px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontWeight: "700", color: "#1d1d1f", marginBottom: "10px" }}>
          My Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: "#555" }}>
          <span style={{ color: "#555", cursor: "pointer" }}>Home</span>
          <span style={{ margin: "0 8px", color: "#555" }}>&gt;</span>
          <span style={{ color: "#c79a77" }}>{breadcrumbLabel}</span>
        </p>
      </div>
      <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "0" }} />

      {/* Main Content */}
      <div className="dashboard_layout">

        {/* Sidebar */}
        <div className="dashboard_sidebar">
          {menuItems.map(item => (
            <div
              key={item.id}
              className="menu-item"
              onClick={() => item.id === 'logout' ? logoutUser() : setActiveTab(item.id)}
              style={{
                backgroundColor: activeTab === item.id ? "#c79a77" : "#1d1d1f",
                color: "#ffffff",
                padding: "18px 22px",
                borderRadius: "5px",
                fontSize: "15px",
                fontWeight: "600",
                letterSpacing: "0.2px",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="dashboard_content" style={{ backgroundColor: "#ffffff", borderRadius: "4px" }}>
          {isLoadingProfile ? (
            <Skeleton variant="list" count={5} />
          ) : (
            <>
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: "700", marginBottom: "20px", color: "#1d1d1f" }}>
                My Dashboard
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#333" }}>
                From your account dashboard. you can easily check &amp; view your <strong>recent orders</strong>, manage your{" "}
                <strong>shipping and billing addresses</strong> and <strong>Edit your password and account details.</strong>
              </p>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: "700", marginBottom: "24px", color: "#1d1d1f" }}>
                Orders
              </h2>
              <div className="dashboard_table_wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    {["Order", "Date", "Status", "Total", "Actions"].map(col => (
                      <th key={col} style={{ padding: "14px 16px", fontWeight: "600", color: "#1d1d1f", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "16px", textAlign: "center", color: "#333" }}>{order.id}</td>
                      <td style={{ padding: "16px", textAlign: "center", color: "#333" }}>{order.date}</td>
                      <td style={{ padding: "16px", textAlign: "center", color: "#333" }}>{order.status}</td>
                      <td style={{ padding: "16px", textAlign: "center", color: "#333" }}>{order.total}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <a className="view-link">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div>
              <p style={{ fontSize: "14px", color: "#555", marginBottom: "28px" }}>
                The following addresses will be used on the checkout page by default.
              </p>
              <div className="dashboard_addresses">
                {/* Billing */}
                <div className="dashboard_address_panel">
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "#1d1d1f" }}>
                    Billing Address
                  </h3>
                  {[
                    { label: "Billing Name*", key: "name", type: "text" },
                    { label: "Billing Email*", key: "email", type: "email" },
                    { label: "Billing Mobile Number*", key: "mobile", type: "text" },
                    { label: "Billing Address*", key: "address", type: "text" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: "18px" }}>
                      <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={billing[f.key]}
                        onChange={e => setBilling({ ...billing, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff" }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>Country*</label>
                    <select
                      value={billing.country}
                      onChange={e => setBilling({ ...billing, country: e.target.value })}
                      style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff", color: billing.country ? "#333" : "#999" }}
                    >
                      <option value="">Select Country</option>
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                  {[
                    { label: "State*", key: "state" },
                    { label: "City*", key: "city" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: "18px" }}>
                      <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>{f.label}</label>
                      <input
                        type="text"
                        value={billing[f.key]}
                        onChange={e => setBilling({ ...billing, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff" }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button className="update-btn" style={{ backgroundColor: "#c79a77", color: "#fff", border: "none", borderRadius: "50px", padding: "12px 32px", fontSize: "13px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                      UPDATE
                    </button>
                  </div>
                </div>

                {/* Shipping */}
                <div className="dashboard_address_panel">
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", marginBottom: "20px", color: "#1d1d1f" }}>
                    Shipping Address
                  </h3>
                  {[
                    { label: "Shipping Name*", key: "name", type: "text" },
                    { label: "Shipping Email*", key: "email", type: "email" },
                    { label: "Shipping Mobile Number*", key: "mobile", type: "text" },
                    { label: "Shipping Address*", key: "address", type: "text" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: "18px" }}>
                      <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={shipping[f.key]}
                        onChange={e => setShipping({ ...shipping, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff" }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>Country*</label>
                    <select
                      value={shipping.country}
                      onChange={e => setShipping({ ...shipping, country: e.target.value })}
                      style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff", color: shipping.country ? "#333" : "#999" }}
                    >
                      <option value="">Select Country</option>
                      <option value="IN">India</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                  {[
                    { label: "State*", key: "state" },
                    { label: "City*", key: "city" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: "18px" }}>
                      <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>{f.label}</label>
                      <input
                        type="text"
                        value={shipping[f.key]}
                        onChange={e => setShipping({ ...shipping, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "10px 12px", fontSize: "14px", backgroundColor: "#fff" }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button className="update-btn" style={{ backgroundColor: "#c79a77", color: "#fff", border: "none", borderRadius: "50px", padding: "12px 32px", fontSize: "13px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                      UPDATE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={updateProfile}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: "700", marginBottom: "28px", color: "#1d1d1f" }}>
                  My Profile
                </h2>
                <div style={{ marginBottom: "20px", display: "flex", gap: "24px", alignItems: "center" }}>
                  {["Male", "Female"].map(s => (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="salutation"
                        value={s}
                        checked={profile.salutation === s}
                        onChange={() => setProfile({ ...profile, salutation: s })}
                        style={{ accentColor: "#c79a77", width: "16px", height: "16px" }}
                      />
                      {s}.
                    </label>
                  ))}
                </div>
                {[
                  { label: "Name*", key: "name", type: "text", disabled: false },
                  { label: "Email*", key: "email", type: "email", disabled: true },
                  { label: "Mobile Number*", key: "mobile", type: "text", disabled: false },
                  { label: "Address*", key: "address", type: "text", disabled: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "13px", color: "#333", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={profile[f.key]}
                      disabled={f.disabled}
                      onChange={e => !f.disabled && setProfile({ ...profile, [f.key]: e.target.value })}
                      style={{
                        width: "100%",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "12px 14px",
                        fontSize: "14px",
                        backgroundColor: f.disabled ? "#f5f5f5" : "#fff",
                        color: "#333",
                      }}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button className="update-btn" style={{ backgroundColor: "#c79a77", color: "#fff", border: "none", borderRadius: "50px", padding: "12px 32px", fontSize: "13px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                    UPDATE
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: "700", marginBottom: "28px", color: "#1d1d1f" }}>
                Change Password
              </h2>
              <form onSubmit={ changePassword }>
                <div style={{ border: "1px solid #e8e8e8", borderRadius: "4px", padding: "28px" }}>
                  {[
                    { label: "Current Password", key: "current" },
                    { label: "New Password", key: "newPass" },
                    { label: "Confirm Password", key: "confirm" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: "24px" }}>
                      <label style={{ fontSize: "14px", color: "#333", display: "block", marginBottom: "8px" }}>{f.label}</label>
                      <input
                        type="password"
                        value={passwords[f.key]}
                        onChange={e => setPasswords({ ...passwords, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1px solid #ddd", borderRadius: "4px", padding: "12px 14px", fontSize: "14px", backgroundColor: "#fff" }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button className="update-btn" style={{ backgroundColor: "#c79a77", color: "#fff", border: "none", borderRadius: "50px", padding: "12px 32px", fontSize: "13px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                    CHANGE PASSWORD
                  </button>
                </div>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}