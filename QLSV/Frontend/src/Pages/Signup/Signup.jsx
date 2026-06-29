import React, { useState } from "react";
import "./SignUp.css";   
import Scur from "../../assets/icon/scurity.png"

function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Sửa: dùng email thay vì fullName (fullName không tồn tại)
    if (!email.trim() || !username.trim() || !password.trim() || !confirm.trim() || !role) {
      setError("Please fill in all information.");
      return;
    }

    if (password !== confirm) {
      setError("Re-entered password does not match.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); 
    setLoading(false);
    alert("Registration (frontend-only) successful! Backend will be connected later.");
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
            <img src={Scur} alt="" className="brand-icon" />
          <span className="brand-name">CRT Encrypt</span>
        </div>

        <h1 className="auth__title">Sign Up</h1>

        {error && <div className="auth__alert">{error}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </label>

          <label className="field">
            <span className="field__label">Username</span>
            <input className="field__input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input className="field__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
          </label>

          <label className="field">
            <span className="field__label">Confirm Password</span>
            <input className="field__input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm your password" />
          </label>

          <label className="field">
            <span className="field__label">Role</span>
            <select className="field__input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select a role</option>
              <option value="ADMIN">Admin</option>
              <option value="GIANGVIEN">Teacher</option>
              <option value="SINHVIEN">Student</option>
            </select>
          </label>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className="auth__footer">
          <span>Already have an account?</span>
          <a className="link" href="/">Sign In</a>
        </div>
      </div>
    </div>
  );
}
export default SignUp;
