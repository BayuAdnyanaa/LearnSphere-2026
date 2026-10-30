// Turns a wait in seconds into short text, for example "45 s", "5 min" or "24 h"
export const formatWait = (seconds) => {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`;
  return `${Math.ceil(seconds / 3600)} h`;
};
