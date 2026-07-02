import { db } from '../src/lib/db'

async function main() {
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

  await db.freelanceLead.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      message: 'Need a landing page for my pottery studio. Looking to launch in 2 weeks.',
      serviceId: services[0].id,
      status: 'new',
    },
  })
  await db.freelanceLead.create({
    data: {
      name: 'Marcus Lee',
      email: 'marcus@example.com',
      message: 'Interested in a logo refresh for my coffee roastery.',
      serviceId: services[1].id,
      status: 'contacted',
    },
  })

  // ---------- Products ----------
  await db.product.createMany({
    data: [
      {
        name: 'Notion Productivity OS',
        description:
          'A complete Notion template to run your life & side hustle in one dashboard.',
        price: 29,
        image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800',
        category: 'Template',
      },
      {
        name: 'Freelancer Invoice Pack',
        description: '12 editable invoice + contract templates for solo freelancers.',
        price: 19,
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        category: 'Template',
      },
      {
        name: 'Lightroom Preset Bundle',
        description: '30 cinematic presets for moody Instagram feeds.',
        price: 24,
        image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
        category: 'Preset',
      },
      {
        name: 'Side Hustle eBook',
        description:
          'A 90-page guide: 25 weekend side hustles you can start with under $100.',
        price: 15,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
        category: 'eBook',
      },
      {
        name: 'Canva Social Media Kit',
        description: '120 drag-and-drop post templates for Instagram & TikTok.',
        price: 35,
        image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800',
        category: 'Template',
      },
      {
        name: 'Resume Revamp Kit',
        description: 'ATS-friendly resume + cover letter templates with a guide.',
        price: 17,
        image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
        category: 'Template',
      },
    ],
  })

  // ---------- Affiliate articles ----------
  await db.reviewArticle.createMany({
    data: [
      {
        title: 'Blue Yeti X Review: Still the Best USB Mic in 2025?',
        slug: 'blue-yeti-x-review',
        excerpt:
          'We tested the Yeti X for 30 days of podcasting. Here is the honest verdict for content creators.',
        content:
          '## Sound quality\n\nThe Yeti X delivers crisp, broadcast-ready audio with a four-capsule array. Compared to the original Yeti, vocals are noticeably warmer.\n\n## Verdict\n\nFor under $170, it is the easiest upgrade for new podcasters. Pair it with a boom arm and a pop filter and you are set.\n\n**Rating: 4.6/5**',
        category: 'Audio Gear',
        rating: 5,
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800',
        affiliateUrl: 'https://www.amazon.com/dp/B07VNTKZ81',
        productName: 'Blue Yeti X',
      },
      {
        title: 'Logitech MX Master 3S: The Productivity Mouse',
        slug: 'logitech-mx-master-3s-review',
        excerpt:
          'Silent clicks, MagSpeed scroll, and 70-day battery. Is it worth $99 for knowledge workers?',
        content:
          '## Why it wins\n\nThe MagSpeed wheel switches between ratchet and free-spin instantly. For long docs and spreadsheets it is a game changer.\n\n## Downsides\n\nIt is heavy for gamers, but for productivity this is the king.\n\n**Rating: 4.8/5**',
        category: 'Desk Setup',
        rating: 5,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
        affiliateUrl: 'https://www.amazon.com/dp/B09HM94VDS',
        productName: 'Logitech MX Master 3S',
      },
      {
        title: 'Keychron K3 Low-Profile Keyboard Review',
        slug: 'keychron-k3-review',
        excerpt:
          'A slim mechanical keyboard that fits in a laptop bag. We typed 50k words on it.',
        content:
          '## Typing feel\n\nLow-profile red switches are quiet and fast. Great for offices and cafes.\n\n## Connectivity\n\nBluetooth pairs with 3 devices; switching is a key combo away.\n\n**Rating: 4.4/5**',
        category: 'Desk Setup',
        rating: 4,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
        affiliateUrl: 'https://www.keychron.com/products/keychron-k3-wireless-mechanical-keyboard',
        productName: 'Keychron K3',
      },
    ],
  })

  // ---------- LinkForge default page ----------
  const page = await db.linkPage.create({
    data: {
      slug: 'demo',
      title: 'Your Name',
      bio: 'Freelance designer & developer. Building things on the internet.',
      themeColor: '#10b981',
      plan: 'pro',
    },
  })
  await db.linkItem.createMany({
    data: [
      { pageId: page.id, label: 'Portfolio Website', url: 'https://example.com', order: 0, clicks: 42 },
      { pageId: page.id, label: 'Book a 1:1 Call', url: 'https://cal.com', order: 1, clicks: 28 },
      { pageId: page.id, label: 'My Newsletter', url: 'https://substack.com', order: 2, clicks: 15 },
      { pageId: page.id, label: 'Follow on X', url: 'https://x.com', order: 3, clicks: 9 },
    ],
  })

  // ---------- Job applications ----------
  await db.jobApplication.createMany({
    data: [
      { company: 'Shopify', role: 'Frontend Engineer', status: 'interview', salary: '$120k', link: 'https://shopify.com/careers' },
      { company: 'Wealthsimple', role: 'Full Stack Developer', status: 'applied', salary: '$110k' },
      { company: 'Lightspeed', role: 'React Developer', status: 'wishlist', salary: '$105k' },
      { company: 'Google', role: 'Software Engineer II', status: 'rejected' },
      { company: 'Wave Financial', role: 'Product Engineer', status: 'offer', salary: '$130k' },
    ],
  })

  // ---------- Portfolio ----------
  await db.portfolioProject.createMany({
    data: [
      { title: 'Coffee Shop Landing', description: 'A landing page for a local roastery. Built with Next.js.', url: 'https://example.com', tags: 'Next.js,Tailwind,Design' },
      { title: 'Budget Tracker App', description: 'A personal finance PWA with charts and CSV export.', url: 'https://example.com', tags: 'React,Charts,PWA' },
      { title: 'Recipe Finder', description: 'Search 1M recipes by ingredients you already have.', url: 'https://example.com', tags: 'React,API' },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
