import { createClient } from '../supabase/client'
import { Position } from '../types'

export async function getPositions(companyId: string): Promise<Position[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) throw error

  return (data || []).map((p: any) => ({
    id: p.id,
    companyId: p.company_id,
    name: p.name,
    color: p.color,
  }))
}

export async function savePosition(position: Position): Promise<Position> {
  const supabase = createClient()

  const payload = {
    id: position.id,
    company_id: position.companyId,
    name: position.name,
    color: position.color,
  }

  const { data, error } = await supabase
    .from('positions')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    companyId: data.company_id,
    name: data.name,
    color: data.color,
  }
}

export async function deletePosition(positionId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', positionId)

  if (error) throw error
}
