import React, { useEffect, useState } from "react";
import { NOTIFICATION_EVENT } from "../../utils/notification.js";
import "./SystemNotification.css";

const TITLES = {
  success: "Thành công",
  error: "Có lỗi xảy ra",
  warning: "Cần kiểm tra",
  info: "Thông báo",
};

const ICONS = { success: "✓", error: "!", warning: "!", info: "i" };

export default function SystemNotification() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const timers = new Map();
    const handleNotification = (event) => {
      const payload = event.detail;
      if (payload.kind === "confirm") {
        setDialog(payload);
        return;
      }

      setToasts((current) => [...current.slice(-3), payload]);
      if (payload.duration > 0) {
        const timer = window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== payload.id));
          timers.delete(payload.id);
        }, payload.duration);
        timers.set(payload.id, timer);
      }
    };

    window.addEventListener(NOTIFICATION_EVENT, handleNotification);
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        dialog.resolve(false);
        setDialog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  const finishDialog = (accepted) => {
    dialog?.resolve(accepted);
    setDialog(null);
  };

  return (
    <>
      <div className="system-toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`system-toast system-toast--${toast.type}`} key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
            <span className="system-toast__icon" aria-hidden="true">{ICONS[toast.type] || ICONS.info}</span>
            <div className="system-toast__content">
              <strong>{toast.title || TITLES[toast.type] || TITLES.info}</strong>
              <span>{toast.message}</span>
            </div>
            <button type="button" className="system-toast__close" onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">×</button>
            {toast.duration > 0 && <span className="system-toast__progress" style={{ animationDuration: `${toast.duration}ms` }} aria-hidden="true" />}
          </div>
        ))}
      </div>

      {dialog && (
        <div className="system-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) finishDialog(false);
        }}>
          <section className="system-dialog" role="alertdialog" aria-modal="true" aria-labelledby="system-dialog-title" aria-describedby="system-dialog-message">
            <div className={`system-dialog__icon ${dialog.danger ? "is-danger" : ""}`} aria-hidden="true">!</div>
            <div className="system-dialog__body">
              <h3 id="system-dialog-title">{dialog.title}</h3>
              <p id="system-dialog-message">{dialog.message}</p>
            </div>
            <div className="system-dialog__actions">
              <button type="button" className="system-button system-button--secondary" onClick={() => finishDialog(false)}>{dialog.cancelText}</button>
              <button type="button" className={`system-button ${dialog.danger ? "system-button--danger" : "system-button--primary"}`} onClick={() => finishDialog(true)} autoFocus>{dialog.confirmText}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
