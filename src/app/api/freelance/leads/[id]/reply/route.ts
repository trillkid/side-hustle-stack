import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

export const maxDuration = 30

// Draft a personalized, professional reply to a freelance lead using the LLM.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const lead = await db.freelanceLead.findUnique({
    where: { id },
    include: { service: true },
  })
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  let tone = 'warm and professional'
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.tone && typeof body.tone === 'string') {
      tone = body.tone as string
    }
  } catch {
    // ignore body parse errors
  }

  const serviceName = lead.service?.title ?? 'your project'
  const servicePrice = lead.service?.price
  const serviceDesc = lead.service?.description ?? ''
  const priceLine = servicePrice
    ? `The listed price for this service is $${servicePrice.toFixed(2)} CAD.`
    : ''

  const systemPrompt = `You are a skilled freelance professional writing a reply email to a potential client who just submitted a lead through their freelance website. The goal is to win the client's business.

Write the email with these qualities:
- Tone: ${tone}.
- Short (120-180 words). Scannable. No walls of text.
- Start with a friendly greeting using the lead's name.
- Acknowledge their specific request and show you understand it.
- Briefly establish credibility relevant to what they asked for.
- Ask ONE clear, specific question to move the conversation forward (e.g. timeline, scope details, a quick call).
- Do NOT invent phone numbers, addresses, portfolio URLs, or social handles.
- End with a simple sign-off like "Best regards,\\n[Your name]" — keep the bracketed placeholder so the freelancer fills it in.
- ${priceLine ? `Mention the price naturally if it fits: ${priceLine}` : 'Do not mention a price.'}

Return ONLY the email body text. No subject line, no explanation, no markdown formatting beyond simple line breaks.`

  const userPrompt = `Lead details:
- Client name: ${lead.name}
- Client email: ${lead.email}
- Service they're interested in: ${serviceName}
- Service description: ${serviceDesc}
- Their message: "${lead.message}"

Write the reply email now. Remember: only the email body, ${tone} tone, 120-180 words, end with a sign-off placeholder.`

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const draft =
      completion.choices[0]?.message?.content?.trim() ??
      'Hi ' +
        lead.name.split(' ')[0] +
        ',\n\nThanks for reaching out! I would love to help with ' +
        serviceName +
        '. Could we set up a quick call this week to go over the details?\n\nBest regards,\n[Your name]'

    // Suggested subject line for the mailto link
    const subject = `Re: Your ${serviceName.toLowerCase()} enquiry`

    return NextResponse.json({
      draft,
      subject,
      to: lead.email,
      leadName: lead.name,
    })
  } catch (err) {
    console.error('[reply] LLM error:', err)
    // Fallback draft so the UI still works if the model is unavailable
    const first = lead.name.split(' ')[0] || 'there'
    const fallback = `Hi ${first},\n\nThanks so much for reaching out about ${serviceName.toLowerCase()} — it sounds like a great fit and I would love to help.\n\nBased on your message, I have a couple of quick questions to make sure I scope it right. Would you be open to a 15-minute call this week? I am free most afternoons.\n\nBest regards,\n[Your name]`
    return NextResponse.json({
      draft: fallback,
      subject: `Re: Your ${serviceName.toLowerCase()} enquiry`,
      to: lead.email,
      leadName: lead.name,
      warning:
        'The AI service was unavailable, so a simple template reply was generated instead. You can still edit and send it.',
    })
  }
}
