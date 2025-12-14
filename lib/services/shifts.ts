import prisma from '../prisma/client'
import { Shift, ShiftStatus } from '../types'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function mapShiftToType(s: any): Shift {
  return {
    id: s.id,
    companyId: s.companyId,
    employeeId: s.employeeId,
    employeeName: s.employeeName ?? undefined,
    date: formatDate(s.date),
    startTime: s.startTime,
    endTime: s.endTime,
    role: s.role ?? undefined,
    positionId: s.positionId ?? undefined,
    status: s.status as ShiftStatus,
    checkInTime: s.checkInTime?.toISOString(),
    checkOutTime: s.checkOutTime?.toISOString(),
  }
}

export async function getShifts(companyId: string, weekStart: string, weekEnd: string): Promise<Shift[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      companyId,
      date: {
        gte: new Date(weekStart),
        lte: new Date(weekEnd),
      },
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  })

  return shifts.map(mapShiftToType)
}

export async function getEmployeeShifts(companyId: string, employeeId: string): Promise<Shift[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      companyId,
      employeeId,
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  })

  return shifts.map(mapShiftToType)
}

export async function getShiftsByDateRange(
  companyId: string,
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<Shift[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      companyId,
      employeeId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  return shifts.map(mapShiftToType)
}

export async function saveShift(shift: Shift): Promise<Shift> {
  const data = await prisma.shift.upsert({
    where: { id: shift.id },
    create: {
      id: shift.id,
      companyId: shift.companyId,
      employeeId: shift.employeeId,
      employeeName: shift.employeeName ?? null,
      date: new Date(shift.date),
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role ?? null,
      positionId: shift.positionId ?? null,
      status: shift.status,
      checkInTime: shift.checkInTime ? new Date(shift.checkInTime) : null,
      checkOutTime: shift.checkOutTime ? new Date(shift.checkOutTime) : null,
    },
    update: {
      employeeName: shift.employeeName ?? null,
      date: new Date(shift.date),
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role ?? null,
      positionId: shift.positionId ?? null,
      status: shift.status,
      checkInTime: shift.checkInTime ? new Date(shift.checkInTime) : null,
      checkOutTime: shift.checkOutTime ? new Date(shift.checkOutTime) : null,
    },
  })

  return mapShiftToType(data)
}

export async function updateShiftStatus(shiftId: string, status: ShiftStatus): Promise<void> {
  await prisma.shift.update({
    where: { id: shiftId },
    data: { status },
  })
}

export async function deleteShift(shiftId: string): Promise<void> {
  await prisma.shift.delete({
    where: { id: shiftId },
  })
}

export async function checkInShift(shiftId: string): Promise<void> {
  await prisma.shift.update({
    where: { id: shiftId },
    data: { checkInTime: new Date() },
  })
}

export async function checkOutShift(shiftId: string): Promise<void> {
  const checkOutTime = new Date()

  await prisma.$transaction([
    prisma.shiftBreak.updateMany({
      where: {
        shiftId,
        breakOut: null,
      },
      data: {
        breakOut: checkOutTime,
      },
    }),
    prisma.shift.update({
      where: { id: shiftId },
      data: { checkOutTime },
    }),
  ])
}
