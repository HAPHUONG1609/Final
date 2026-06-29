export function notFound(_req, res) {
  res.status(404).json({ error: "NOT_FOUND" });
}
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(500).json({ error: "SERVER_ERROR", detail: err.message });
}
