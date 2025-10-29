# Docker Setup (Optional)

**Note**: Docker is **NOT required** for this project. See [SIMPLE_SETUP.md](SIMPLE_SETUP.md) for the recommended simple setup.

This guide is only for users who prefer using Docker instead of installing PostgreSQL directly.

---

## Why You Might Skip Docker

For this simple installment-tracking app:

- ✅ **Simpler**: Direct PostgreSQL installation is faster
- ✅ **Lighter**: No virtualization overhead
- ✅ **Easier**: Fewer moving parts to troubleshoot
- ✅ **Sufficient**: No need for containerization in development

---

## If You Still Want Docker

### Option 1: Docker Desktop

1. **Download**: https://www.docker.com/products/docker-desktop/
2. **Install**: Run installer, select WSL 2
3. **Start**: Launch Docker Desktop
4. **Verify**: `docker --version`

### Option 2: Podman Desktop (Free Alternative)

1. **Download**: https://podman-desktop.io/
2. **Install**: Run installer
3. **Verify**: `podman --version`

---

## Using Docker Compose

If you have Docker installed:

```bash
cd D:\installment-system

# Start PostgreSQL
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs

# Stop
docker compose down
```

**Note**: Update `backend/.env` to use Docker credentials:

```env
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/myapp_dev
```

---

## Recommendation

**Use the simple setup instead**: [SIMPLE_SETUP.md](SIMPLE_SETUP.md)

Direct PostgreSQL installation is:

- Faster to set up
- Easier to manage
- More than sufficient for this application
- Better for learning and development
