// Vercel Serverless Function — GET /api/companies
//
// Returns the full, real list of NSE-listed equities (symbol + company name),
// fetched live from NSE's own public archive. This means search covers every
// real company on the exchange, not a small hand-picked list, and no fake
// company can ever show up because it's simply not in NSE's own data.
//
// Cached at the edge for 24 hours (the list barely changes day to day) so we
// don't hit NSE on every single search keystroke across all users.

export default async function handler(req, res) {
  try {
    const url = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/csv,*/*',
      },
    })

    if (!response.ok) {
      return res.status(200).json({ success: false, error: `NSE returned ${response.status}`, companies: [] })
    }

    const text = await response.text()
    const lines = text.split('\n').filter(Boolean)
    // First line is the header: SYMBOL,NAME OF COMPANY, SERIES, ...
    const companies = lines.slice(1).map((line) => {
      const cols = line.split(',')
      const symbol = (cols[0] || '').trim()
      const name = (cols[1] || '').trim()
      const series = (cols[2] || '').trim()
      return { symbol, name, series }
    }).filter((c) => c.symbol && c.name)

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800')
    return res.status(200).json({ success: true, count: companies.length, companies })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message, companies: [] })
  }
}
