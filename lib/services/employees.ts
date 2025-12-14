import prisma from '../prisma/client'
import { Employee } from '../types'
import { Prisma } from '@prisma/client'

export async function getEmployees(companyId: string): Promise<Employee[]> {
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: {
      fullName: 'asc',
    },
  })

  return employees.map((e) => ({
    id: e.id,
    companyId: e.companyId,
    userId: e.userId ?? undefined,
    fullName: e.fullName,
    role: e.role,
    positionIds: e.positionIds,
    weeklyHours: Number(e.weeklyHours),
    isActive: e.isActive,
    location: e.location ?? undefined,
    allowedStartTime: e.allowedStartTime ?? undefined,
    allowedEndTime: e.allowedEndTime ?? undefined,
    hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : undefined,
  }))
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee) return null

  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId ?? undefined,
    fullName: employee.fullName,
    role: employee.role,
    positionIds: employee.positionIds,
    weeklyHours: Number(employee.weeklyHours),
    isActive: employee.isActive,
    location: employee.location ?? undefined,
    allowedStartTime: employee.allowedStartTime ?? undefined,
    allowedEndTime: employee.allowedEndTime ?? undefined,
    hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
  }
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const employee = await prisma.employee.findFirst({
    where: { userId },
  })

  if (!employee) return null

  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId ?? undefined,
    fullName: employee.fullName,
    role: employee.role,
    positionIds: employee.positionIds,
    weeklyHours: Number(employee.weeklyHours),
    isActive: employee.isActive,
    location: employee.location ?? undefined,
    allowedStartTime: employee.allowedStartTime ?? undefined,
    allowedEndTime: employee.allowedEndTime ?? undefined,
    hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
  }
}

export async function saveEmployee(employee: Employee): Promise<Employee> {
  const data = await prisma.employee.upsert({
    where: { id: employee.id },
    create: {
      id: employee.id,
      companyId: employee.companyId,
      userId: employee.userId ?? null,
      fullName: employee.fullName,
      role: employee.role,
      positionIds: employee.positionIds,
      weeklyHours: new Prisma.Decimal(employee.weeklyHours),
      isActive: employee.isActive,
      location: employee.location ?? null,
      allowedStartTime: employee.allowedStartTime ?? null,
      allowedEndTime: employee.allowedEndTime ?? null,
      hourlyRate: employee.hourlyRate ? new Prisma.Decimal(employee.hourlyRate) : null,
    },
    update: {
      userId: employee.userId ?? null,
      fullName: employee.fullName,
      role: employee.role,
      positionIds: employee.positionIds,
      weeklyHours: new Prisma.Decimal(employee.weeklyHours),
      isActive: employee.isActive,
      location: employee.location ?? null,
      allowedStartTime: employee.allowedStartTime ?? null,
      allowedEndTime: employee.allowedEndTime ?? null,
      hourlyRate: employee.hourlyRate ? new Prisma.Decimal(employee.hourlyRate) : null,
    },
  })

  return {
    id: data.id,
    companyId: data.companyId,
    userId: data.userId ?? undefined,
    fullName: data.fullName,
    role: data.role,
    positionIds: data.positionIds,
    weeklyHours: Number(data.weeklyHours),
    isActive: data.isActive,
    location: data.location ?? undefined,
    allowedStartTime: data.allowedStartTime ?? undefined,
    allowedEndTime: data.allowedEndTime ?? undefined,
    hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
  }
}
