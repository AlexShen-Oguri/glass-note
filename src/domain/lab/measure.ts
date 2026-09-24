import type {UnitPreference} from '../contracts';
import {formatAmount} from '../search';

export type LabVolumeUnit = 'ml' | 'oz';

export interface LabAmountDisplay {
  amount: string;
  unit: string;
  converted: boolean;
}

export interface LabAmountCommit {
  amount: string;
  unit: string;
}

export interface LabAmountDraftConversion {
  /** Clean value for the input surface. */
  editorAmount: string;
  /** Higher-precision value used if the user applies this unit change. */
  commitAmount: string;
  unit: LabVolumeUnit;
}

const MILLILITRES_PER_US_FLUID_OUNCE = 29.5735295625;
const DECIMAL_AMOUNT = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

export function isLabVolumeUnit(unit: string): unit is LabVolumeUnit {
  return unit === 'ml' || unit === 'oz';
}

/** Text, ranges and negative quantities remain editorial strings. */
export function parseLabDecimal(amount: string): number | null {
  const value = amount.trim();
  if (!DECIMAL_AMOUNT.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function convertLabVolume(value: number, from: LabVolumeUnit, to: LabVolumeUnit): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  if (from === to) return value;
  const converted = from === 'ml'
    ? value / MILLILITRES_PER_US_FLUID_OUNCE
    : value * MILLILITRES_PER_US_FLUID_OUNCE;
  return Number.isFinite(converted) ? converted : null;
}

/** Keep roughly three significant decimal digits without emitting exponent notation. */
export function formatLabNumber(value: number): string | null {
  if (!Number.isFinite(value) || value < 0) return null;
  if (value === 0) return '0';
  const magnitude = Math.floor(Math.log10(value));
  const decimals = Math.max(0, Math.min(12, 2 - magnitude));
  const rounded = value.toFixed(decimals).replace(/(?:\.0+|(?:(\.\d*?)0+))$/, '$1');
  if (Number(rounded) !== 0) return rounded;
  return expandScientificNumber(String(value));
}

function expandScientificNumber(value: string): string {
  if (!/[eE]/.test(value)) return value;
  const [coefficient = '', exponentText = '0'] = value.toLowerCase().split('e');
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith('-');
  const unsigned = coefficient.replace(/^[+-]/, '');
  const decimalAt = unsigned.indexOf('.') < 0 ? unsigned.length : unsigned.indexOf('.');
  const digits = unsigned.replace('.', '');
  const nextDecimalAt = decimalAt + exponent;
  const expanded = nextDecimalAt <= 0
    ? `0.${'0'.repeat(-nextDecimalAt)}${digits}`
    : nextDecimalAt >= digits.length
      ? `${digits}${'0'.repeat(nextDecimalAt - digits.length)}`
      : `${digits.slice(0, nextDecimalAt)}.${digits.slice(nextDecimalAt)}`;
  return `${negative ? '-' : ''}${expanded}`;
}

function serializeConvertedNumber(value: number): string {
  const expanded = expandScientificNumber(value.toPrecision(15));
  return expanded.includes('.') ? expanded.replace(/0+$/, '').replace(/\.$/, '') : expanded;
}

export function convertLabAmountDraft(amount: string, from: string, to: LabVolumeUnit): LabAmountDraftConversion | null {
  const parsed = parseLabDecimal(amount);
  if (parsed === null || !isLabVolumeUnit(from)) return null;
  const converted = convertLabVolume(parsed, from, to);
  if (converted === null) return null;
  const editorAmount = formatLabNumber(converted);
  return editorAmount === null ? null : {
    editorAmount,
    commitAmount: serializeConvertedNumber(converted),
    unit: to,
  };
}

/** Preferred units affect only this view model; callers retain the source strings untouched. */
export function displayLabAmount(amount: string, unit: string, preference: UnitPreference): LabAmountDisplay {
  const parsed = parseLabDecimal(amount);
  if (parsed === null || !isLabVolumeUnit(unit)) return {amount, unit, converted: false};
  const converted = convertLabVolume(parsed, unit, preference);
  if (converted === null) return {amount, unit, converted: false};

  // Use the catalogue formatter for ordinary bar measures, then preserve small
  // non-zero quantities that its two-decimal rounding would erase or distort.
  const standard = formatAmount(parsed, unit, preference);
  const standardValue = Number(standard.amount);
  const relativeError = converted === 0 ? 0 : Math.abs(standardValue - converted) / converted;
  const clean = standardValue !== 0 && relativeError <= 0.025
    ? standard.amount
    : formatLabNumber(converted);
  return clean === null
    ? {amount, unit, converted: false}
    : {amount: clean, unit: preference, converted: preference !== unit};
}

/**
 * Commit only an explicit edit. A unit-only edit converts from the exact stored
 * number, rather than from the rounded display string, so one edit creates at
 * most one conversion and preference toggles create none.
 */
export function commitLabAmount(input: {
  sourceAmount: string;
  sourceUnit: string;
  editorAmount: string;
  editorUnit: string;
  amountEdited: boolean;
  unitEdited: boolean;
}): LabAmountCommit {
  const {sourceAmount, sourceUnit, editorAmount, editorUnit, amountEdited, unitEdited} = input;
  if (!amountEdited && !unitEdited) return {amount: sourceAmount, unit: sourceUnit};

  const targetUnit = editorUnit.trim();
  if (!amountEdited) {
    if (targetUnit === sourceUnit) return {amount: sourceAmount, unit: sourceUnit};
    const sourceValue = parseLabDecimal(sourceAmount);
    if (sourceValue !== null && isLabVolumeUnit(sourceUnit) && isLabVolumeUnit(targetUnit)) {
      const converted = convertLabVolume(sourceValue, sourceUnit, targetUnit);
      if (converted !== null) return {amount: serializeConvertedNumber(converted), unit: targetUnit};
    }
    return {amount: sourceAmount, unit: targetUnit};
  }

  const trimmedAmount = editorAmount.trim();
  return {amount: trimmedAmount, unit: targetUnit};
}
