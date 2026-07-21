const NOTIFICATION_EVENT = "qlsv:notification";

let notificationId = 0;

const textIncludes = (text, words) => words.some((word) => text.includes(word));

export function inferNotificationType(message) {
  const text = String(message || "").toLocaleLowerCase("vi");

  if (textIncludes(text, ["thất bại", "lỗi", "không thể", "không kết nối"])) return "error";
  if (textIncludes(text, ["thành công", "đã lưu", "đã xóa", "đã cập nhật"])) return "success";
  if (textIncludes(text, ["vui lòng", "chưa ", "phải ", "chỉ ", "không có ", "không hợp lệ"])) return "warning";
  return "info";
}

export function notify(message, options = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      kind: "toast",
      id: ++notificationId,
      message: String(message || "Thông báo từ hệ thống"),
      type: options.type || inferNotificationType(message),
      title: options.title,
      duration: options.duration ?? 4200,
    },
  }));
}

notify.success = (message, options = {}) => notify(message, { ...options, type: "success" });
notify.error = (message, options = {}) => notify(message, { ...options, type: "error" });
notify.warning = (message, options = {}) => notify(message, { ...options, type: "warning" });
notify.info = (message, options = {}) => notify(message, { ...options, type: "info" });

export function confirmAction({
  title = "Xác nhận thao tác",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
}) {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, {
      detail: {
        kind: "confirm",
        id: ++notificationId,
        title,
        message,
        confirmText,
        cancelText,
        danger,
        resolve,
      },
    }));
  });
}

export function installSystemNotifications() {
  if (typeof window === "undefined" || window.__qlsvNotificationsInstalled) return;
  window.__qlsvNotificationsInstalled = true;
  window.alert = (message) => notify(message);
}

export { NOTIFICATION_EVENT };
