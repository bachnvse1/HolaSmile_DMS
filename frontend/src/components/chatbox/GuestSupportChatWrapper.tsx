import { useState } from "react";
import GuestSupportChatBox from "./GuestSupportChatBox";

export default function GuestSupportChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 96,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            padding: "12px 20px",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          💬 Tư vấn chat
        </button>
      )}

      {isOpen && (
        <GuestSupportChatBox onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
