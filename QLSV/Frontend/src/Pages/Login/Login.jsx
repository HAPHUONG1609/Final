import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import Scur from "../../assets/icon/scurity.png";

function Login() {
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("crt_username");
    if (saved) {
      setCredentials((prev) => ({ ...prev, identifier: saved }));
      setRemember(true);
    }
  }, []);

  const handleLoginChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (remember) {
          localStorage.setItem("crt_username", credentials.identifier);
        } else {
          localStorage.removeItem("crt_username");
        }

        localStorage.setItem("roleCode", data.roleCode);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);

        if (Number(data.roleCode) === 1) {
          navigate("/admin/dashboard", { replace: true });
        } else if (Number(data.roleCode) === 0) {
          navigate("/teacher/dashboard", { replace: true });
        } else {
          setError("Tài khoản chưa được phân quyền");
        }
      } else {
        setError(data.message || "Đăng nhập không thành công");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ");
    }
    setLoading(false);
  };

  const isEmail = useMemo(() => /@/.test(credentials.identifier), [credentials.identifier]);

  return (
    <div className="login">
      <div className="login__card" role="region" aria-labelledby="loginTitle">
        <div className="login__brand">
          <img src={Scur} className="brand-icon" alt="Biểu tượng bảo mật" />
          <span className="brand-name">CRT Encrypt</span>
        </div>

        <h1 id="loginTitle" className="login__title">Đăng nhập</h1>
        <p className="login__subtitle">Nhập thông tin đăng nhập để truy cập tài khoản của bạn.</p>

        {error && (
          <div className="login__alert" role="alert" aria-live="assertive">{error}</div>
        )}

        <form className="login__form" onSubmit={handleLoginSubmit} noValidate>
          <label className="field">
            <span className="field__label">Tên đăng nhập / Email</span>
            <input
              className="field__input"
              type="text"
              name="identifier"
              inputMode={isEmail ? "email" : "text"}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={credentials.identifier}
              onChange={handleLoginChange}
              placeholder="Nhập tên đăng nhập hoặc email"
              aria-invalid={!!error && !credentials.identifier.trim()}
              aria-describedby={error && !credentials.identifier.trim() ? "formMessage" : undefined}
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span className="field__label">Mật khẩu</span>
            <div className="field__password">
              <input
                className="field__input"
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="Nhập mật khẩu của bạn"
                value={credentials.password}
                onChange={handleLoginChange}
                autoComplete="current-password"
                aria-invalid={!!error && !credentials.password.trim()}
                aria-describedby={error && !credentials.password.trim() ? "formMessage" : undefined}
                minLength={6}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setShowPwd((s) => !s)}
                aria-pressed={showPwd}
                aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={loading}
              >
                {showPwd ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </label>

          <div className="login__row">
            <label className="remember">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <span>Ghi nhớ tôi</span>
            </label>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
