export function classNames(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' '); }
export function formatCurrency(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
