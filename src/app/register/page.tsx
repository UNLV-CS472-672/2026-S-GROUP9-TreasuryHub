"use client"

import { useState } from "react"
import { signUp } from "./actions";
import BackButton from "@/components/BackButton";

type SkeletonPulseProps = { className?: string }
function SkeletonPulse({ className = "" }: SkeletonPulseProps) {
    return (
        <div className={`animate-pulse rounded bg-white/[0.15] ${className}`} />
    )
}


export default function RegistrationPage(){
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if(password !== confirmPassword) {
            setError("Passwords do not match")
            return;
        }

        setError(""); //clear previous errors
        setLoading(true);

        const result = await signUp(email, password, displayName);
        setLoading(false);

        // signUp returns { error: "..." if it failed}
        // If it succeeded, it redirects (so this code wont run)
        if(result?.error) {
            setError(result.error);
        }
    }

        if (loading) {
        return (
            <div>
                {/* inputs, buttons */}
                <div className="mt-5 flex items-center justify-center gap-4">
                    <SkeletonPulse className="h-10 w-36" />
                    <SkeletonPulse className="h-10 w-44" />
                    <SkeletonPulse className="h-10 w-36" />
                    <SkeletonPulse className="h-10 w-44" />

                    <SkeletonPulse className="h-10 w-24" />
                    <SkeletonPulse className="h-10 w-20" />
                </div>
            </div>
        );
    }
 
    return (
        <div>
            <div className="mt-5 flex items-center justify-center gap-4">
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border border-white rounded p-2 text-white bg-transparent"
                    placeholder="Display Name"
                />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-white rounded p-2 text-white bg-transparent"
                    placeholder="Email"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-white rounded p-2 text-white bg-transparent"
                    placeholder="Password"
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border border-white rounded p-2 text-white bg-transparent"
                    placeholder="confirmPassword"
                />
 
                <button
                    onClick={handleSubmit}
                    className="border border-white rounded p-2 text-white hover:bg-white/[0.1]"
                >
                    SUBMIT!
                </button>
 
                <BackButton />
            </div>
            <div className="flex items-center justify-center mb-3">
                {error && <p className="text-red-500">{error}</p>}
            </div>
        </div>
    );
}
