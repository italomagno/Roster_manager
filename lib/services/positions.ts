import prisma from '../prisma/client'
import { Position } from '../types'

export async function getPositions(companyId: string): Promise<Position[]> {
  const positions = await prisma.position.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  })

  return positions.map((p) => ({
    id: p.id,
    companyId: p.companyId,
    name: p.name,
    color: p.color,
  }))
}

export async function savePosition(position: Position): Promise<Position> {
  const data = await prisma.position.upsert({
    where: { id: position.id },
    create: {
      id: position.id,
      companyId: position.companyId,
      name: position.name,
      color: position.color,
    },
    update: {
      name: position.name,
      color: position.color,
    },
  })

  return {
    id: data.id,
    companyId: data.companyId,
    name: data.name,
    color: data.color,
  }
}

export async function deletePosition(positionId: string): Promise<void> {
  await prisma.position.delete({
    where: { id: positionId },
  })
}
