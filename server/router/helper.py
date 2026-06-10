import logging
import base64
import uuid

from sanic import json
from sanic.views import HTTPMethodView
from sanic.request.types import Request
from sanic.exceptions import SanicException
from router import login_required
from util.tca import asr_url, tc_request
from app_factory import TAgenticApp

app = TAgenticApp.get_app()


class TCADPHelperAsrUrlApi(HTTPMethodView):
    @login_required
    async def get(self, request: Request):
        url = asr_url()
        return json({"url": url})


ASR_API_VERSION = "2019-06-14"


def _asr_service_config() -> dict:
    """Build a minimal service config for Tencent Cloud ASR API (SentenceRecognition)."""
    return {
        'asr': {
            'url': 'https://asr.tencentcloudapi.com',
            'region': 'ap-guangzhou',
            'version': ASR_API_VERSION,
        }
    }


class TCADPHelperAsrFileApi(HTTPMethodView):
    @login_required
    async def post(self, request: Request):
        audio_file = request.files.get('audio') if request.files else None
        if not audio_file:
            raise SanicException("audio file is required", status_code=400)

        audio_data = audio_file.body
        engine_type = request.args.get('engine_type', '16k_zh_dialect')

        data_b64 = base64.b64encode(audio_data).decode('utf-8')

        payload = {
            "ProjectId": 0,
            "SubServiceType": 2,
            "EngSerViceType": engine_type,
            "SourceType": 1,
            "VoiceFormat": "wav",
            "UsrAudioKey": str(uuid.uuid4()),
            "Data": data_b64,
            "DataLen": len(audio_data),
        }

        config = _asr_service_config()
        resp = await tc_request(config, "SentenceRecognition", payload, service="asr")
        response = resp.get("Response", resp)

        if "Error" in response:
            logging.error(f"[asr_file] SentenceRecognition error: {response['Error']}")
            raise SanicException(response["Error"]["Message"], status_code=500)

        result = response.get("Result", "")
        logging.info(
            f"[asr_file] engine={engine_type} duration={response.get('AudioDuration')} text_len={len(result)}"
        )
        return json({"Result": result})


app.add_route(TCADPHelperAsrUrlApi.as_view(), "/helper/asr/url")
app.add_route(TCADPHelperAsrFileApi.as_view(), "/helper/asr/file")
