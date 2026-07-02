import { db } from '../src/lib/db'

async function main() {
  // ---------- More products ----------
  const products = [
    {
      name: 'Etsy Shop Launch Kit',
      description: '40 product description templates, pricing calculator, and a launch checklist for new Etsy sellers.',
      price: 27,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      category: 'Template',
    },
    {
      name: 'YouTube Thumbnail Pack',
      description: '25 editable Photoshop thumbnails proven to boost click-through rates. Beginner friendly.',
      price: 22,
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800',
      category: 'Preset',
    },
    {
      name: 'Stock Photo Bundle (200 photos)',
      description: '200 high-res, royalty-free photos of coffee, plants, and workspace aesthetics. Commercial use OK.',
      price: 39,
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
      category: 'Asset',
    },
    {
      name: 'Meal Prep Planner Notion',
      description: 'Plan 4 weeks of meals, auto-generate grocery lists, and track macros. All in Notion.',
      price: 18,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      category: 'Template',
    },
    {
      name: 'Fitness Program eBook',
      description: 'A 12-week home workout program with video links. No equipment needed.',
      price: 25,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      category: 'eBook',
    },
    {
      name: 'Color Palette Swatch Pack',
      description: '60 curated color palettes for designers, in HEX, RGB, and Tailwind config format.',
      price: 14,
      image: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800',
      category: 'Asset',
    },
  ]
  for (const p of products) {
    await db.product.create({ data: p })
  }
  console.log(`Added ${products.length} products`)

  // ---------- More affiliate articles ----------
  const articles = [
    {
      title: 'Sony WH-1000XM5 Review: The King of Noise-Cancelling',
      slug: 'sony-wh-1000xm5-review',
      excerpt: '30 hours of battery, class-leading ANC, and LDAC support. Is the $400 price tag justified?',
      content: '## Noise cancelling\n\nSony\'s ANC is the best in class, edging out Bose for plane cabin noise.\n\n## Sound\n\nWarm, detailed, with great LDAC wireless fidelity.\n\n## Verdict\n\nWorth every penny for commuters and remote workers.\n\n**Rating: 4.9/5**',
      category: 'Audio Gear',
      rating: 5,
      imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
      affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH',
      productName: 'Sony WH-1000XM5',
    },
    {
      title: 'Elgato Stream Deck MK.2: A Creator\'s Best Friend',
      slug: 'elgato-stream-deck-mk2-review',
      excerpt: '15 LCD keys that automate anything. We used it for streaming, video editing, and Zoom calls.',
      content: '## Why it\'s magic\n\nOne tap to switch scenes, mute, launch apps, or paste text. The time savings add up fast.\n\n## For non-streamers\n\nEven if you never stream, the Stream Deck is a productivity beast.\n\n**Rating: 4.7/5**',
      category: 'Creator Gear',
      rating: 5,
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
      affiliateUrl: 'https://www.amazon.com/dp/B0855J83Z8',
      productName: 'Elgato Stream Deck MK.2',
    },
    {
      title: 'Anker 737 Power Bank Review: Charge Everything',
      slug: 'anker-737-power-bank-review',
      excerpt: '120W, 24,000mAh, charges a MacBook and iPhone at once. The only power bank you need?',
      content: '## Speed\n\n120W output charges a MacBook Pro to 50% in 30 minutes.\n\n## Capacity\n\n24,000mAh recharges a phone 4-5 times.\n\n**Rating: 4.6/5**',
      category: 'Mobile Gear',
      rating: 5,
      imageUrl: 'https://images.unsplash.com/photo-1609592424823-1a1ddb5d7c5e?w=800',
      affiliateUrl: 'https://www.amazon.com/dp/B0B53V8C7M',
      productName: 'Anker 737 Power Bank',
    },
    {
      title: 'Rode PodMic USB Review: Podcasting Made Simple',
      slug: 'rode-podmic-usb-review',
      excerpt: 'A plug-and-play podcast mic with built-in DSP. Great sound, no interface required.',
      content: '## Setup\n\nTruly plug-and-play. USB-C in, record.\n\n## Sound\n\nWarm, broadcast tone with the built-in pop filter doing real work.\n\n**Rating: 4.5/5**',
      category: 'Audio Gear',
      rating: 5,
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800',
      affiliateUrl: 'https://www.amazon.com/dp/B0B6C7GZ9K',
      productName: 'Rode PodMic USB',
    },
  ]
  for (const a of articles) {
    await db.reviewArticle.create({ data: a })
  }
  console.log(`Added ${articles.length} articles`)

  // ---------- More LinkForge pages ----------
  const pages = [
    {
      slug: 'creator',
      title: 'Alex Creator',
      bio: 'YouTuber & photographer. New videos every Tuesday.',
      themeColor: '#f43f5e',
      plan: 'pro' as const,
    },
    {
      slug: 'studio',
      title: 'Maple Studio',
      bio: 'A boutique design studio in Toronto. We build brands that stick.',
      themeColor: '#14b8a6',
      plan: 'free' as const,
    },
    {
      slug: 'writes',
      title: 'Sam Writes',
      bio: 'Freelance writer sharing essays, newsletters, and client work.',
      themeColor: '#f59e0b',
      plan: 'pro' as const,
    },
  ]

  for (const p of pages) {
    const page = await db.linkPage.create({ data: p })
    const links = [
      { pageId: page.id, label: 'Latest Video', url: 'https://youtube.com', order: 0, clicks: 0 },
      { pageId: page.id, label: 'Newsletter', url: 'https://substack.com', order: 1, clicks: 0 },
      { pageId: page.id, label: 'Instagram', url: 'https://instagram.com', order: 2, clicks: 0 },
      { pageId: page.id, label: 'Book a Call', url: 'https://cal.com', order: 3, clicks: 0 },
    ]
    await db.linkItem.createMany({ data: links })
  }
  console.log(`Added ${pages.length} link pages`)

  // Summary
  const counts = {
    products: await db.product.count(),
    articles: await db.reviewArticle.count(),
    linkPages: await db.linkPage.count(),
    linkItems: await db.linkItem.count(),
  }
  console.log('Totals now:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
