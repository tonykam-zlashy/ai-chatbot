from contextvars import ContextVar

from core.migration import Migration
from util.database import create_db_engine
from app_factory import TAgenticApp
app = TAgenticApp.get_app()

_base_model_db_ctx = ContextVar("db")


async def cleanup_session(request):
    if getattr(request.ctx, "db_closed", False):
        return

    request.ctx.db_closed = True
    db = getattr(request.ctx, "db", None)
    token = getattr(request.ctx, "db_ctx_token", None)

    try:
        if db is not None:
            try:
                if db.in_transaction():
                    await db.rollback()
            finally:
                await db.close()
    finally:
        if token is not None:
            try:
                _base_model_db_ctx.reset(token)
            except RuntimeError:
                pass
            request.ctx.db_ctx_token = None


@app.middleware("request")
async def inject_session(request):
    request.ctx.db = app.config['sessionmaker']()
    request.ctx.db_ctx_token = _base_model_db_ctx.set(request.ctx.db)


@app.middleware("response")
async def close_session(request, response):
    await cleanup_session(request)


@app.listener('before_server_start')
async def connect_db(app, loop):
    db_engine, _sessionmaker = create_db_engine(app)
    app.config['db'] = db_engine
    app.config['sessionmaker'] = _sessionmaker
    await Migration.init(app.config['sessionmaker'](), app)


@app.listener('before_server_stop')
async def disconnect_db(app, loop):
    await app.config['db'].dispose()
