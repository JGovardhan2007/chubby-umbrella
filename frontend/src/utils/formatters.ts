/**
 * Utility functions for user-facing meteorological labels and formatting.
 * Eliminates internal technical abbreviations (e.g. STM_*, model codes) in the UI.
 */

export function formatStormName(stormId?: string | null, fallbackIndex: number = 0): string {
  if (!stormId) return `Cell #${String(fallbackIndex + 1).padStart(2, '0')}`;

  // If it's already a clean user-friendly name, return it
  if (stormId.startsWith('Cell #')) {
    return stormId;
  }

  // Parse numeric index from strings like "STM_260615_001" or "STM_01" or "STM_A17"
  const matchNum = stormId.match(/\d+$/);
  if (matchNum) {
    const num = parseInt(matchNum[0], 10);
    const padded = String(num).padStart(2, '0');
    return `Cell #${padded}`;
  }

  const matchAnyNum = stormId.match(/(\d+)/g);
  if (matchAnyNum && matchAnyNum.length > 0) {
    const lastNum = matchAnyNum[matchAnyNum.length - 1];
    const parsed = parseInt(lastNum, 10);
    if (!isNaN(parsed)) {
      return `Cell #${String(parsed).padStart(2, '0')}`;
    }
  }

  return `Cell #${String(fallbackIndex + 1).padStart(2, '0')}`;
}

export function formatStormType(intensity?: number, stage?: string): string {
  if (intensity && intensity >= 52) return 'Severe Supercell';
  if (intensity && intensity >= 45) return 'Mature Multicell';
  if (stage) return `${stage} Convective Cell`;
  return 'Convective Cell';
}
