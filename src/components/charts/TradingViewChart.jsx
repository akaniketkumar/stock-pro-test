import { useEffect, useRef, useState } from 'react'
import CandleChart from './CandleChart'
import { Spinner } from '../ui/Loading'

const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js'

export default function TradingViewChart({ symbol, candles = [] }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let mounted = true
    let widget = null

    function cleanup() {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }

    function renderWidget() {
      if (!mounted || !window.TradingView || !containerRef.current) return
      cleanup()
      widget = new window.TradingView.widget({
        container_id: containerRef.current.id,
        autosize: true,
        symbol: `NSE:${symbol}`,
        interval: 'D',
        timezone: 'Asia/Kolkata',
        theme: 'dark',
        style: '1',
        locale: 'en',
        backgroundColor: '#0a0e17',
        gridColor: 'rgba(30,41,59,0.5)',
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        save_image: false,
        studies: [
          'STD;SMA_20',
          'STD;SMA_50',
          'STD;Volume',
          'STD;MACD',
          'STD;RSI',
        ],
        width: '100%',
        height: '100%',
      })
      setStatus('ready')
    }

    if (window.TradingView) {
      renderWidget()
    } else {
      const script = document.createElement('script')
      script.src = TV_SCRIPT_SRC
      script.async = true
      script.onload = renderWidget
      script.onerror = () => {
        if (mounted) setStatus('fallback')
      }
      document.body.appendChild(script)
    }

    return () => {
      mounted = false
      cleanup()
    }
  }, [symbol])

  return (
    <div className="relative h-96 w-full overflow-hidden" style={{ maxHeight: '460px' }}>
      <div
        id={`tv-${symbol}-${Math.random().toString(36).slice(2, 8)}`}
        ref={containerRef}
        className="h-full w-full overflow-hidden"
        style={{ height: '384px', visibility: status === 'ready' ? 'visible' : 'hidden' }}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Spinner label="Loading TradingView chart..." />
        </div>
      )}
      {status === 'fallback' && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <CandleChart candles={candles} height={384} />
        </div>
      )}
    </div>
  )
}
