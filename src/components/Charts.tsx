import { useMemo, useState } from 'react';
import { CurrencyCode, Property, PropertyCategory, RevenueSeriesPoint } from '../types/immo';
import { formatCompactCurrency, formatCurrency } from '../utils/format';

interface RevenueProfitChartProps {
  data: RevenueSeriesPoint[];
  currency: CurrencyCode;
}

type ChartMetricMode = 'both' | 'revenue' | 'profit';

export function RevenueProfitChart({ data, currency }: RevenueProfitChartProps) {
  const [mode, setMode] = useState<ChartMetricMode>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartHeight = 250;
  const chartWidth = 680;
  const padLeft = 78;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const maxVal = useMemo(() => {
    const peak = Math.max(
      ...data.map((d) => (mode === 'profit' ? d.profit : d.revenue)),
      1
    );
    return Math.ceil((peak * 1.15) / 1_000_000) * 1_000_000 || peak * 1.2;
  }, [data, mode]);

  const ticks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => (maxVal / count) * i);
  }, [maxVal]);

  const points = useMemo(() => {
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW / 2;
    return data.map((d, idx) => {
      const x = data.length > 1 ? padLeft + idx * stepX : padLeft + innerW / 2;
      const yRev = padTop + innerH - (d.revenue / maxVal) * innerH;
      const yProf = padTop + innerH - (d.profit / maxVal) * innerH;
      return { ...d, x, yRev, yProf };
    });
  }, [data, innerW, innerH, maxVal]);

  const buildLinePath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const buildAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const line = buildLinePath(pts);
    const baseline = padTop + innerH;
    return `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${baseline} L ${pts[0].x.toFixed(1)} ${baseline} Z`;
  };

  const revPath = buildLinePath(points.map((p) => ({ x: p.x, y: p.yRev })));
  const revArea = buildAreaPath(points.map((p) => ({ x: p.x, y: p.yRev })));
  const profPath = buildLinePath(points.map((p) => ({ x: p.x, y: p.yProf })));
  const profArea = buildAreaPath(points.map((p) => ({ x: p.x, y: p.yProf })));

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
            Évolution du chiffre d’affaires &amp; bénéfices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Performance financière consolidée · Survoler pour le détail
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(
            [
              { id: 'both', label: 'Comparatif' },
              { id: 'revenue', label: 'CA' },
              { id: 'profit', label: 'Bénéfices' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === tab.id
                  ? 'bg-white text-[#0B1F3A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Graphique interactif d'évolution du chiffre d'affaires et des bénéfices"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="navyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B1F3A" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A24D" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#C9A24D" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {ticks.map((val, i) => {
            const y = padTop + innerH - (val / maxVal) * innerH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={i === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono-num"
                >
                  {val === 0 ? `0 ${currency === 'EUR' ? '€' : currency}` : formatCompactCurrency(val, currency)}
                </text>
              </g>
            );
          })}

          {/* Revenue Series */}
          {(mode === 'both' || mode === 'revenue') && (
            <g>
              <path d={revArea} fill="url(#navyAreaGrad)" />
              <path
                d={revPath}
                fill="none"
                stroke="#0B1F3A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Profit Series */}
          {(mode === 'both' || mode === 'profit') && (
            <g>
              <path d={profArea} fill="url(#goldAreaGrad)" />
              <path
                d={profPath}
                fill="none"
                stroke="#C9A24D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Active Hover Crosshair */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + innerH}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points & X-Axis Labels */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const hitWidth = data.length > 1 ? innerW / (data.length - 1) : innerW;
            return (
              <g key={pt.label}>
                <text
                  x={pt.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isHovered ? 'fill-[#0B1F3A] font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {pt.label}
                </text>

                {(mode === 'both' || mode === 'revenue') && (
                  <circle
                    cx={pt.x}
                    cy={pt.yRev}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? '#0B1F3A' : '#FFFFFF'}
                    stroke="#0B1F3A"
                    strokeWidth="2"
                  />
                )}

                {(mode === 'both' || mode === 'profit') && (
                  <circle
                    cx={pt.x}
                    cy={pt.yProf}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? '#C9A24D' : '#FFFFFF'}
                    stroke="#C9A24D"
                    strokeWidth="2"
                  />
                )}

                {/* Invisible wide hover target */}
                <rect
                  x={pt.x - hitWidth / 2}
                  y={padTop}
                  width={hitWidth}
                  height={innerH + padBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-slate-200 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 shadow-lg text-xs"
            style={{
              left: `${Math.min(Math.max((activePoint.x / chartWidth) * 100, 12), 68)}%`,
              transform: 'translateX(-25%)',
            }}
          >
            <p className="font-display font-semibold text-[#0B1F3A] mb-1.5">
              {activePoint.label} · {activePoint.salesCount} ventes
            </p>
            {(mode === 'both' || mode === 'revenue') && (
              <div className="flex items-center justify-between gap-4 text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-[#0B1F3A]" />
                  Chiffre d’affaires
                </span>
                <span className="font-mono-num font-semibold text-[#0B1F3A]">
                  {formatCurrency(activePoint.revenue, currency)}
                </span>
              </div>
            )}
            {(mode === 'both' || mode === 'profit') && (
              <div className="flex items-center justify-between gap-4 text-slate-700 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-[#C9A24D]" />
                  Bénéfices nets
                </span>
                <span className="font-mono-num font-semibold text-[#9A7524]">
                  {formatCurrency(activePoint.profit, currency)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pt-3 mt-2 border-t border-slate-100 text-xs text-slate-600">
        {(mode === 'both' || mode === 'revenue') && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#0B1F3A]" />
            <span>Chiffre d’affaires</span>
          </div>
        )}
        {(mode === 'both' || mode === 'profit') && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#C9A24D]" />
            <span>Bénéfices nets</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface PropertyTypeChartProps {
  properties: Property[];
  selectedCategory: PropertyCategory | 'Tous';
  onSelectCategory: (cat: PropertyCategory | 'Tous') => void;
  currency: CurrencyCode;
}

const CATEGORY_META: Record<
  PropertyCategory,
  { color: string; labelPlural: string }
> = {
  Villa: { color: '#0B1F3A', labelPlural: 'Villas' },
  Appartement: { color: '#C9A24D', labelPlural: 'Appartements' },
  Terrain: { color: '#3B5B8C', labelPlural: 'Terrains' },
  Studio: { color: '#94A3B8', labelPlural: 'Studios' },
};

export function PropertyTypeChart({
  properties,
  selectedCategory,
  onSelectCategory,
  currency,
}: PropertyTypeChartProps) {
  const [hoveredCat, setHoveredCat] = useState<PropertyCategory | null>(null);

  const breakdown = useMemo(() => {
    const categories: PropertyCategory[] = ['Villa', 'Appartement', 'Terrain', 'Studio'];
    const totalVolume = properties.reduce((sum, p) => sum + p.price, 0) || 1;
    return categories.map((cat) => {
      const items = properties.filter((p) => p.category === cat);
      const volume = items.reduce((sum, p) => sum + p.price, 0);
      const share = Math.round((volume / totalVolume) * 100);
      return {
        category: cat,
        label: CATEGORY_META[cat].labelPlural,
        color: CATEGORY_META[cat].color,
        count: items.length,
        volume,
        share,
      };
    });
  }, [properties]);

  const totalPortfolio = useMemo(
    () => properties.reduce((sum, p) => sum + p.price, 0),
    [properties]
  );

  const focusedCategory =
    hoveredCat ?? (selectedCategory !== 'Tous' ? selectedCategory : null);
  const focusedItem = breakdown.find((b) => b.category === focusedCategory);

  const radius = 64;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0B1F3A]">
            Portefeuille par typologie
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cliquer sur un segment pour filtrer
          </p>
        </div>
        {selectedCategory !== 'Tous' && (
          <button
            type="button"
            onClick={() => onSelectCategory('Tous')}
            className="text-xs font-medium text-[#9A7524] hover:text-[#0B1F3A] transition-colors whitespace-nowrap"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 my-auto">
        {/* Donut SVG */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="168" height="168" viewBox="0 0 168 168" className="-rotate-90">
            <circle
              cx="84"
              cy="84"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            {breakdown.map((item) => {
              const segmentPercent = totalPortfolio > 0 ? item.volume / totalPortfolio : 0;
              const dashLength = segmentPercent * circumference;
              const dashOffset = -cumulativePercent * circumference;
              cumulativePercent += segmentPercent;

              const isDimmed =
                focusedCategory !== null && focusedCategory !== item.category;

              return (
                <circle
                  key={item.category}
                  cx="84"
                  cy="84"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={focusedCategory === item.category ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  opacity={isDimmed ? 0.3 : 1}
                  className="cursor-pointer transition-opacity duration-150"
                  onMouseEnter={() => setHoveredCat(item.category)}
                  onMouseLeave={() => setHoveredCat(null)}
                  onClick={() =>
                    onSelectCategory(
                      selectedCategory === item.category ? 'Tous' : item.category
                    )
                  }
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-[11px] font-medium text-slate-500">
              {focusedItem ? focusedItem.label : 'Valeur totale'}
            </span>
            <span className="font-mono-num text-sm font-semibold text-[#0B1F3A] mt-0.5">
              {formatCompactCurrency(
                focusedItem ? focusedItem.volume : totalPortfolio,
                currency
              )}
            </span>
            {focusedItem && (
              <span className="text-[11px] font-mono-num text-[#9A7524]">
                {focusedItem.share} %
              </span>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="w-full space-y-2.5">
          {breakdown.map((item) => {
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onMouseEnter={() => setHoveredCat(item.category)}
                onMouseLeave={() => setHoveredCat(null)}
                onClick={() =>
                  onSelectCategory(isSelected ? 'Tous' : item.category)
                }
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-slate-100 ring-1 ring-[#0B1F3A]/20'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#0B1F3A] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono-num">
                      {item.count} {item.count > 1 ? 'biens' : 'bien'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono-num font-semibold text-[#0B1F3A]">
                    {item.share} %
                  </p>
                  <p className="text-[11px] font-mono-num text-slate-500">
                    {formatCompactCurrency(item.volume, currency)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
