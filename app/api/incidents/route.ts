import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tasks: {
        include: { result: true },
        orderBy: { id: 'asc' },
      },
      postmortem: true,
    },
  })

  return NextResponse.json(incidents)
}
