// Vercel Serverless Function — GET /api/search?q=reliance
//
// Live, per-query company search using Yahoo Finance's own public search
// endpoint, filtered to NSE-listed India equities. This is more reliable
// than downloading NSE's full list in one go (NSE's archive servers
// sometimes block requests coming from cloud/datacenter IPs like Vercel's,
// which is exactly why some companies were missing from search before).
// Because this hits Yahoo per-search-term instead of once for the whole
// exchange, it works even when NSE itself is blocking us, and it covers
// every company Yahoo tracks for India — thousands of them.

export default async function handler(req, res) {
  const { q } = req.query
  if (!q || String(q).trim().length < 1) {
    return res.status(200).json({ success: true, companies: [] })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      q
    )}&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=true`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(200).json({ success: false, companies: [], error: `Yahoo returned ${response.status}` })
    }

    const data = await response.json()
    const quotes = Array.isArray(data?.quotes) ? data.quotes : []

    const companies = quotes
      .filter((qt) => qt.symbol && String(qt.symbol).endsWith('.NS') && (qt.quoteType === 'EQUITY' || !qt.quoteType))
      .map((qt) => ({
        symbol: String(qt.symbol).replace('.NS', ''),
        name: qt.longname || qt.shortname || qt.symbol,
        sector: qt.sector || qt.industry || 'Equity',
      }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ success: true, companies })
  } catch (error) {
    return res.status(200).json({ success: false, companies: [], error: error.message })
  }
}
