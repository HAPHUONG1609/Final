import React from "react";
import { Link } from "react-router-dom";
import Avt from "../../assets/icon/user.png";
import "./AvatarMenu.css";

const ROLE_ITEMS = {
  SINHVIEN: [
    {
      to: "/student/personal-info",
      icon: "fa-solid fa-user",
      label: "Thông tin cá nhân",
    },
    {
      to: "/student/change-password",
      icon: "fa-solid fa-lock",
      label: "Đổi mật khẩu",
    },
  ],
  GIANGVIEN: [
    {
      to: "/teacher/personal-info",
      icon: "fa-solid fa-user-tie",
      label: "Thông tin cá nhân",
    },
    {
      to: "/teacher/change-password",
      icon: "fa-solid fa-lock",
      label: "Đổi mật khẩu",
    },
  ],
  ADMIN: [
    {
      to: "/admin/change-password",
      icon: "fa-solid fa-lock",
      label: "Đổi mật khẩu",
    },
  ],
};

function AvatarMenu({ role, dark = false, avatarSrc = Avt }) {
  const items = ROLE_ITEMS[role] || [];

  return (
    <div className={`avatar-menu ${dark ? "avatar-menu--dark" : ""}`}>
      <button
        type="button"
        className="avatar-menu__trigger"
        aria-label="Mở menu tài khoản"
        aria-haspopup="menu"
      >
        <img src={avatarSrc} alt="Ảnh đại diện" className="avatar-menu__image" />
      </button>

      <div className="avatar-menu__panel" role="menu">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            role="menuitem"
            className="avatar-menu__item"
          >
            <i className={item.icon} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AvatarMenu;
