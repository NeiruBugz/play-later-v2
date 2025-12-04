from __future__ import annotations

import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, Processor

from lambdas.config import get_settings


def add_log_level(_logger: logging.Logger, method_name: str, event_dict: EventDict) -> EventDict:
    """Add log level to event dict for consistent formatting."""
    if method_name == "warn":
        # Normalize 'warn' to 'warning'
        event_dict["level"] = "warning"
    else:
        event_dict["level"] = method_name
    return event_dict


def add_timestamp(_logger: logging.Logger, _method_name: str, event_dict: EventDict) -> EventDict:
    """Add ISO 8601 timestamp to event dict."""
    event_dict["timestamp"] = structlog.processors.TimeStamper(fmt="iso")(
        _logger, _method_name, event_dict
    )["timestamp"]
    return event_dict


def configure_logging(log_level: str | None = None) -> None:
    """Configure structlog for AWS Lambda environment.

    Args:
        log_level: Optional log level override. If not provided, uses settings.

    Note:
        In production (when not running in a TTY), logs are output as JSON
        for parsing by AWS CloudWatch. In development, logs are colored and
        formatted for human readability.
    """
    settings = get_settings()
    level = log_level or settings.log_level

    # Determine if we're in production (no TTY) or development (TTY)
    is_production = not sys.stderr.isatty()

    # Common processors for all environments
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        add_log_level,
        add_timestamp,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if is_production:
        # Production: JSON output for CloudWatch
        processors = shared_processors + [
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: Colored console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(level)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(**initial_values: Any) -> Any:
    """Get a configured structlog logger with optional initial context.

    Args:
        **initial_values: Initial context values to bind to the logger.
            Common values include:
            - user_id: User ID for tracking user-specific operations
            - request_id: Request ID for distributed tracing
            - lambda_name: Name of the Lambda function

    Returns:
        Configured structlog BoundLogger instance.

    Example:
        >>> logger = get_logger(lambda_name="steam_import", user_id="12345")
        >>> logger.info("Starting Steam library import")
    """
    return structlog.get_logger().bind(**initial_values)


def bind_context(**context_values: Any) -> None:
    """Bind context values to all subsequent log entries in this context.

    This uses structlog's contextvars to store context that will be automatically
    included in all log entries within the current execution context (e.g., within
    a single Lambda invocation).

    Args:
        **context_values: Context values to bind. Common values include:
            - user_id: User ID for tracking user-specific operations
            - steam_id64: Steam ID being processed
            - request_id: Request ID for distributed tracing

    Example:
        >>> bind_context(user_id="12345", steam_id64="76561198012345678")
        >>> logger = get_logger()
        >>> logger.info("Processing")  # Will include user_id and steam_id64
    """
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(**context_values)
