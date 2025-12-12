from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from lambdas.config import Settings
from lambdas.handlers.hello import handler


@pytest.mark.unit
def test_hello_handler_returns_success(
    settings: Settings,
    lambda_context: MagicMock,
) -> None:
    """Test that hello handler returns successful response."""
    event: dict[str, Any] = {}

    response = handler(event, lambda_context)

    assert response["statusCode"] == 200
    assert "message" in response["body"]
    assert response["body"]["message"] == "Hello from lambdas-py!"


@pytest.mark.unit
def test_hello_handler_includes_config(
    settings: Settings,
    lambda_context: MagicMock,
) -> None:
    """Test that hello handler includes configuration in response."""
    event: dict[str, Any] = {}

    response = handler(event, lambda_context)

    assert "aws_region" in response["body"]
    assert "log_level" in response["body"]
    assert response["body"]["aws_region"] == "us-east-1"
    assert response["body"]["log_level"] == "DEBUG"
