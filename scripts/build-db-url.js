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
    // Durante el build, las variables pueden no estar disponibles
    // Usar una URL dummy para que Prisma pueda generar el cliente
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5432/dummy?sslmode=disable';
      console.log('⚠️  Usando DATABASE_URL dummy para build (se configurará en runtime)');
    } else {
      console.error('❌ Faltan variables requeridas para construir DATABASE_URL');
      process.exit(1);
    }
  }
} else if (!process.env.DATABASE_URL) {
  // Durante el build, usar una URL dummy
  if (process.env.NODE_ENV === 'production' || process.env.CI) {
    process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5432/dummy?sslmode=disable';
    console.log('⚠️  Usando DATABASE_URL dummy para build (se configurará en runtime)');
  } else {
    console.error('❌ DATABASE_URL no está definida y no hay variables POSTGRES_* disponibles');
    process.exit(1);
  }
}

