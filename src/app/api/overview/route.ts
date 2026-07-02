import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [
    services,
    leads,
    products,
    orders,
    articles,
    clicks,
    linkPages,
    linkItems,
    applications,
    portfolio,
  ] = await Promise.all([
    db.freelanceService.count(),
    db.freelanceLead.count(),
    db.product.count(),
    db.storeOrder.findMany(),
    db.reviewArticle.count(),
    db.affiliateClick.count(),
    db.linkPage.count(),
    db.linkItem.findMany(),
    db.jobApplication.findMany(),
    db.portfolioProject.count(),
  ])

  const newLeads = await db.freelanceLead.count({ where: { status: 'new' } })
  const wonLeads = await db.freelanceLead.count({ where: { status: 'won' } })
  const interviewCount = await db.jobApplication.count({
    where: { status: 'interview' },
  })
  const offerCount = await db.jobApplication.count({
    where: { status: 'offer' },
  })

  const storeRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalLinkClicks = linkItems.reduce((sum, l) => sum + l.clicks, 0)

  // Projected monthly earnings (a transparent estimate, not real income)
  const freelanceProjected = wonLeads * 350
  const storeProjected = storeRevenue
  const affiliateProjected = clicks * 4 // ~$4 avg commission per click
  const linkforgeProjected = linkPages * 9 // pro plan $9/mo

  return NextResponse.json({
    counts: {
      services,
      leads,
      newLeads,
      wonLeads,
      products,
      orders: orders.length,
      articles,
      affiliateClicks: clicks,
      linkPages,
      totalLinkClicks,
      applications: applications.length,
      interviewCount,
      offerCount,
      portfolio,
    },
    earnings: {
      storeRevenue,
      freelanceProjected,
      storeProjected,
      affiliateProjected,
      linkforgeProjected,
      total:
        storeRevenue +
        freelanceProjected +
        affiliateProjected +
        linkforgeProjected,
    },
  })
}
