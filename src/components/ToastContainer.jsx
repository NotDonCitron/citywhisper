import React, { useState, useEffect, useCallback } from 'react';

const TOAST_DURATION = 4000;

let addToastGlobal = null;

/**
 * Call this from anywhere to show a toast.
 * @param {string} message
 * @param {'error'|'info'|'success'} type
 */
export const showToast = (message, type = 'error') => {
  if (addToastGlobal) {
    addToastGlobal({ message, type, id: Date.now() });
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, TOAST_DURATION);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const colorMap = {
    error: 'bg-red-500/90 border-red-400/50',
    info: 'bg-sky-500/90 border-sky-400/50',
    success: 'bg-emerald-500/90 border-emerald-400/50'
  };

  return (
    <div className="fixed top-16 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${colorMap[toast.type] || colorMap.error} backdrop-blur-md text-white text-sm font-medium px-4 py-3 rounded-2xl border shadow-lg animate-slide-down pointer-events-auto`}
          onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
