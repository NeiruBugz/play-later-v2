from __future__ import annotations


class LambdaError(Exception):
    """Base exception for all Lambda-specific errors.

    Attributes:
        code: Error code for programmatic handling
        message: Human-readable error message
        details: Optional additional context
    """

    def __init__(
        self,
        message: str,
        code: str | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        self.message = message
        self.code = code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def __str__(self) -> str:
        """Return formatted error message with code."""
        if self.details:
            return f"[{self.code}] {self.message} | Details: {self.details}"
        return f"[{self.code}] {self.message}"


class SteamApiError(LambdaError):
    """Raised when Steam Web API requests fail.

    Common scenarios:
    - Invalid API key
    - Rate limiting
    - Network timeouts
    - Invalid Steam ID
    - Private profile
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        error_details = details or {}
        if status_code:
            error_details["status_code"] = status_code
        super().__init__(message, code="STEAM_API_ERROR", details=error_details)


class IgdbApiError(LambdaError):
    """Raised when IGDB API requests fail.

    Common scenarios:
    - Authentication failures (invalid credentials, expired token)
    - Rate limiting (429 Too Many Requests)
    - Network timeouts
    - Invalid query syntax
    - Resource not found
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        error_details = details or {}
        if status_code:
            error_details["status_code"] = status_code
        super().__init__(message, code="IGDB_API_ERROR", details=error_details)


class S3Error(LambdaError):
    """Raised when S3 operations fail.

    Common scenarios:
    - Bucket does not exist
    - Access denied (insufficient permissions)
    - Object not found
    - Upload failures
    - Download failures
    """

    def __init__(
        self,
        message: str,
        operation: str | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        error_details = details or {}
        if operation:
            error_details["operation"] = operation
        super().__init__(message, code="S3_ERROR", details=error_details)


class DatabaseError(LambdaError):
    """Raised when database operations fail.

    Common scenarios:
    - Connection failures
    - Query execution errors
    - Constraint violations
    - Transaction rollbacks
    - Timeout errors
    """

    def __init__(
        self,
        message: str,
        operation: str | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        error_details = details or {}
        if operation:
            error_details["operation"] = operation
        super().__init__(message, code="DATABASE_ERROR", details=error_details)


class ValidationError(LambdaError):
    """Raised when input validation fails.

    Common scenarios:
    - Missing required fields
    - Invalid data types
    - Out-of-range values
    - Malformed input
    - Schema validation failures
    """

    def __init__(
        self,
        message: str,
        field: str | None = None,
        details: dict[str, object] | None = None,
    ) -> None:
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(message, code="VALIDATION_ERROR", details=error_details)
