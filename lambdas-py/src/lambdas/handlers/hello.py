from __future__ import annotations

from typing import Any

from lambdas.config import get_settings
from lambdas.logging import configure_logging, get_logger


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Hello World Lambda handler for testing infrastructure.

    Args:
        event: Lambda event dict
        context: Lambda context object

    Returns:
        Response dict with status code and message
    """
    # Configure logging on first invocation
    configure_logging()

    logger = get_logger(lambda_name="hello", request_id=context.request_id if context else "local")

    logger.info("Hello handler invoked", event_keys=list(event.keys()))

    # Verify config is accessible
    settings = get_settings()
    logger.debug("Settings loaded", log_level=settings.log_level, aws_region=settings.aws_region)

    return {
        "statusCode": 200,
        "body": {
            "message": "Hello from lambdas-py!",
            "aws_region": settings.aws_region,
            "log_level": settings.log_level,
        },
    }
