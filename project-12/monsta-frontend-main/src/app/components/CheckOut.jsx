"use client";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Cookies from 'js-cookie'
import { useRazorpay } from "react-razorpay";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import "../checkout/page.css";

// ---------------------------------------------------------------------------
// Reference-parity checkout validation.
//
// Rules and messages mirror the reference theme's '#checkout_address'
// BootstrapValidator config (public/frontend/js/custom.js). Request payload
// field names are deliberately UNCHANGED -- the backend order schema requires
// them exactly as they are posted today.
// ---------------------------------------------------------------------------

// The reference validates names/city/state with /^[a-z A-Z]+$/, which rejects
// hyphens, apostrophes, periods and non-ASCII letters. Relaxed here to accept a
// superset (any Unicode letter, plus space . ' -) so real names are not
// rejected -- never stricter than the reference.
const NAME_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;

// Same email pattern used by the login/register forms in this project.
const EMAIL_PATTERN = /^([\w+-]+(?:\.[\w+-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

const MOBILE_MIN_LENGTH = 10;
const MOBILE_MAX_LENGTH = 15;

// Per-field rule sets, keyed by input name so the render loop can look them up.
const CHECKOUT_FIELD_RULES = {
    // Reference: 'Name is required and cannot be empty' /
    // 'Name should only consist of alphabets'
    name: {
        requiredMessage: 'Name is required and cannot be empty',
        alphabetMessage: 'Name should only consist of alphabets',
    },
    // Reference: 'Mobile number is required and cannot be empty' /
    // 'Please enter valid mobile number'
    mobile_number: {
        requiredMessage: 'Mobile number is required and cannot be empty',
        mobileMessage: 'Please enter valid mobile number',
    },
    billing_name: {
        requiredMessage: 'Billing name is required and cannot be empty',
        alphabetMessage: 'Billing name should only consist of alphabets',
    },
    billing_email: {
        requiredMessage: 'Billing email address is required and cannot be empty',
        emailMessage: 'Please enter a valid billing email address',
    },
    billing_mobile_number: {
        requiredMessage: 'Billing mobile is required and cannot be empty',
        mobileMessage: 'Please enter valid billing mobile number',
    },
    billing_address: {
        requiredMessage: 'Billing address is required and cannot be empty',
    },
    // The reference message is 'Please select county.' -- a typo in the theme,
    // corrected to 'country' here.
    billing_country: {
        requiredMessage: 'Please select country.',
    },
    billing_state: {
        requiredMessage: 'Billing state is required and cannot be empty',
        alphabetMessage: 'Billing state should only consist of alphabets',
    },
    billing_city: {
        requiredMessage: 'Billing city is required and cannot be empty',
        alphabetMessage: 'Billing city should only consist of alphabets',
    },
    shipping_name: {
        requiredMessage: 'Shipping name is required and cannot be empty',
        alphabetMessage: 'Shipping name should only consist of alphabets',
    },
    shipping_email: {
        requiredMessage: 'Shipping email address is required and cannot be empty',
        emailMessage: 'Please enter a valid shipping email address',
    },
    shipping_mobile_number: {
        requiredMessage: 'Shipping mobile is required and cannot be empty',
        mobileMessage: 'Please enter valid shipping mobile number',
    },
    shipping_address: {
        requiredMessage: 'Shipping address is required and cannot be empty',
    },
    shipping_country: {
        requiredMessage: 'Please select country.',
    },
    shipping_state: {
        requiredMessage: 'Shipping state is required and cannot be empty',
        alphabetMessage: 'Shipping state should only consist of alphabets',
    },
    shipping_city: {
        requiredMessage: 'Shipping city is required and cannot be empty',
        alphabetMessage: 'Shipping city should only consist of alphabets',
    },
};

const BILLING_FIELD_NAMES = [
    'name', 'mobile_number', 'billing_name', 'billing_email',
    'billing_mobile_number', 'billing_address', 'billing_country',
    'billing_state', 'billing_city',
];

const SHIPPING_FIELD_NAMES = [
    'shipping_name', 'shipping_email', 'shipping_mobile_number',
    'shipping_address', 'shipping_country', 'shipping_state', 'shipping_city',
];

function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function validateField(fieldName, value) {
    const rule = CHECKOUT_FIELD_RULES[fieldName];

    if (!rule) {
        return '';
    }

    if (!hasText(value)) {
        return rule.requiredMessage;
    }

    const trimmed = value.trim();

    if (rule.alphabetMessage && !NAME_PATTERN.test(trimmed)) {
        return rule.alphabetMessage;
    }

    if (rule.mobileMessage && (trimmed.length < MOBILE_MIN_LENGTH || trimmed.length > MOBILE_MAX_LENGTH)) {
        return rule.mobileMessage;
    }

    if (rule.emailMessage && !EMAIL_PATTERN.test(trimmed)) {
        return rule.emailMessage;
    }

    return '';
}

// Validates the posted fields only. Shipping rules apply when the user opts to
// ship to a different address; otherwise shipping mirrors billing and is never
// read from the DOM.
function validateCheckoutFields(form, shipDifferent) {
    const errors = {};
    const fieldNames = shipDifferent
        ? BILLING_FIELD_NAMES.concat(SHIPPING_FIELD_NAMES)
        : BILLING_FIELD_NAMES;

    fieldNames.forEach((fieldName) => {
        const element = form.elements[fieldName];

        if (!element) {
            return;
        }

        const message = validateField(fieldName, element.value);

        if (message) {
            errors[fieldName] = message;
        }
    });

    return errors;
}

// Indian grouping for order amounts, e.g. 2300 -> "2,300".
function formatPrice(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

// localStorage key holding the snapshot of the last confirmed order. The
// /order-success page reads (and then clears) it, because the App Router cannot
// pass a complex object through router.push and the API has no "get order by
// id" endpoint to re-fetch from.
const LAST_ORDER_KEY = 'lastOrder';

export default function Checkout() {
    const { Razorpay } = useRazorpay();

    const navigate = useRouter();

    // Real cart data (single source of truth = CartContext).
    const { cart, getCartTotal, clearCart } = useCart();
    const totalAmount = getCartTotal();

    const [userProfile, setUserProfile] = useState('');

    useEffect(() => {
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}user/view-profile`, {}, {
            headers: {
                Authorization: `bearer ${Cookies.get('user_login')}`
            }
        })
            .then((result) => {
                if (result.data._status) {
                    setUserProfile(result.data._data);
                } else {
                    setUserProfile('');
                }
            })
            .catch(() => {
                toast.error('Something went wrong !')
            })
    }, [])

    // Holds the confirmed order details between placeOrder -> handlePayment ->
    // orderStatusChange, so the success redirect can render a full receipt
    // without re-fetching (the API has no "get order by id" endpoint).
    const pendingOrderRef = useRef(null);

    const [orderLoading, setOrderLoding] = useState(false);
    const [shipDifferent, setShipDifferent] = useState(false);

    // Field-level validation messages, keyed by input name.
    const [checkoutErrors, setCheckoutErrors] = useState({});

    // Form-level status text (API success or failure) -- the local equivalent of
    // the reference's '.placeOrderError' region shown next to the order button.
    const [placeOrderMessage, setPlaceOrderMessage] = useState(null);

    // Clears a field's message as soon as the user edits that field again.
    const checkoutFieldChanged = (event) => {
        const { name } = event.target;

        setCheckoutErrors((previous) => {
            if (!previous[name]) {
                return previous;
            }

            const next = { ...previous };
            delete next[name];
            return next;
        });
    };

    const placeOrder = (event) => {
        event.preventDefault();

        // Duplicate-submission guard: ignore further submits (clicks or
        // Enter) while an order/payment process is already in progress.
        // (State variable is `orderLoading`; the setter's spelling is legacy.)
        if (orderLoading) {
            return;
        }

        // Payment requires the public Razorpay Key ID from the environment.
        // No hardcoded fallback — fail fast with the project's toast pattern.
        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            toast.error('Payment is not configured. Please contact support.')
            return;
        }

        // Reference parity: validate before any request is made, so an invalid
        // form never reaches the API. Field messages render inline.
        const errors = validateCheckoutFields(event.target, shipDifferent);

        setCheckoutErrors(errors);
        setPlaceOrderMessage(null);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setOrderLoding(true);

        var billing_address = {
            name: event.target.billing_name.value,
            email: event.target.billing_email.value,
            mobile_number: event.target.billing_mobile_number.value,
            address: event.target.billing_address.value,
            country: event.target.billing_country.value,
            state: event.target.billing_state.value,
            city: event.target.billing_city.value,
        }

        if (shipDifferent) {
            var shipping_address = {
                name: event.target.shipping_name.value,
                email: event.target.shipping_email.value,
                mobile_number: event.target.shipping_mobile_number.value,
                address: event.target.shipping_address.value,
                country: event.target.shipping_country.value,
                state: event.target.shipping_state.value,
                city: event.target.shipping_city.value,
            }
        } else {
            var shipping_address = billing_address;
        }

        axios.post(`${process.env.NEXT_PUBLIC_API_URL}checkout/place-order`, {
            name: event.target.name.value,
            mobile_number: event.target.mobile_number.value,
            total_amount: totalAmount,
            discount_amount: 0,
            net_amount: totalAmount,
            order_note: event.target.order_notes.value,
            product_info: cart,
            billing_address: billing_address,
            shipping_address: shipping_address
        }, {
            headers: {
                Authorization: `bearer ${Cookies.get('user_login')}`
            }
        })
            .then((result) => {
                if (result.data._status) {
                    setPlaceOrderMessage({ text: result.data._message, type: 'success' });

                    // The saved order document returned by place-order carries the
                    // server-generated order_number, razorpay order_id and every
                    // amount. Snapshot it (plus the addresses) so the success page
                    // can render a receipt even though the cart is cleared.
                    const savedOrder = result.data._data || {};

                    pendingOrderRef.current = {
                        orderNumber: savedOrder.order_number || '',
                        razorpayOrderId: savedOrder.order_id || '',
                        name: savedOrder.name || billing_address.name,
                        mobileNumber: savedOrder.mobile_number || '',
                        email: billing_address.email,
                        billingAddress: billing_address,
                        shippingAddress: shipping_address,
                        orderNote: savedOrder.order_note || '',
                        totalAmount: savedOrder.total_amount ?? totalAmount,
                        discountAmount: savedOrder.discount_amount ?? 0,
                        netAmount: savedOrder.net_amount ?? totalAmount,
                        items: cart,
                        paymentMethod: 'Razorpay (Online)',
                    };

                    // Keep orderLoading=true through the Razorpay + order-status
                    // lifecycle; handlePayment/its callbacks reset it.
                    handlePayment(result.data._data)
                } else {
                    setOrderLoding(false);
                    setPlaceOrderMessage({ text: result.data._message, type: 'error' });
                    toast.error(result.data._message)
                }
            })
            .catch(() => {
                setOrderLoding(false);
                setPlaceOrderMessage({ text: 'Something went wrong !', type: 'error' });
                toast.error('Something went wrong !')
            })
    }


    const [orderNotes, setOrderNotes] = useState("");
    const [billing, setBilling] = useState({
        name: "", mobile: "", billingName: "", billingEmail: "",
        billingMobile: "", billingAddress: "", country: "", state: "", city: "",
    });
    const [shipping, setShipping] = useState({
        name: "", email: "", mobile: "", address: "", country: "", state: "", city: "",
    });

    // Empty-cart guard: render only the empty state — no form, no order
    // summary, and placeOrder/handlePayment can never be reached.
    if (cart.length === 0) {
        return (
            <div style={{ fontFamily: "'Rubik', sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh", paddingTop: "60px", paddingBottom: "60px" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
                    <div style={{ backgroundColor: "#fff", border: "1px solid #ebebeb", textAlign: "center", padding: "50px 20px" }}>
                        <p style={{ fontSize: "22px", fontWeight: 700, color: "#212121", marginBottom: "8px" }}>
                            Your cart is empty.
                        </p>
                        <p style={{ fontSize: "13px", color: "#5a5a5a", marginBottom: "24px" }}>
                            You cannot proceed to checkout without any products.
                        </p>
                        <Link
                            href="/shop"
                            style={{ display: "inline-block", backgroundColor: "#c09578", color: "#fff", padding: "11px 24px", fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px", borderRadius: "4px", textDecoration: "none" }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handlePayment = (orderInfo) => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderInfo.net_amount * 100, // Amount in paise
            currency: "INR",
            name: "Online Furniture",
            description: "Order Payment",
            order_id: orderInfo.order_id, // Generate order_id on server
            handler: (response) => {
                orderStatusChange(response.razorpay_payment_id, response.razorpay_order_id)
            },
            // User closed the payment modal without completing payment.
            // Cart stays intact; the checkout button is already re-enabled
            // so the user can retry payment for the same order.
            modal: {
                ondismiss: () => {
                    // User cancelled — re-enable the button so they can retry.
                    setOrderLoding(false);
                    setPlaceOrderMessage({ text: 'Payment was cancelled. You can try again.', type: 'error' });
                    toast.info('Payment was cancelled. You can try again.')
                },
            },
            prefill: {
                name: userProfile.name,
                email: userProfile.email,
                contact: userProfile.mobile_number,
            },
            theme: {
                color: "#F37254",
            },
        };

        const razorpayInstance = new Razorpay(options);

        razorpayInstance.on("payment.failed", function (response) {
            // Payment failed — keep the user on checkout with a clear
            // message and a retry path. The backend is still notified via
            // orderStatusChange (unchanged), and the cart is NOT cleared.
            setOrderLoding(false);
            setPlaceOrderMessage({ text: 'Payment failed. Please try again.', type: 'error' });
            toast.error('Payment failed. Please try again.')
            // Some Razorpay failure modes (e.g. JS-level failures with no
            // payment attempt) carry no payment_id. Only notify the backend
            // when a real payment id exists, to avoid a meaningless
            // order-status request that would just add a second error toast.
            const failedPaymentId = response.error?.metadata?.payment_id;
            const failedOrderId = response.error?.metadata?.order_id;
            if (failedPaymentId) {
                orderStatusChange(failedPaymentId, failedOrderId)
            }
        });

        razorpayInstance.open();
    };

    const orderStatusChange = (payment_id, order_id) => {
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}checkout/order-status`, {
            payment_id: payment_id,
            order_id: order_id,
        }, {
            headers: {
                Authorization: `Bearer ${Cookies.get('user_login')}`
            }
        })
            .then((result) => {
                if (result.data._status) {
                    if (result.data._payment_status) {
                        // Payment verified by the backend — safe to empty the
                        // cart now, before navigating away. orderLoading stays
                        // true until the redirect; the component unmounts.
                        // Silent: checkout shows its own order-success toast.
                        clearCart({ silent: true });

                        // The confirmed order snapshot was captured in placeOrder
                        // (place-order returns the saved document, which is the
                        // only response carrying order_number/amounts). Persist it
                        // for the receipt page, which cannot re-fetch because the
                        // API exposes no "get order by id" endpoint. The orderId
                        // query param is the durable, shareable handle.
                        const pending = pendingOrderRef.current || {};
                        const orderNumber = pending.orderNumber || '';

                        try {
                            window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({
                                ...pending,
                                // Fall back to the Razorpay order id if the document
                                // somehow had no order_number, so the param is never
                                // "undefined" in the URL.
                                orderNumber: orderNumber || order_id,
                                paymentId: payment_id,
                            }));
                        } catch {
                            // Storage unavailable (private mode / quota) — the
                            // receipt page falls back to its "no recent order"
                            // state; the order itself is already saved server-side.
                        }

                        toast.success(result.data._message)

                        // router.push, not replace: Back should return to the cart
                        // rather than looping onto this one-time receipt page.
                        navigate.push(
                            `/order-success?orderId=${encodeURIComponent(orderNumber || order_id || '')}`
                        )
                    } else {
                        setOrderLoding(false);
                        toast.error(result.data._message)
                    }
                } else {
                    setOrderLoding(false);
                    toast.error(result.data._message)
                }
            })
            .catch(() => {
                setOrderLoding(false);
                toast.error('Something went wrong !')
            })
    }

    return (
        <div>
            {/* Breadcrumb -- theme block, identical to the cart page */}
            <section className="breadcrumbs_area">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="breadcrumb_content">
                                <h3>Checkout</h3>
                                <ul>
                                    <li><Link href="/">home</Link></li>
                                    <li>&gt;</li>
                                    <li>Checkout</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="checkout_form_area">
                <div className="container">
                    <form id="checkout_address" onSubmit={placeOrder} noValidate>
                        <div className="row">

                            {/* Billing Details */}
                            <div className="col-lg-6 col-md-12">
                                <div className="checkout_form">
                                    <h3>Billing Details</h3>

                                    <div className="checkout_info">

                        {/* Row: Name + Mobile */}
                        <div className="checkout_row">
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Name*</label>
                                <input type="text" name="name" defaultValue={userProfile.name} style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="name" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Mobile Number*</label>
                                <input type="text" name="mobile_number" defaultValue={userProfile.mobile_number} style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="mobile_number" />
                            </div>
                        </div>

                        {/* Row: Billing Name + Billing Email */}
                        <div className="checkout_row">
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Billing Name*</label>
                                <input type="text" name="billing_name" style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="billing_name" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Billing Email*</label>
                                <input type="email" name="billing_email" style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="billing_email" />
                            </div>
                        </div>

                        {/* Billing Mobile Number */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Billing Mobile Number*</label>
                            <input type="text" name="billing_mobile_number" style={inputStyle} onChange={checkoutFieldChanged} />
                            <FieldMessage errors={checkoutErrors} name="billing_mobile_number" />
                        </div>

                        {/* Billing Address */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Billing Address*</label>
                            <input type="text" name="billing_address" style={inputStyle} onChange={checkoutFieldChanged} />
                            <FieldMessage errors={checkoutErrors} name="billing_address" />
                        </div>

                        {/* Country */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Country*</label>
                            <select name="billing_country" style={{ ...inputStyle, color: billing.country ? "#333" : "#999" }} onChange={checkoutFieldChanged}>
                                <option value="">Select Country</option>
                                <option value="IN">India</option>
                                <option value="US">United States</option>
                            </select>
                            <FieldMessage errors={checkoutErrors} name="billing_country" />
                        </div>

                        {/* State + City */}
                        <div className="checkout_row" style={{ marginBottom: "20px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>State*</label>
                                <input type="text" name="billing_state" style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="billing_state" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>City*</label>
                                <input type="text" name="billing_city" style={inputStyle} onChange={checkoutFieldChanged} />
                                <FieldMessage errors={checkoutErrors} name="billing_city" />
                            </div>
                        </div>

                        {/* Ship to Different Address */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <input
                                type="checkbox"
                                id="shipDiff"
                                checked={shipDifferent}
                                onChange={e => setShipDifferent(e.target.checked)}
                                style={{ width: "14px", height: "14px", accentColor: "#c09578" }}
                            />
                            <label htmlFor="shipDiff" style={{ backgroundColor: "#212121", color: "#fff", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                                Ship To A Different Address?
                            </label>
                        </div>

                        {/* Ship to Different Address Fields */}
                        {shipDifferent && (
                            <div style={{ marginBottom: "20px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "4px", backgroundColor: "#fff" }}>
                                <div className="checkout_row" style={{ marginBottom: "14px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Shipping Name*</label>
                                        <input type="text" name="shipping_name" style={inputStyle} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Shipping Email*</label>
                                        <input type="email" name="shipping_email" style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: "14px" }}>
                                    <label style={labelStyle}>Shipping Mobile Number*</label>
                                    <input type="text" name="shipping_mobile_number" style={inputStyle} onChange={checkoutFieldChanged} />
                                    <FieldMessage errors={checkoutErrors} name="shipping_mobile_number" />
                                </div>
                                <div style={{ marginBottom: "14px" }}>
                                    <label style={labelStyle}>Shipping Address*</label>
                                    <input type="text" name="shipping_address" style={inputStyle} onChange={checkoutFieldChanged} />
                                    <FieldMessage errors={checkoutErrors} name="shipping_address" />
                                </div>
                                <div style={{ marginBottom: "14px" }}>
                                    <label style={labelStyle}>Country*</label>
                                    <select name="shipping_country" style={{ ...inputStyle, color: shipping.country ? "#333" : "#999" }} onChange={checkoutFieldChanged}>
                                        <option value="">Select Country</option>
                                        <option value="IN">India</option>
                                        <option value="US">United States</option>
                                    </select>
                                    <FieldMessage errors={checkoutErrors} name="shipping_country" />
                                </div>
                                <div className="checkout_row" style={{ marginBottom: 0 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>State*</label>
                                        <input type="text" name="shipping_state" style={inputStyle} onChange={checkoutFieldChanged} />
                                        <FieldMessage errors={checkoutErrors} name="shipping_state" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>City*</label>
                                        <input type="text" name="shipping_city" style={inputStyle} onChange={checkoutFieldChanged} />
                                        <FieldMessage errors={checkoutErrors} name="shipping_city" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Notes (theme block) */}
                        <div className="order-notes">
                            <label style={labelStyle}>Order Notes</label>
                            <textarea
                                value={orderNotes}
                                name="order_notes"
                                onChange={e => setOrderNotes(e.target.value)}
                                placeholder="Notes about your order, e.g. special notes for delivery."
                                rows={4}
                                style={{ ...inputStyle, resize: "vertical", height: "90px", paddingTop: "10px" }}
                            />
                        </div>

                                    </div>{/* /.checkout_info */}
                                </div>{/* /.checkout_form */}
                            </div>{/* /.col-lg-6 */}

                    {/* RIGHT: Your Order */}
                    <div className="col-lg-6 col-md-12" style={{ flex: 1, minWidth: 0 }}>

                        {/* YOUR ORDER Header (theme bar) */}
                        <div className="checkout_form">
                            <h3>Your Order</h3>
                        </div>

                        {/* Order summary (theme .order_table) */}
                        <div className="order_table" style={{ backgroundColor: "#fff", border: "1px solid #ebebeb" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ebebeb" }}>
                                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#212121", textAlign: "center", borderRight: "1px solid #ebebeb" }}>Product</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#212121", textAlign: "center", borderRight: "1px solid #ebebeb" }}>Qty</th>
                                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#212121", textAlign: "center" }}>Total</th>
                                </tr>
                            </thead>
                            {
                                cart.map((v) => {
                                    return (
                                        <thead key={v._id}>
                                            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                <th style={{ padding: "12px 16px", fontWeight: "500", color: "#5a5a5a", textAlign: "center", borderRight: "1px solid #ebebeb" }}>{v.name}</th>
                                                <th style={{ padding: "12px 16px", fontWeight: "500", color: "#5a5a5a", textAlign: "center", borderRight: "1px solid #ebebeb" }}>{v.quantity}</th>
                                                <th style={{ padding: "12px 16px", fontWeight: "500", color: "#5a5a5a", textAlign: "center" }}>{v.quantity * v.price}</th>
                                            </tr>
                                        </thead>
                                    )
                                })
                            }
                            <tbody>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#5a5a5a", fontWeight: "500", borderRight: "1px solid #ebebeb" }}>Cart Subtotal</td>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#c09578", fontWeight: "500" }}>Rs. {totalAmount}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#5a5a5a", fontWeight: "500", borderRight: "1px solid #ebebeb" }}>Discount (-)</td>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#c09578", fontWeight: "500" }}>Rs. 0</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#212121", fontWeight: "600", borderRight: "1px solid #ebebeb" }}>Order Total</td>
                                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#c09578", fontWeight: "600" }}>Rs. {totalAmount}</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>

                        {/* API success/failure status -- the local equivalent of the
                            reference's '.placeOrderError' region (shows both success
                            and failure messages inline, near the button). */}
                        {placeOrderMessage && (
                            <p
                                role="status"
                                style={{
                                    margin: "12px 0 0",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    color: placeOrderMessage.type === "success" ? "#2e7d32" : "#c0392b",
                                    textAlign: "right",
                                }}
                            >
                                {placeOrderMessage.text}
                            </p>
                        )}

                        {/* Place Order Button (theme .order_button + .checkout_btn) */}
                        <div className="order_button checkout_btn" style={{ marginTop: "20px" }}>
                            <button
                                disabled={orderLoading}
                            >
                                {orderLoading ? 'Loading....' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
                </div>{/* /.container */}
            </section>{/* /.checkout_form_area */}
        </div>
    );
}

// Shared styles (theme-aligned: Rubik typography, #c09578 accent, #212121 bars)
const labelStyle = {
    fontSize: "12px",
    color: "#5a5a5a",
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
};

const inputStyle = {
    width: "100%",
    border: "1px solid #ebebeb",
    borderRadius: "3px",
    padding: "8px 10px",
    fontSize: "13px",
    backgroundColor: "#fff",
    color: "#333",
    fontFamily: "'Rubik', sans-serif",
};

// Inline field-level validation message (the local equivalent of the
// reference's BootstrapValidator .help-block, shown under each field).
const fieldErrorStyle = {
    display: "block",
    color: "#c0392b",
    fontSize: "11px",
    marginTop: "4px",
};

function FieldMessage({ errors, name }) {
    const message = errors ? errors[name] : null;

    if (!message) {
        return null;
    }

    return (
        <span className="help-block" style={fieldErrorStyle} role="alert">
            {message}
        </span>
    );
}