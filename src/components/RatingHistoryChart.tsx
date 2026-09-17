import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import type { RatingChange } from "../types/codeforces";
import { formatNumber } from "../utils/formatters";

type RatingHistoryChartProps = {
  handle: string;
  history: RatingChange[];
};

const Y_TICK_COUNT = 4;

function shortDate(timestamp: number) {
  return new Date(timestamp * 1_000).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

function fullDate(timestamp: number) {
  return new Date(timestamp * 1_000).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shorten(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export function RatingHistoryChart({ handle, history }: RatingHistoryChartProps) {
  const figureRef = useRef<HTMLElement>(null);
  const chartId = useId();
  const sortedHistory = useMemo(
    () => [...history].sort((left, right) => left.ratingUpdateTimeSeconds - right.ratingUpdateTimeSeconds),
    [history],
  );
  const [chartWidth, setChartWidth] = useState(900);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, sortedHistory.length - 1));

  useEffect(() => {
    if (!figureRef.current || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(figureRef.current);
    return () => observer.disconnect();
  }, []);

  if (!sortedHistory.length) {
    return (
      <section className="rating-chart-panel" aria-labelledby={`${chartId}-heading`}>
        <div className="panel-heading">
          <div>
            <h3 id={`${chartId}-heading`}>Rating history</h3>
            <p>No rated contests yet</p>
          </div>
        </div>
        <p className="empty-text">A rating chart will appear after the first rated contest.</p>
      </section>
    );
  }

  const height = chartWidth < 520 ? 230 : 280;
  const padding = { top: 18, right: 16, bottom: 38, left: chartWidth < 520 ? 42 : 52 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const ratings = sortedHistory.map((item) => item.newRating);
  const rawMin = Math.min(...ratings);
  const rawMax = Math.max(...ratings);
  const yStep = Math.max(100, Math.ceil(Math.max(1, rawMax - rawMin) / Y_TICK_COUNT / 100) * 100);
  const yMin = Math.max(0, Math.floor((rawMin - yStep) / yStep) * yStep);
  const yMax = Math.ceil((rawMax + yStep) / yStep) * yStep;
  const yRange = Math.max(yStep, yMax - yMin);
  const xFor = (index: number) => (
    sortedHistory.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (index / (sortedHistory.length - 1)) * plotWidth
  );
  const yFor = (rating: number) => padding.top + ((yMax - rating) / yRange) * plotHeight;
  const points = sortedHistory.map((item, index) => ({
    item,
    x: xFor(index),
    y: yFor(item.newRating),
  }));
  const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, index) => yMin + (index / Y_TICK_COUNT) * yRange);
  const xTickCount = Math.min(sortedHistory.length, chartWidth < 520 ? 3 : 5);
  const xTickIndices = Array.from(
    new Set(
      Array.from({ length: xTickCount }, (_, index) => (
        xTickCount === 1 ? 0 : Math.round((index / (xTickCount - 1)) * (sortedHistory.length - 1))
      )),
    ),
  );
  const activePoint = points[Math.min(activeIndex, points.length - 1)];
  const tooltipWidth = chartWidth < 520 ? 150 : 202;
  const tooltipHeight = 58;
  const tooltipX = Math.min(
    chartWidth - padding.right - tooltipWidth,
    Math.max(padding.left, activePoint.x - tooltipWidth / 2),
  );
  const tooltipY = activePoint.y < 82 ? activePoint.y + 14 : activePoint.y - tooltipHeight - 14;
  const firstRating = sortedHistory[0].newRating;
  const latestRating = sortedHistory.at(-1)?.newRating || firstRating;
  const movement = latestRating - firstRating;
  const description = `${sortedHistory.length} rated contests. Rating moved from ${formatNumber(firstRating)} to ${formatNumber(latestRating)}, ${movement >= 0 ? "up" : "down"} ${formatNumber(Math.abs(movement))}.`;

  function handleChartKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActiveIndex((current) => (
      event.key === "ArrowLeft"
        ? Math.max(0, current - 1)
        : Math.min(sortedHistory.length - 1, current + 1)
    ));
  }

  return (
    <section className="rating-chart-panel" aria-labelledby={`${chartId}-heading`}>
      <div className="panel-heading">
        <div>
          <h3 id={`${chartId}-heading`}>Rating history</h3>
          <p>{description}</p>
        </div>
        <span>{formatNumber(latestRating)} latest</span>
      </div>
      <figure ref={figureRef}>
        <button
          type="button"
          className="chart-canvas"
          onKeyDown={handleChartKeys}
          aria-label={`Rating history for ${handle}. ${description} Use the left and right arrow keys to inspect contests.`}
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${height}`}
            width={chartWidth}
            height={height}
            aria-hidden="true"
            focusable="false"
          >
            {yTicks.map((tick) => {
              const y = yFor(tick);
              return (
                <g key={tick}>
                  <line className="chart-grid-line" x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} />
                  <text className="chart-axis-label" x={padding.left - 9} y={y + 4} textAnchor="end">
                    {formatNumber(Math.round(tick))}
                  </text>
                </g>
              );
            })}
            {xTickIndices.map((index) => (
              <text
                key={index}
                className="chart-axis-label"
                x={xFor(index)}
                y={height - 10}
                textAnchor={index === 0 ? "start" : index === sortedHistory.length - 1 ? "end" : "middle"}
              >
                {shortDate(sortedHistory[index].ratingUpdateTimeSeconds)}
              </text>
            ))}
            <polyline
              className="chart-line"
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
            />
            {points.map((point, index) => (
              <circle
                key={`${point.item.contestId}-${point.item.ratingUpdateTimeSeconds}`}
                className="chart-hit-point"
                cx={point.x}
                cy={point.y}
                r="9"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              />
            ))}
            <line
              className="chart-guide-line"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={padding.top + plotHeight}
            />
            <circle className="chart-active-point" cx={activePoint.x} cy={activePoint.y} r="4" />
            <g className="chart-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
              <rect width={tooltipWidth} height={tooltipHeight} rx="6" />
              <text x="11" y="18">{fullDate(activePoint.item.ratingUpdateTimeSeconds)}</text>
              <text className="chart-tooltip-rating" x="11" y="36">
                {formatNumber(activePoint.item.newRating)} rating
              </text>
              <text className="chart-tooltip-contest" x="11" y="51">
                {shorten(activePoint.item.contestName, chartWidth < 520 ? 23 : 34)}
              </text>
            </g>
          </svg>
        </button>
        <figcaption className="sr-only">{description}</figcaption>
      </figure>
    </section>
  );
}
