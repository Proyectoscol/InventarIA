# 🚀 Configuración del Repositorio en GitHub

## Pasos para Crear el Repositorio

### Opción 1: Usando GitHub CLI (Recomendado)

Si tienes GitHub CLI instalado:

```bash
# Crear repositorio y hacer push
gh repo create InventarIA --public --source=. --remote=origin --push
```

### Opción 2: Desde la Web de GitHub

1. **Crear el repositorio en GitHub:**
   - Ve a https://github.com/new
   - Nombre del repositorio: `InventarIA`
   - Descripción: "Sistema de Gestión de Inventario Multi-Compañía con Alertas Automatizadas"
   - Visibilidad: Público o Privado (tu elección)
   - **NO** inicialices con README, .gitignore o licencia (ya los tenemos)
   - Click en "Create repository"

2. **Conectar y hacer push:**
   ```bash
   # Agregar el remote
   git remote add origin https://github.com/TU-USUARIO/InventarIA.git
   
   # Cambiar a branch main si estás en otra
   git branch -M main
   
   # Hacer push
   git push -u origin main
   ```

### Opción 3: Usando SSH

Si prefieres usar SSH:

```bash
# Agregar el remote con SSH
git remote add origin git@github.com:TU-USUARIO/InventarIA.git

# Cambiar a branch main
git branch -M main

# Hacer push
git push -u origin main
```

## Verificación

Una vez hecho el push, verifica:

1. Ve a `https://github.com/TU-USUARIO/InventarIA`
2. Deberías ver todos los archivos del proyecto
3. El README.md debería mostrarse en la página principal

## Comandos Útiles

```bash
# Ver el estado del repositorio
git status

# Ver los remotes configurados
git remote -v

# Ver los commits
git log --oneline

# Agregar cambios futuros
git add .
git commit -m "Descripción del cambio"
git push
```

## Notas

- El repositorio incluye todos los archivos necesarios
- Los archivos `.env*` están en `.gitignore` (no se subirán)
- `node_modules` está ignorado
- Las migraciones de Prisma están ignoradas (se generan en deploy)

