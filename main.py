import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import uvicorn

from app.core.app_factory import create_app

app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
