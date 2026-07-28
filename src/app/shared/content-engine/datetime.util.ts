/** Converts a UTC ISO string from the API into the format a native `datetime-local` input needs. */
export function isoToLocalInput(iso?: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a native `datetime-local` input value (browser-local time) back to a UTC ISO string. */
export function localInputToIso(local?: string | null): string | null {
  if (!local) {
    return null;
  }
  return new Date(local).toISOString();
}
