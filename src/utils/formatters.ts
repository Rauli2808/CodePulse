export function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value || 0);
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

export function formatCountdown(startSeconds: number, now: number) {
  const difference = Math.max(0, startSeconds * 1_000 - now);
  const days = Math.floor(difference / 86_400_000);
  const hours = Math.floor((difference % 86_400_000) / 3_600_000);
  const minutes = Math.floor((difference % 3_600_000) / 60_000);

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatImageUrl(url?: string) {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

export function rankColor(rating: number) {
  if (rating >= 3_000) return "#e53935";
  if (rating >= 2_400) return "#f57c00";
  if (rating >= 2_100) return "#8e24aa";
  if (rating >= 1_900) return "#1976d2";
  if (rating >= 1_600) return "#00a0a0";
  if (rating >= 1_400) return "#2e7d32";
  return "#6b7280";
}
