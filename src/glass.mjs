/** Native material policy and shared semantic surface tokens. */
export const GLASS_LEVELS = Object.freeze({balanced: .86, quiet: .94});

export function normalizeGlassLevel(value) {
  if (!Object.hasOwn(GLASS_LEVELS, value)) throw new Error('无效的材质强度');
  return value;
}

export function normalizeTransparency(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('通透度应为0到100');
  }
  return Math.round(value);
}

export function presetTransparency(level) {
  return normalizeGlassLevel(level) === 'balanced' ? 82 : 64;
}

export function glassPolicy({enabled, reducedTransparency = false, increasedContrast = false, available = false, level = 'balanced'}) {
  const alpha = GLASS_LEVELS[normalizeGlassLevel(level)];
  if (!enabled) return {active: false, alpha, reason: '毛玻璃已关闭'};
  if (reducedTransparency || increasedContrast) {
    return {active: false, alpha, reason: '系统辅助功能设置：使用实色'};
  }
  if (!available) return {active: false, alpha, reason: '当前设备使用实色'};
  return {active: true, alpha, reason: '毛玻璃已启用'};
}

/** A continuous tint replaces separate backings on ordinary rows. */
export function glassTokens(level, transparency = presetTransparency(level)) {
  const alpha = GLASS_LEVELS[normalizeGlassLevel(level)];
  const value = normalizeTransparency(transparency);
  const tint = 100 - .9 * value;
  const windowOpacity = Number(tint.toFixed(3));
  return [
    `--zmt-glass-opacity:${alpha * 100}%;`,
    `--zmt-glass-window-opacity:${windowOpacity}%;`,
    `--zmt-glass-text-surface:color-mix(in srgb,var(--zmt-surface-container) ${alpha * 100}%,transparent);`,
    '--zmt-side-wash:color-mix(in srgb,var(--zmt-surface-container-lowest) 8%,transparent);',
  ].join('');
}

/** Preserve native blur; the slider adjusts only the semantic tint. */
export function nativeMaterialAlpha(transparency) {
  normalizeTransparency(transparency);
  return 1;
}

/** System materials, not a configurable native blur radius. */
export function nativeMaterialForMode(mode) {
  return 13; // HUD; appearance follows the selected light/dark mode
}
