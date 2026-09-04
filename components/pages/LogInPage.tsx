"use client";

import {  useState } from "react";


function EyeIcon({ hidden }: { hidden: boolean }) {
    return hidden ? (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.1 0 8.7 3.7 10 7- .4 1.1-1.1 2.3-2.1 3.3M6.1 6.1C4.1 7.4 2.7 9.3 2 12c1.3 3.3 4.9 7 10 7 1 0 2-.2 2.9-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
    ) : (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

export default function LogInPage() {
    const [showPassword, setShowPassword] = useState(false);

    function handleSubmit() {
        event.preventDefault();
    }

    return (
        <section className="w-full max-w-100.5 text-[#123a3c]">
            <header className="mb-8 text-center">
                <h1 className="text-[21px] font-medium tracking-[-0.02em]">Welcome Back!</h1>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block text-[12px] font-medium">
                    <span>Email Address <span className="text-[#168aa0]">*</span></span>
                    <span className="mt-1.5 flex h-12 items-center gap-2 rounded-[9px] border border-[#e3e3e3] px-2.5 text-[#9ca3a3] shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-[#55aeb5]">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.7" width="20" x="2" y="4" />
                            <path d="m3 6 9 7 9-7" stroke="currentColor" strokeWidth="1.7" />
                        </svg>
                        <input aria-label="Email Address" className="min-w-0 flex-1 bg-transparent text-[12px] text-[#123a3c] outline-none placeholder:text-[#9ca3a3]" placeholder="Enter your email address" required type="email" />
                    </span>
                </label>

                <label className="block text-[12px] font-medium">
                    <span>Password <span className="text-[#168aa0]">*</span></span>
                    <span className="mt-1.5 flex h-12 items-center gap-2 rounded-[9px] border border-[#e3e3e3] px-2.5 text-[#9ca3a3] shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-[#55aeb5]">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.7" width="16" x="4" y="10" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
                        </svg>
                        <input aria-label="Password" className="min-w-0 flex-1 bg-transparent text-[12px] text-[#123a3c] outline-none placeholder:text-[#9ca3a3]" placeholder="Enter your password" required type={showPassword ? "text" : "password"} />
                        <button aria-label={showPassword ? "Hide password" : "Show password"} className="shrink-0" onClick={() => setShowPassword((visible) => !visible)} type="button">
                            <EyeIcon hidden={showPassword} />
                        </button>
                    </span>
                </label>

                <button className="h-10 w-full rounded-[9px] bg-[#1595a0] text-[13px] font-medium text-white shadow-[0_2px_4px_rgba(21,149,160,0.2)] transition-colors hover:bg-[#117f89]" type="submit">
                    Log In
                </button>
            </form>
        </section>
    );
}
