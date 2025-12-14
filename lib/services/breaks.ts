import prisma from '../prisma/client'
import { ShiftBreak } from '../types'

export async function getBreaks(shiftId: string): Promise<ShiftBreak[]> {
  const breaks = await prisma.shiftBreak.findMany({
    where: { shiftId },
    orderBy: { breakIn: 'asc' },
  })

  return breaks.map((b) => ({
    id: b.id,
    companyId: b.companyId,
    shiftId: b.shiftId,
    employeeId: b.employeeId,
    breakIn: b.breakIn.toISOString(),
    breakOut: b.breakOut?.toISOString(),
  }))
}

export async function getAllBreaks(companyId: string): Promise<ShiftBreak[]> {
  const breaks = await prisma.shiftBreak.findMany({
    where: { companyId },
    orderBy: { breakIn: 'desc' },
  })

  return breaks.map((b) => ({
    id: b.id,
    companyId: b.companyId,
    shiftId: b.shiftId,
    employeeId: b.employeeId,
    breakIn: b.breakIn.toISOString(),
    breakOut: b.breakOut?.toISOString(),
  }))
}

export async function saveShiftBreak(shiftBreak: ShiftBreak): Promise<void> {
  await prisma.shiftBreak.upsert({
    where: { id: shiftBreak.id },
    create: {
      id: shiftBreak.id,
      companyId: shiftBreak.companyId,
      shiftId: shiftBreak.shiftId,
      employeeId: shiftBreak.employeeId,
      breakIn: new Date(shiftBreak.breakIn),
      breakOut: shiftBreak.breakOut ? new Date(shiftBreak.breakOut) : null,
    },
    update: {
      breakIn: new Date(shiftBreak.breakIn),
      breakOut: shiftBreak.breakOut ? new Date(shiftBreak.breakOut) : null,
    },
  })
}
