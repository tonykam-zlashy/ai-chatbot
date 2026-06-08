import logging
import json
import re
from functools import wraps

from sanic.exceptions import SanicException
from sanic.request.types import Request

from util.helper import get_remote_ip, get_path_base
from util.auth_cookie import add_auth_token_cookie
from core.error.account import AccountUnauthorized
from core.session import SessionToken
from core.account import CoreAccount


DEVICE_ID_HEADER = "X-Device-ID"
DEVICE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")


def setup_account_info(request, token):
    token = SessionToken.check(token)
    request.ctx.account_id = token['AccountId']


def get_guest_device_id(request: Request, required: bool = False) -> str | None:
    device_id = request.headers.get(DEVICE_ID_HEADER)
    if device_id is not None:
        device_id = device_id.strip()

    if not device_id:
        if required:
            raise SanicException("Missing Device ID", status_code=400)
        return None

    if not DEVICE_ID_PATTERN.fullmatch(device_id):
        raise SanicException("Invalid Device ID", status_code=400)
    return device_id


async def setup_guest_context(request: Request, account) -> None:
    request.ctx.guest_device_id = None
    if account is None:
        return

    account_third_party = await CoreAccount.get_third_party(request.ctx.db, request.ctx.account_id)
    is_public_guest = account_third_party is None and not account.Email and not account.Password
    if is_public_guest:
        request.ctx.guest_device_id = get_guest_device_id(request, required=False)


def check_login(request):
    auth = request.headers.get("Authorization")
    if auth is None:
        auth = request.cookies.get('token', None)
    if auth is None:
        raise AccountUnauthorized()

    auth_token = auth.split(' ')[-1]
    setup_account_info(request, auth_token)


async def ensure_login(request: Request):
    if request.app.config.AUTO_CREATE_ACCOUNT:
        return await auto_login(request)
    check_login(request)
    return None


def login_required(view):
    @wraps(view)
    async def decorated(*args, **kwargs):
        _, request = args

        on_response = await ensure_login(request)
        resp = await view(*args, **kwargs)
        if on_response:
            resp = on_response(resp)

        return resp

    return decorated


async def auto_login(request: Request):
    need_register = False
    request.ctx.guest_device_id = None
    try:
        check_login(request)
        # token 可解析，但需验证 account 是否仍存在于数据库中
        existing = await CoreAccount.get(request.ctx.db, request.ctx.account_id)
        if existing is None:
            need_register = True
        else:
            await setup_guest_context(request, existing)
    except AccountUnauthorized:
        need_register = True

    if need_register:
        device_id = get_guest_device_id(request, required=True)
        account = await CoreAccount.register(
            request.ctx.db,
            name='User',
            extra_info=json.dumps({"AuthType": "guest", "DeviceId": device_id}),
        )
        token = await CoreAccount.login(request.ctx.db, account, get_remote_ip(request))

        def on_response(resp):
            logging.info(
                '[auto_login] new account registed {}'.format(account.Id)
            )
            add_auth_token_cookie(
                resp,
                config=request.app.config,
                token=token,
                path=get_path_base(),
                max_age=315360000,
            )
            return resp
        setup_account_info(request, token)
        request.ctx.guest_device_id = device_id
        return on_response
    return None
