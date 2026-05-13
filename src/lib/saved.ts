const KEY = "osoulk_saved_properties";

export function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleSaved(id: string): boolean {
  const saved = getSavedIds();
  const idx = saved.indexOf(id);
  if (idx === -1) {
    saved.push(id);
    localStorage.setItem(KEY, JSON.stringify(saved));
    return true;
  } else {
    saved.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(saved));
    return false;
  }
}

export function isSaved(id: string): boolean {
  return getSavedIds().includes(id);
}
