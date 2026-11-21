"use client";
import { login, register } from "@/ReduxToolkit/LoginSlice";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import "./Login-Register.css";

// ---------------------------------------------------------------------------
// Reference-parity validation (Phase 1: UI/validation layer only).
//
// The messages and rules below come from the reference site's
// BootstrapValidator config (public/frontend/js/custom.js on
// wscubetech.co/Assignments/furniture) so the wording matches it exactly.
//
// The reference email regexp is lowercase-only and rejects "+" tags. It is used
// here with two deliberate *relaxations* (never tightenings), so an address a
// user could legitimately own is not rejected:
//   - the `i` flag, so an uppercase address is accepted
//   - `\+` in the local part, so plus-addressed mailboxes still work
const EMAIL_PATTERN = /^([\w+-]+(?:\.[\w+-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

const EMAIL_REQUIRED_MESSAGE = 'Email address is required and cannot be empty';
const EMAIL_INVALID_MESSAGE = 'Please enter a valid email address';
const PASSWORD_REQUIRED_MESSAGE = 'Password is required and cannot be empty';
const PASSWORD_MIN_LENGTH_MESSAGE = 'Password must have at least 8 characters';

const EMAIL_INPUT_NAME = 'email';
const PASSWORD_INPUT_NAME = 'password';

// The reference marks these inputs with `.spaceValidation`.
const SPACE_FREE_INPUT_NAMES = [EMAIL_INPUT_NAME, PASSWORD_INPUT_NAME];

const REGISTER_PASSWORD_MIN_LENGTH = 8;

// Existing copy, kept verbatim in this phase (copy cleanup is a later phase).
const GENERIC_ERROR_MESSAGE = 'Somthing went Wrong!';

function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

// Inputs stay uncontrolled, so the values are read from the form element that
// is still posted as-is (the request payload is unchanged).
function readCredentials(form) {
    return {
        [EMAIL_INPUT_NAME]: form.elements[EMAIL_INPUT_NAME].value,
        [PASSWORD_INPUT_NAME]: form.elements[PASSWORD_INPUT_NAME].value,
    };
}

// Required + email format checks, shared by both forms.
function validateCredentials(values) {
    const errors = {};

    if (!hasText(values[EMAIL_INPUT_NAME])) {
        errors[EMAIL_INPUT_NAME] = EMAIL_REQUIRED_MESSAGE;
    } else if (!EMAIL_PATTERN.test(values[EMAIL_INPUT_NAME])) {
        errors[EMAIL_INPUT_NAME] = EMAIL_INVALID_MESSAGE;
    }

    if (!hasText(values[PASSWORD_INPUT_NAME])) {
        errors[PASSWORD_INPUT_NAME] = PASSWORD_REQUIRED_MESSAGE;
    }

    return errors;
}

// Register matches the reference exactly: the same email/required rules plus an
// 8-character minimum. Login intentionally keeps "not empty" only, which is
// also what the reference does.
function validateRegistration(values) {
    const errors = validateCredentials(values);

    if (!errors[PASSWORD_INPUT_NAME] && values[PASSWORD_INPUT_NAME].length < REGISTER_PASSWORD_MIN_LENGTH) {
        errors[PASSWORD_INPUT_NAME] = PASSWORD_MIN_LENGTH_MESSAGE;
    }

    return errors;
}

// Inline message rendered directly under its field.
function FieldError({ message }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-2 text-[16px] text-[#d9534f]">
            {message}
        </p>
    );
}

// Form-level status line: the local equivalent of the reference's `.loginError`
// / `.registerError` regions, which display API success *and* failure text in
// the same place, above the form.
function FormMessage({ message }) {
    if (!message || !message.text) {
        return null;
    }

    return (
        <p className={`mb-5 text-[16px] ${message.type === 'success' ? 'text-[#5cb85c]' : 'text-[#d9534f]'}`}>
            {message.text}
        </p>
    );
}

export default function LoginRegister() {
    const router = useRouter();

    const dispatach = useDispatch();
    const [loginProcessing, setLoginProcessing] = useState(false);
    const [registerProcessing, setRegisterProcessing] = useState(false);

    // Per-field validation messages, keyed by input name.
    const [loginErrors, setLoginErrors] = useState({});
    const [registerErrors, setRegisterErrors] = useState({});

    // Form-level status text (API success or failure), one region per form.
    const [loginMessage, setLoginMessage] = useState(null);
    const [registerMessage, setRegisterMessage] = useState(null);


    const loginHandler = (e) => {
        e.preventDefault();

        const form = e.target;
        const errors = validateCredentials(readCredentials(form));

        setLoginErrors(errors);
        setLoginMessage(null);

        // An invalid form never reaches the API.
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoginProcessing(true);

        axios.post(`${process.env.NEXT_PUBLIC_API_URL}user/login`, form)
            .then((result) => {
                if (result.data._status == true) {
                    setLoginMessage({
                        text: result.data._message || 'login succussfully.',
                        type: 'success',
                    });
                    dispatach(login(result.data._token));
                    toast.success('Welcome back!', { toastId: 'auth-login-success' })
                    router.push('/my-dashboard');
                } else {
                    setLoginMessage({ text: result.data._message, type: 'error' });
                    toast.error(result.data._message || 'Invalid email or password', { toastId: 'auth-login-error' });
                }
                setLoginProcessing(false);
            })
            .catch(() => {
                setLoginProcessing(false);
                setLoginMessage({ text: GENERIC_ERROR_MESSAGE, type: 'error' });
                toast.error(GENERIC_ERROR_MESSAGE, { toastId: 'auth-login-error' })
            })
    }

    const registerHandler = (e) => {
        e.preventDefault();

        const form = e.target;
        const errors = validateRegistration(readCredentials(form));

        setRegisterErrors(errors);
        setRegisterMessage(null);

        // An invalid form never reaches the API.
        if (Object.keys(errors).length > 0) {
            return;
        }

        setRegisterProcessing(true);

        axios.post(`${process.env.NEXT_PUBLIC_API_URL}user/register`, form)
            .then((result) => {
                if (result.data._status == true) {
                    setRegisterMessage({
                        text: result.data._message || 'Register succussfully.',
                        type: 'success',
                    });
                    dispatach(register(result.data._token));
                    toast.success('Account created! Please login.', { toastId: 'auth-register-success' })
                    router.push('/my-dashboard');
                } else {
                    setRegisterMessage({ text: result.data._message, type: 'error' });
                    toast.error(result.data._message, { toastId: 'auth-register-error' });
                }
                setRegisterProcessing(false);
            })
            .catch(() => {
                setRegisterProcessing(false);
                setRegisterMessage({ text: GENERIC_ERROR_MESSAGE, type: 'error' });
                toast.error(GENERIC_ERROR_MESSAGE, { toastId: 'auth-register-error' })
            })
    }

    // Shared field handler: keeps spaces out of the fields the reference marks
    // `.spaceValidation`, and clears that field's message as soon as the user
    // starts editing it again.
    const buildFieldChangeHandler = (setErrors) => (e) => {
        const { name, value } = e.target;

        if (SPACE_FREE_INPUT_NAMES.includes(name)) {
            const stripped = value.replace(/\s/g, '');

            if (stripped !== value) {
                // Uncontrolled input: update the DOM value directly so what gets
                // posted stays in sync with the stripped value.
                e.target.value = stripped;
            }
        }

        setErrors((previous) => {
            if (!previous[name]) {
                return previous;
            }

            const next = { ...previous };
            delete next[name];
            return next;
        });
    };

    const loginFieldChanged = buildFieldChangeHandler(setLoginErrors);
    const registerFieldChanged = buildFieldChangeHandler(setRegisterErrors);

    // The reference discards the space key on `.spaceValidation` inputs.
    const blockSpaceKey = (e) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
        }
    };

    return (
        <div className="login_register_page bg-white min-h-screen">

            {/* Title Section */}
            <section className="text-center py-10 border-b border-gray-200">
                <h1 className="text-[72px] font-serif font-semibold text-[#222]">
                    My Account
                </h1>

                <p className="mt-3 text-[18px]">
                    <span className="text-black">Home</span>
                    <span className="mx-2 text-[#c89b73]">&gt;</span>
                    <span className="text-[#c89b73]">My Account</span>
                </p>
            </section>

            {/* Login / Register */}
            <section className="max-w-[1320px] mx-auto px-6 py-16">

                <div className="grid md:grid-cols-2 gap-8">

                    {/* Login */}
                    <div>
                        <h2 className="text-[58px] font-serif text-[#222] mb-8">
                            Login
                        </h2>
                        <FormMessage message={loginMessage} />
                        <form onSubmit={loginHandler} noValidate>
                            <div className="border border-gray-200 p-7 rounded-sm">

                                <div className="mb-8">
                                    <label className="block mb-3 text-[18px] font-medium">
                                        Email *
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        required
                                        aria-invalid={Boolean(loginErrors.email)}
                                        onChange={loginFieldChanged}
                                        onKeyDown={blockSpaceKey}
                                        className="w-full border border-gray-200 px-6 py-4 outline-none"
                                    />

                                    <FieldError message={loginErrors.email} />
                                </div>

                                <div>
                                    <label className="block mb-3 text-[18px] font-medium">
                                        Password *
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        required
                                        aria-invalid={Boolean(loginErrors.password)}
                                        onChange={loginFieldChanged}
                                        onKeyDown={blockSpaceKey}
                                        className="w-full border border-gray-200 px-6 py-4 outline-none"
                                    />

                                    <FieldError message={loginErrors.password} />
                                </div>

                                <div className="flex justify-between items-center mt-8">

                                    <Link
                                        href="/forgot-password"
                                        className="text-[#c89b73] text-[16px]"
                                    >
                                        Lost your password?
                                    </Link>

                                    <button className="bg-[#c89b73] px-10 py-3 rounded-full text-white font-semibold hover:bg-black duration-300" disabled={loginProcessing ? 'disabled' : ''} >
                                        {loginProcessing ? 'Loading....' : 'LOGIN'}
                                    </button>

                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Register */}
                    <div>
                        <h2 className="text-[58px] font-serif text-[#222] mb-8">
                            Register
                        </h2>

                        <FormMessage message={registerMessage} />
                        <form onSubmit={registerHandler} noValidate>
                            <div className="border border-gray-200 p-7 rounded-sm">

                                <div className="mb-8">
                                    <label className="block mb-3 text-[18px] font-medium">
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Name"
                                        className="w-full border border-gray-200 px-6 py-4 outline-none"
                                    />
                                </div>

                                <div className="mb-8">
                                    <label className="block mb-3 text-[18px] font-medium">
                                        Email Address *
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        required
                                        aria-invalid={Boolean(registerErrors.email)}
                                        onChange={registerFieldChanged}
                                        onKeyDown={blockSpaceKey}
                                        className="w-full border border-gray-200 px-6 py-4 outline-none"
                                    />

                                    <FieldError message={registerErrors.email} />
                                </div>

                                <div>
                                    <label className="block mb-3 text-[18px] font-medium">
                                        Password *
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        required
                                        aria-invalid={Boolean(registerErrors.password)}
                                        onChange={registerFieldChanged}
                                        onKeyDown={blockSpaceKey}
                                        className="w-full border border-gray-200 px-6 py-4 outline-none"
                                    />

                                    <FieldError message={registerErrors.password} />
                                </div>

                                <div className="flex justify-end mt-8">

                                    <button className="bg-[#c89b73] px-10 py-3 rounded-full text-white font-semibold hover:bg-black duration-300" disabled={registerProcessing ? 'disabled' : ''}>
                                        {registerProcessing ? 'Loading....' : 'REGISTER'}
                                    </button>

                                </div>
                            </div>
                        </form>
                    </div>

                </div>

            </section>

        </div>
    );
}