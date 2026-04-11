"use client"

import { useState } from "react"
import { signUp } from "./actions";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/Skeleton";

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

    // I can't really test this since it loads instantly for me
    if (loading) {
        return (
            <div>
                <div className="mt-5 flex items-center justify-center gap-4">
                    <Skeleton width={150} height={38} rounded="sm" />
                    <Skeleton width={180} height={38} rounded="sm" />
                    <Skeleton width={150} height={38} rounded="sm" />
                    <Skeleton width={150} height={38} rounded="sm" />
                    <Skeleton width={80} height={38} rounded="sm" />
                    <Skeleton width={80} height={38} rounded="sm" />
                </div>
            </div>
        );
    }

    return(
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

                <button onClick={handleSubmit} className="border border-white rounded p-2 text-white hover:bg-white/[0.1]">
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
