import json
import pytest

from core.chat import CoreChat
from core.session import SessionToken


@pytest.mark.asyncio
async def test_error_create_account(app, account):
    post_json = json.dumps(account)

    # create account
    request, response = await app.asgi_client.post("/account/create", data = post_json)
    assert request.method.lower() == "post"
    assert response.status == 404


@pytest.mark.asyncio
async def test_auto_create_account_allows_public_protected_route(app):
    original_auto_create = app.config.AUTO_CREATE_ACCOUNT
    app.config.AUTO_CREATE_ACCOUNT = True
    try:
        request, response = await app.asgi_client.get(
            "/chat/conversations",
            headers={"X-Device-ID": "test-device-1"},
        )
    finally:
        app.config.AUTO_CREATE_ACCOUNT = original_auto_create

    assert request.method.lower() == "get"
    assert response.status == 200
    assert 'token' in response.cookies
    assert isinstance(json.loads(response.body.decode()), list)

    payload = SessionToken.check(response.cookies['token'])
    visitor_id = await CoreChat.resolve_vendor_account_id(payload['AccountId'], "test-device-1")
    assert visitor_id == "guest_test-device-1"


@pytest.mark.asyncio
async def test_auto_create_account_requires_device_id_for_public_route(app):
    original_auto_create = app.config.AUTO_CREATE_ACCOUNT
    app.config.AUTO_CREATE_ACCOUNT = True
    try:
        request, response = await app.asgi_client.get(
            "/chat/conversations",
            headers={"Authorization": "Bearer invalid-token"},
        )
    finally:
        app.config.AUTO_CREATE_ACCOUNT = original_auto_create

    assert request.method.lower() == "get"
    assert response.status == 400
