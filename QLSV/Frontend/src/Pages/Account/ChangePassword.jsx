import React, { useState } from "react";
import { API_BASE } from "../../utils/auth.js";
import "./Account.css";

const EMPTY_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePassword({ dark = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [visible, setVisible] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const toggleVisible = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      setMessageType("error");
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setMessageType("error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/api/account/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu đăng nhập");
      }

      setForm(EMPTY_FORM);
      setMessage(data.message || "Đổi mật khẩu đăng nhập thành công.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Lỗi máy chủ khi đổi mật khẩu đăng nhập.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "currentPassword", label: "Mật khẩu hiện tại" },
    { name: "newPassword", label: "Mật khẩu mới" },
    { name: "confirmPassword", label: "Xác nhận mật khẩu mới" },
  ];

  return (
    <div className={`account-page ${dark ? "account-page--dark" : ""}`}>
      <section className="account-card account-card--password">
        <div className="account-card__heading">
          <span className="account-card__icon" aria-hidden="true">
            <i className="fa-solid fa-shield-halved" />
          </span>
          <div>
            <p className="account-card__eyebrow">Bảo mật tài khoản</p>
            <h1>Đổi mật khẩu đăng nhập</h1>
            <p className="account-card__description">
              Mật khẩu này dùng để đăng nhập hệ thống và không làm thay đổi mã PIN mã hóa CRT.
            </p>
          </div>
        </div>

        <form className="account-form" onSubmit={submit}>
          {fields.map((field) => (
            <label className="account-form__field" key={field.name}>
              <span>{field.label}</span>
              <div className="account-form__password">
                <input
                  type={visible[field.name] ? "text" : "password"}
                  name={field.name}
                  value={form[field.name]}
                  onChange={updateField}
                  autoComplete={field.name === "currentPassword" ? "current-password" : "new-password"}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => toggleVisible(field.name)}
                  aria-label={visible[field.name] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={submitting}
                >
                  <i className={`fa-solid ${visible[field.name] ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </label>
          ))}

          <p className="account-form__hint">Mật khẩu mới phải có ít nhất 6 ký tự.</p>

          {message && (
            <div
              className={`account-message account-message--${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              <i
                className={`fa-solid ${messageType === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
              />
              <span>{message}</span>
            </div>
          )}

          <button className="account-form__submit" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Đang cập nhật...
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock" /> Đổi mật khẩu
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChangePassword;
