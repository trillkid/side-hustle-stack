import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/setup — seeds the database if it's empty.
// Visit this URL once after deploying to Vercel to populate demo data.
// Safe to call multiple times — it checks for existing data first.
export async function GET() {
  const steps: string[] = []

  try {
    // Check if already seeded
    const existingServices = await db.freelanceService.count()
    if (existingServices > 0) {
      return NextResponse.json({
        ok: true,
        alreadySeeded: true,
        message: 'Database already has data. No changes made.',
        counts: {
          services: existingServices,
          products: await db.product.count(),
          articles: await db.reviewArticle.count(),
          linkPages: await db.linkPage.count(),
        },
      })
    }

    // ---------- AppSettings ----------
    await db.appSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
    steps.push('AppSettings initialized')

    // ---------- Freelance services ----------
    const services = await Promise.all([
      db.freelanceService.create({
        data: {
          title: 'Landing Page Build',
          description:
            'A high-converting, responsive landing page in Next.js + Tailwind. Delivered in 3 days.',
          price: 450,
          category: 'Web Development',
          icon: 'Globe',
        },
      }),
      db.freelanceService.create({
        data: {
          title: 'Logo & Brand Pack',
          description:
            'Custom logo, colour palette, and font pairing. 3 concepts + unlimited revisions.',
          price: 220,
          category: 'Design',
          icon: 'Palette',
        },
      }),
      db.freelanceService.create({
        data: {
          title: 'Blog Article (1000 words)',
          description:
            'SEO-optimized long-form article on any topic. Includes keyword research.',
          price: 120,
          category: 'Writing',
          icon: 'PenLine',
        },
      }),
      db.freelanceService.create({
        data: {
          title: '1-on-1 Code Review',
          description:
            '60-minute live review of your codebase with actionable feedback.',
          price: 90,
          category: 'Mentoring',
          icon: 'Code2',
        },
      }),
    ])
    steps.push(`Created ${services.length} freelance services`)

    // ---------- Products ----------
    await db.product.createMany({
      data: [
        { name: 'Notion Productivity OS', description: 'A complete Notion template to run your life & side hustle in one dashboard.', price: 29, image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800', category: 'Template' },
        { name: 'Freelancer Invoice Pack', description: '12 editable invoice + contract templates for solo freelancers.', price: 19, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', category: 'Template' },
        { name: 'Lightroom Preset Bundle', description: '30 cinematic presets for moody Instagram feeds.', price: 24, image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800', category: 'Preset' },
        { name: 'Side Hustle eBook', description: 'A 90-page guide: 25 weekend side hustles you can start with under $100.', price: 15, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', category: 'eBook' },
        { name: 'Canva Social Media Kit', description: '120 drag-and-drop post templates for Instagram & TikTok.', price: 35, image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800', category: 'Template' },
        { name: 'Resume Revamp Kit', description: 'ATS-friendly resume + cover letter templates with a guide.', price: 17, image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800', category: 'Template' },
      ],
    })
    steps.push('Created 6 products')

    // ---------- Affiliate articles ----------
    await db.reviewArticle.createMany({
      data: [
        { title: 'Blue Yeti X Review', slug: 'blue-yeti-x-review', excerpt: 'We tested the Yeti X for 30 days of podcasting.', content: '## Sound quality\n\nThe Yeti X delivers crisp, broadcast-ready audio.\n\n**Rating: 4.6/5**', category: 'Audio Gear', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800', affiliateUrl: 'https://www.amazon.com/dp/B07VNTKZ81', productName: 'Blue Yeti X' },
        { title: 'Logitech MX Master 3S Review', slug: 'logitech-mx-master-3s-review', excerpt: 'Silent clicks, MagSpeed scroll, and 70-day battery.', content: '## Why it wins\n\nThe MagSpeed wheel is a game changer.\n\n**Rating: 4.8/5**', category: 'Desk Setup', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', affiliateUrl: 'https://www.amazon.com/dp/B09HM94VDS', productName: 'Logitech MX Master 3S' },
        { title: 'Sony WH-1000XM5 Review', slug: 'sony-wh-1000xm5-review', excerpt: 'The best noise-cancelling headphones in 2025.', content: '## ANC\n\nClass-leading noise cancellation.\n\n**Rating: 4.9/5**', category: 'Audio Gear', rating: 5, imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH', productName: 'Sony WH-1000XM5' },
      ],
    })
    steps.push('Created 3 affiliate articles')

    // ---------- LinkForge default page ----------
    const page = await db.linkPage.create({
      data: { slug: 'demo', title: 'Your Name', bio: 'Freelance designer & developer.', themeColor: '#10b981', plan: 'pro' },
    })
    await db.linkItem.createMany({
      data: [
        { pageId: page.id, label: 'Portfolio', url: 'https://example.com', order: 0, clicks: 0 },
        { pageId: page.id, label: 'Newsletter', url: 'https://substack.com', order: 1, clicks: 0 },
        { pageId: page.id, label: 'Follow on X', url: 'https://x.com', order: 2, clicks: 0 },
      ],
    })
    steps.push('Created default LinkForge page')

    return NextResponse.json({
      ok: true,
      alreadySeeded: false,
      message: 'Database seeded successfully!',
      steps,
      counts: {
        services: await db.freelanceService.count(),
        products: await db.product.count(),
        articles: await db.reviewArticle.count(),
        linkPages: await db.linkPage.count(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, steps },
      { status: 500 }
    )
  }
}
