"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";

export default function ForgotPassword() {

    const [isLoding, setIsLoding] = useState(false);

    const forgotPassword = (e) => {
        e.preventDefault();
        setIsLoding(true);

        axios.post(`${process.env.NEXT_PUBLIC_API_URL}user/forgot-password`, e.target)
            .then((result) => {
                if (result.data._status == true) {
                    toast.success('Reset link sent to your email', { toastId: 'auth-forgot-success' })
                    e.target.reset();
                } else {
                    toast.error(result.data._message, { toastId: 'auth-forgot-error' });
                }
                setIsLoding(false);
            })
            .catch(() => {
                setIsLoding(false);
                toast.error('Somthing went Wrong!', { toastId: 'auth-forgot-error' })
            })
    }

    return (
        <div className="bg-white min-h-screen">

            {/* Banner Section */}
            <section className="text-center py-10 border-b border-gray-200">

                <h1 className="text-[52px] font-semibold text-[#222] md:text-[40px] sm:text-[32px]">
                    Forgot Password
                </h1>

                <p className="mt-3 text-[16px]">
                    <span className="text-black">Home</span>

                    <span className="mx-2 text-[#c89b73]">&gt;</span>

                    <span className="text-[#c89b73]">
                        Forgot Password
                    </span>
                </p>

            </section>

            {/* Form Section */}
            <section className="max-w-[1320px] mx-auto px-6 py-16 sm:py-10 px-4 sm:px-6">

                <h2 className="text-[45px] text-[#222] mb-8 sm:text-[30px] sm:mb-6">
                    Forgot Password
                </h2>

                <div className="border border-gray-200 p-8 sm:p-6">
                    <form onSubmit={ forgotPassword }>
                        <label className="block text-[18px] mb-3 font-medium sm:text-[16px]">
                            Email
                        </label>

                        <input
                            type="email"
                            name = "email"
                            placeholder="Email Address"
                            className="w-full border border-gray-200 px-5 py-3 outline-none mb-6 sm:px-4 sm:py-2.5"
                        />

                        <button
                            className="
                            bg-[#c89b73]
                            text-white
                            px-8
                            py-3
                            rounded-full
                            font-semibold
                            hover:bg-black
                            duration-300
                            sm:px-6 sm:py-2.5
                            "
                            disabled={isLoding ? 'disabled' : ''}
                        >
                            {
                                isLoding ? 'Loding....' : 'GET MAIL'
                            }
                        </button>
                    </form>

                </div>

            </section>

        </div>
    );
}