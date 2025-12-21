#!/usr/bin/env node
// Script para construir DATABASE_URL desde variables separadas de Easypanel

if (!process.env.DATABASE_URL && process.env.POSTGRES_HOST) {
  const username = process.env.POSTGRES_USERNAME || 'postgres';
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DATABASE;
  
  if (password && host && database) {
    process.env.DATABASE_URL = `postgres://${username}:${password}@${host}:${port}/${database}?sslmode=disable`;
    console.log('✅ Construida DATABASE_URL desde variables separadas de Easypanel');
  } else {
    console.error('❌ Faltan variables requeridas para construir DATABASE_URL');
    process.exit(1);
  }
} else if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida y no hay variables POSTGRES_* disponibles');
  process.exit(1);
}

