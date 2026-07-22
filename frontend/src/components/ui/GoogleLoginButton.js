"use client";
import React, { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function GoogleLoginButton() {
  const { login } = useAuth();
  const buttonRef = useRef(null);

  useEffect(() => {
    // If the script is not yet loaded, we check periodically
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "789647239255-placeholder.apps.googleusercontent.com",
          callback: async (response) => {
            await login(response.credential);
          },
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "filled_blue",
            size: "medium",
            shape: "pill",
            text: "signin_with",
          });
        }
      }
    };

    // Try initializing immediately
    initializeGoogleSignIn();

    // Set up a listener/poller in case script loads after mounting
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [login]);

  return (
    <div className="flex justify-center items-center">
      {/* Script loading script falls back to layout, but button mounts here */}
      <div ref={buttonRef} id="google-signin-button"></div>
    </div>
  );
}
