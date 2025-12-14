import prisma from '../prisma/client'
import { Availability } from '../types'

export async function getAvailability(employeeId: string): Promise<Availability[]> {
  const availability = await prisma.availability.findMany({
    where: { employeeId },
    orderBy: { weekday: 'asc' },
  })

  return availability.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    weekday: a.weekday,
    startTime: a.startTime,
    endTime: a.endTime,
  }))
}

export async function saveAvailability(availabilities: Availability[], employeeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.availability.deleteMany({
      where: { employeeId },
    })

    if (availabilities.length === 0) return

    await tx.availability.createMany({
      data: availabilities.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        weekday: a.weekday,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    })
  })
}
