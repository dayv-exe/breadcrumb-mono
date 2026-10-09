export function getInitials(name: string): string {
  const parts = name.split(/[._]/);
  return parts[0].substring(0, 1) + (parts.length > 1 ? parts[1].substring(0, 1) : "");
}