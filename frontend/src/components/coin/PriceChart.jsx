import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { ChartSkeleton, Skeleton } from "../ui/Skeleton.jsx";
import { fmtUsd, getCoin24hMovePct, safeNum, timeAgo } from "../../lib/coin-display.js";
import { toCandleSeriesPoints, toVolumeSeriesPoints } from "../../lib/chart-candles.js";
import { useCandles } from "../../hooks/useCandles.js";

function formatCrosshairPrice(n) {
  return fmtUsd(Math.max(0.00000001, safeNum(n, 0)));
}

export function PriceChart({ coin, height = 280, chartRange, setChartRange, reloadKey = 0, variant = "default", compact = false }) {
  const chartRef = useRef(null);
  const chartApiRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const { candleData, loading: activityLoading } = useCandles(coin, chartRange, reloadKey);

  const [chartLook, setChartLook] = useState(() => {
    try {
      return localStorage.getItem("chart_look_v1") || "dark";
    } catch {
      return "dark";
    }
  });

  const [crosshairInfo, setCrosshairInfo] = useState(null);
  const [chartVersion, setChartVersion] = useState(0);

  const themeCfg = useMemo(() => {
    const isLight = chartLook === "light";

    return isLight
      ? {
          chartBg: "#FFFFFF",
          faintText: "#848e9c",
          grid: "rgba(15,23,42,.06)",
          axis: "rgba(15,23,42,.10)",
          up: "#0a9b68",
          down: "#d63d52",
          wickUp: "#0a9b68",
          wickDown: "#d63d52",
          volUp: "rgba(10,155,104,.5)",
          volDown: "rgba(214,61,82,.5)",
          pctBg: "rgba(10,155,104,.08)",
        }
      : {
          chartBg: "#0b0e11",
          faintText: "#848e9c",
          grid: "rgba(43,49,57,.55)",
          axis: "rgba(43,49,57,.9)",
          up: "#0a9b68",
          down: "#d63d52",
          wickUp: "#0a9b68",
          wickDown: "#d63d52",
          volUp: "rgba(10,155,104,.4)",
          volDown: "rgba(214,61,82,.4)",
          pctBg: "rgba(10,155,104,.1)",
        };
  }, [chartLook]);

  useEffect(() => {
    try {
      localStorage.setItem("chart_look_v1", chartLook);
    } catch {}
  }, [chartLook]);

  const pct = useMemo(() => getCoin24hMovePct(coin || {}), [coin?.chart, coin?.priceUsd, coin?.lastPriceUsd]);

  const livePrice = safeNum(
    candleData[candleData.length - 1]?.close,
    Math.max(0.00000001, safeNum(coin?.priceUsd, 0.000001))
  );

  const up = pct >= 0;
  const createdAgo = timeAgo(coin?.createdAt || coin?.created_at);
  const isLight = chartLook === "light";
  const isHero = variant === "hero";

  const candlePoints = useMemo(() => toCandleSeriesPoints(candleData), [candleData]);
  const volumePoints = useMemo(
    () => toVolumeSeriesPoints(candleData, themeCfg.volUp, themeCfg.volDown),
    [candleData, themeCfg.volUp, themeCfg.volDown]
  );

  useEffect(() => {
    const host = chartRef.current;
    if (!host) return;

    const width = Math.max(280, host.clientWidth || 280);

    const chart = createChart(host, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: themeCfg.chartBg },
        textColor: themeCfg.faintText,
        attributionLogo: false,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      },
      grid: {
        vertLines: { color: themeCfg.grid, visible: true },
        horzLines: { color: themeCfg.grid, visible: true },
      },
      rightPriceScale: {
        visible: true,
        borderColor: themeCfg.axis,
        entireTextOnly: true,
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderColor: themeCfg.axis,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: compact ? 8 : 6,
        minBarSpacing: compact ? 3 : 2,
        rightBarStaysOnScroll: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isLight ? "rgba(15,23,42,.16)" : "rgba(148,163,184,.22)",
          style: 2,
          labelBackgroundColor: isLight ? "#E2E8F0" : "#1E293B",
        },
        horzLine: {
          width: 1,
          color: isLight ? "rgba(15,23,42,.16)" : "rgba(148,163,184,.22)",
          style: 2,
          labelBackgroundColor: up ? themeCfg.up : themeCfg.down,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: true },
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: themeCfg.up,
      downColor: themeCfg.down,
      borderUpColor: themeCfg.up,
      borderDownColor: themeCfg.down,
      wickUpColor: themeCfg.wickUp,
      wickDownColor: themeCfg.wickDown,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineStyle: 2,
      priceLineColor: up ? themeCfg.up : themeCfg.down,
      priceFormat: {
        type: "price",
        precision: livePrice > 1 ? 4 : livePrice > 0.01 ? 6 : 8,
        minMove: livePrice > 1 ? 0.0001 : livePrice > 0.01 ? 0.000001 : 0.00000001,
      },
    });

    candleSeries.priceScale().applyOptions({
      autoScale: true,
      scaleMargins: { top: 0.12, bottom: 0.28 },
    });

    // Pad around the real high/low so wicks stay readable, without forcing a
    // fake ±1.5% window that hides small green recoveries inside a red bar.
    candleSeries.applyOptions({
      autoscaleInfoProvider: (original) => {
        const base = original();
        if (!base?.priceRange) return base;
        const { minValue, maxValue } = base.priceRange;
        const mid = (minValue + maxValue) / 2;
        if (!(mid > 0)) return base;
        const span = Math.max(0, maxValue - minValue);
        const pad = Math.max(span * 0.35, mid * 0.0015);
        return {
          ...base,
          priceRange: {
            minValue: minValue - pad,
            maxValue: maxValue + pad,
          },
        };
      },
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
      borderVisible: false,
    });

    chartApiRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartVersion((v) => v + 1);

    const onCrosshairMove = (param) => {
      if (!param?.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setCrosshairInfo(null);
        return;
      }

      const candle = param.seriesData.get(candleSeries);
      const volume = param.seriesData.get(volumeSeries);

      if (!candle) {
        setCrosshairInfo(null);
        return;
      }

      setCrosshairInfo({
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: volume?.value || 0,
      });
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    const handleResize = () => {
      if (!chartRef.current) return;
      chart.applyOptions({ width: Math.max(280, chartRef.current.clientWidth || 280) });
    };

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(handleResize);
      ro.observe(host);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", handleResize);
      chart.remove();
      chartApiRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, themeCfg, isLight, up, livePrice, compact]);

  const timeframes = compact
    ? ["5M", "1H", "1D"]
    : ["5M", "15M", "1H", "4H", "1D", "1W"];

  const tfLabels = { "5M": "5m", "15M": "15m", "1H": "1h", "4H": "4h", "1D": "1D", "1W": "Week" };

  useEffect(() => {
    if (!candleSeriesRef.current || !chartApiRef.current || !candlePoints.length) return;

    candleSeriesRef.current.setData(candlePoints);
    volumeSeriesRef.current?.setData(volumePoints);

    const chart = chartApiRef.current;
    chart.timeScale().fitContent();
    chart.timeScale().scrollToRealTime();
  }, [candlePoints, volumePoints, chartRange, chartVersion]);

  const displayPrice = crosshairInfo?.close ?? livePrice;
  const ohlc = crosshairInfo;

  return (
    <div className={`chartPanel ${isLight ? "chartPanel--light" : ""} ${isHero ? "chartPanel--hero" : ""} ${compact ? "chartPanel--compact" : ""}`}>
      <div className="chartPanelHead">
        <div className="chartPanelHeadRow">
          {!compact ? <div className="chartPanelLabel">{ohlc ? "Crosshair" : "Live Price"}</div> : null}
          <div className="chartPanelToolbar">
            <button
              type="button"
              className="chartToolBtn chartToolBtn--theme"
              onClick={() => setChartLook(chartLook === "dark" ? "light" : "dark")}
              aria-label={chartLook === "dark" ? "Switch to light chart" : "Switch to dark chart"}
            >
              {compact ? (chartLook === "dark" ? "☀" : "●") : chartLook === "dark" ? "☀ Light" : "● Dark"}
            </button>
            {timeframes.map((value) => {
              const active = chartRange === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`chartTfBtn ${active ? "active" : ""}`}
                  onClick={() => setChartRange?.(value)}
                >
                  {tfLabels[value]}
                </button>
              );
            })}
            <div className={`chartPctBadge ${up ? "up" : "down"}`}>
              {up ? "+" : ""}
              {pct.toFixed(2)}%
            </div>
          </div>
        </div>

        {!compact ? <div className="chartPanelPrice">{fmtUsd(displayPrice)}</div> : null}

        {ohlc ? (
          <div className="chartOhlcRow" aria-live="polite">
            <span>
              O <b>{formatCrosshairPrice(ohlc.open)}</b>
            </span>
            <span>
              H <b>{formatCrosshairPrice(ohlc.high)}</b>
            </span>
            <span>
              L <b>{formatCrosshairPrice(ohlc.low)}</b>
            </span>
            <span>
              C <b>{formatCrosshairPrice(ohlc.close)}</b>
            </span>
            {ohlc.volume > 0 ? (
              <span>
                V <b>{ohlc.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
              </span>
            ) : null}
          </div>
        ) : !compact ? (
          <div className="chartPanelMeta">Created {createdAgo} • Hover chart for OHLC</div>
        ) : null}
      </div>

      <div className="chartPanelCanvas" style={{ height }}>
        <div ref={chartRef} className="chartPanelCanvasHost" style={{ height }} />
        {activityLoading && !candleData.length ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <ChartSkeleton height={height} />
          </div>
        ) : null}
        {activityLoading && candleData.length > 0 ? (
          <div className="chartPanelLoading">
            <Skeleton width={54} height={22} style={{ borderRadius: 999 }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
