import React, { useState, useEffect } from "react";

interface LargeCodeModalProps {
  fileUrl: string;
  open: boolean;
  onClose: () => void;
}

const LargeCodeModal: React.FC<LargeCodeModalProps> = ({ fileUrl, open, onClose }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(fileUrl)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch file");
        return res.text();
      })
      .then(setCode)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [fileUrl, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-[scaleIn_0.2s_ease-out]">
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto max-h-[70vh] whitespace-pre-wrap">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
};

export default LargeCodeModal;
