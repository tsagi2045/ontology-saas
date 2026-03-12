import { NextResponse } from 'next/server';
import { query, rowToEntity, rowToRelation, rowToClass, rowToPredicate, rowToRule } from '@/lib/db';
import { ensureInitialized } from '../../init/route';

export async function GET() {
  await ensureInitialized();

  const data = {
    classes: (await query('SELECT * FROM ontology_classes')).map(rowToClass),
    predicates: (await query('SELECT * FROM predicate_types')).map(rowToPredicate),
    entities: (await query('SELECT * FROM entities')).map(rowToEntity),
    relations: (await query('SELECT * FROM relations')).map(rowToRelation),
    rules: (await query('SELECT * FROM inference_rules')).map(rowToRule),
  };

  return NextResponse.json(data);
}
