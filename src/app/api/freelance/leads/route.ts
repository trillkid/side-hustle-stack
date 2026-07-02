import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET() {
  try {
    const leads = await db.freelanceLead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { service: true },
    })
    return NextResponse.json(leads)
  } catch (err) {
    console.error('[freelance/leads GET]', err)
    return NextResponse.json(
      { error: 'Failed to load leads' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const message =
      typeof body.message === 'string' ? body.message.trim() : ''
    const serviceId =
      typeof body.serviceId === 'string' && body.serviceId.trim().length > 0
        ? body.serviceId.trim()
        : null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // If a serviceId was provided, verify it exists & is active
    if (serviceId) {
      const service = await db.freelanceService.findUnique({
        where: { id: serviceId },
        select: { id: true, active: true },
      })
      if (!service || !service.active) {
        return NextResponse.json(
          { error: 'Selected service is not available' },
          { status: 400 }
        )
      }
    }

    const lead = await db.freelanceLead.create({
      data: {
        name,
        email,
        message,
        serviceId,
        status: 'new',
      },
      include: { service: true },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (err) {
    console.error('[freelance/leads POST]', err)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
