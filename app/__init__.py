# -*- encoding: utf-8 -*-

import os
from pathlib import Path

from flask import Flask


def load_local_env():
    project_root = Path(__file__).resolve().parent.parent
    for env_name in (".env", ".env.local"):
        env_path = project_root / env_name
        if not env_path.exists():
            continue
        with env_path.open(encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


load_local_env()

app = Flask(__name__)
app.secret_key = os.getenv("CAREBRIDGE_SECRET_KEY", "carebridge-dev-secret")

from app import views  # noqa: E402,F401
from app.auth import auth  # noqa: E402
from app.personnel_api import personnel_api  # noqa: E402

app.register_blueprint(auth)
app.register_blueprint(personnel_api)

from app import care_demo, communication_demo, schedule_demo  # noqa: E402,F401
