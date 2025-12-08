from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import patch

import boto3
import pytest
from moto import mock_aws

from lambdas.clients.s3 import S3Client
from lambdas.errors import S3Error
from lambdas.models.steam import SteamOwnedGame


@pytest.fixture
def s3_bucket() -> str:
    """Create a mock S3 bucket for testing."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        bucket_name = "test-bucket"
        s3.create_bucket(Bucket=bucket_name)
        yield bucket_name


@pytest.fixture
def s3_client(s3_bucket: str) -> S3Client:
    """Create S3Client instance with mocked S3."""
    with mock_aws():
        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket=s3_bucket)
        return S3Client(bucket=s3_bucket, region="us-east-1")


@pytest.fixture
def sample_games() -> list[SteamOwnedGame]:
    """Create sample Steam games for testing."""
    return [
        SteamOwnedGame(
            appid=730,
            name="Counter-Strike: Global Offensive",
            playtime_forever=12345,
            img_icon_url="abc123",
            rtime_last_played=1699999999,
        ),
        SteamOwnedGame(
            appid=570,
            name="Dota 2",
            playtime_forever=54321,
            img_icon_url="def456",
            rtime_last_played=1700000000,
        ),
    ]


@pytest.fixture
def sample_games_with_special_chars() -> list[SteamOwnedGame]:
    """Create sample games with special characters in names."""
    return [
        SteamOwnedGame(
            appid=123,
            name='Game with "quotes" and, commas',
            playtime_forever=100,
            img_icon_url="test123",
            rtime_last_played=1699999999,
        ),
        SteamOwnedGame(
            appid=456,
            name="Game with\nnewlines",
            playtime_forever=200,
            img_icon_url="test456",
            rtime_last_played=1700000000,
        ),
    ]


@pytest.fixture
def sample_games_with_nulls() -> list[SteamOwnedGame]:
    """Create sample games with None values in optional fields."""
    return [
        SteamOwnedGame(
            appid=999,
            name=None,  # Name can be None
            playtime_forever=0,
            img_icon_url=None,
            rtime_last_played=None,
        ),
    ]


def test_generate_raw_csv_path_format() -> None:
    """Verify raw CSV path follows correct format."""
    client = S3Client(bucket="test-bucket")
    user_id = "user123"

    # Mock datetime to ensure consistent timestamp
    fixed_time = datetime(2024, 12, 15, 14, 30, 22, tzinfo=UTC)

    with patch("lambdas.clients.s3.datetime") as mock_datetime:
        mock_datetime.now.return_value = fixed_time

        path = client.generate_raw_csv_path(user_id)

    expected = "imports/user123/20241215143022-raw.csv"
    assert path == expected


def test_generate_enriched_csv_path_format() -> None:
    """Verify enriched CSV path follows correct format."""
    client = S3Client(bucket="test-bucket")
    user_id = "user456"

    # Mock datetime to ensure consistent timestamp
    fixed_time = datetime(2024, 12, 15, 15, 45, 33, tzinfo=UTC)

    with patch("lambdas.clients.s3.datetime") as mock_datetime:
        mock_datetime.now.return_value = fixed_time

        path = client.generate_enriched_csv_path(user_id)

    expected = "imports/user456/20241215154533-enriched.csv"
    assert path == expected


def test_games_to_csv_with_multiple_games(sample_games: list[SteamOwnedGame]) -> None:
    """Test CSV generation with multiple games."""
    client = S3Client(bucket="test-bucket")

    csv_content = client.games_to_csv(sample_games)

    # Verify headers
    lines = csv_content.strip().split("\n")
    assert lines[0] == "appid,name,playtime_forever,img_icon_url,rtime_last_played"

    # Verify first game row
    assert lines[1] == "730,Counter-Strike: Global Offensive,12345,abc123,1699999999"

    # Verify second game row
    assert lines[2] == "570,Dota 2,54321,def456,1700000000"


def test_games_to_csv_with_empty_list() -> None:
    """Test CSV generation with empty game list."""
    client = S3Client(bucket="test-bucket")

    csv_content = client.games_to_csv([])

    # Should only have headers
    lines = csv_content.strip().split("\n")
    assert len(lines) == 1
    assert lines[0] == "appid,name,playtime_forever,img_icon_url,rtime_last_played"


def test_games_to_csv_with_special_characters(
    sample_games_with_special_chars: list[SteamOwnedGame],
) -> None:
    """Test CSV generation handles special characters correctly."""
    client = S3Client(bucket="test-bucket")

    csv_content = client.games_to_csv(sample_games_with_special_chars)

    # Parse back to verify round-trip instead of comparing raw strings
    # (newlines in quoted fields make string comparison unreliable)
    parsed_games = client.csv_to_games(csv_content)

    assert len(parsed_games) == 2

    # Verify first game with quotes and commas
    assert parsed_games[0]["appid"] == 123
    assert parsed_games[0]["name"] == 'Game with "quotes" and, commas'
    assert parsed_games[0]["playtime_forever"] == 100

    # Verify second game with newlines
    assert parsed_games[1]["appid"] == 456
    assert parsed_games[1]["name"] == "Game with\nnewlines"
    assert parsed_games[1]["playtime_forever"] == 200


def test_games_to_csv_with_none_values(sample_games_with_nulls: list[SteamOwnedGame]) -> None:
    """Test CSV generation handles None values correctly."""
    client = S3Client(bucket="test-bucket")

    csv_content = client.games_to_csv(sample_games_with_nulls)

    lines = csv_content.strip().split("\n")

    # None values should be converted to empty strings
    assert lines[1] == "999,,0,,"


def test_csv_to_games_round_trip(sample_games: list[SteamOwnedGame]) -> None:
    """Test converting games to CSV and back maintains data integrity."""
    client = S3Client(bucket="test-bucket")

    # Convert to CSV
    csv_content = client.games_to_csv(sample_games)

    # Convert back to games
    parsed_games = client.csv_to_games(csv_content)

    # Verify count
    assert len(parsed_games) == len(sample_games)

    # Verify first game
    assert parsed_games[0]["appid"] == sample_games[0].appid
    assert parsed_games[0]["name"] == sample_games[0].name
    assert parsed_games[0]["playtime_forever"] == sample_games[0].playtime_forever
    assert parsed_games[0]["img_icon_url"] == sample_games[0].img_icon_url
    assert parsed_games[0]["rtime_last_played"] == sample_games[0].rtime_last_played

    # Verify second game
    assert parsed_games[1]["appid"] == sample_games[1].appid
    assert parsed_games[1]["name"] == sample_games[1].name


def test_csv_to_games_with_none_values() -> None:
    """Test CSV parsing correctly converts empty strings to None."""
    client = S3Client(bucket="test-bucket")

    csv_content = "appid,name,playtime_forever,img_icon_url,rtime_last_played\n999,,0,,\n"

    parsed_games = client.csv_to_games(csv_content)

    assert len(parsed_games) == 1
    assert parsed_games[0]["appid"] == 999
    assert parsed_games[0]["name"] is None
    assert parsed_games[0]["playtime_forever"] == 0
    assert parsed_games[0]["img_icon_url"] is None
    assert parsed_games[0]["rtime_last_played"] is None


def test_upload_csv_success(s3_client: S3Client) -> None:
    """Test successful CSV upload to S3."""
    key = "test/upload.csv"
    csv_content = "appid,name,playtime_forever,img_icon_url,rtime_last_played\n730,CS:GO,100,icon123,1699999999\n"

    s3_uri = s3_client.upload_csv(key, csv_content)

    # Verify return value
    assert s3_uri == f"s3://{s3_client.bucket}/{key}"

    # Verify file was uploaded
    s3 = boto3.client("s3", region_name="us-east-1")
    response = s3.get_object(Bucket=s3_client.bucket, Key=key)
    uploaded_content = response["Body"].read().decode("utf-8")

    assert uploaded_content == csv_content


def test_upload_csv_bucket_not_found() -> None:
    """Test upload error when bucket doesn't exist."""
    # Create client without creating bucket in moto
    with mock_aws():
        client = S3Client(bucket="nonexistent-bucket", region="us-east-1")

        key = "test/upload.csv"
        csv_content = "test,data\n1,2\n"

        with pytest.raises(S3Error) as exc_info:
            client.upload_csv(key, csv_content)

        assert "bucket does not exist" in str(exc_info.value).lower()
        assert exc_info.value.details["operation"] == "upload"
        assert exc_info.value.details["key"] == key
        assert exc_info.value.details["error_code"] == "NoSuchBucket"


def test_download_csv_success(s3_client: S3Client) -> None:
    """Test successful CSV download from S3."""
    key = "test/download.csv"
    original_content = "appid,name,playtime_forever,img_icon_url,rtime_last_played\n570,Dota 2,200,icon456,1700000000\n"

    # Upload first
    s3 = boto3.client("s3", region_name="us-east-1")
    s3.put_object(
        Bucket=s3_client.bucket,
        Key=key,
        Body=original_content.encode("utf-8"),
    )

    # Download and verify
    downloaded_content = s3_client.download_csv(key)

    assert downloaded_content == original_content


def test_download_csv_key_not_found(s3_client: S3Client) -> None:
    """Test download error when key doesn't exist."""
    key = "nonexistent/file.csv"

    with pytest.raises(S3Error) as exc_info:
        s3_client.download_csv(key)

    assert "not found" in str(exc_info.value).lower()
    assert exc_info.value.details["operation"] == "download"
    assert exc_info.value.details["key"] == key
    assert exc_info.value.details["error_code"] == "NoSuchKey"


def test_download_csv_bucket_not_found() -> None:
    """Test download error when bucket doesn't exist."""
    with mock_aws():
        client = S3Client(bucket="nonexistent-bucket", region="us-east-1")
        key = "test/file.csv"

        with pytest.raises(S3Error) as exc_info:
            client.download_csv(key)

        assert "bucket does not exist" in str(exc_info.value).lower()
        assert exc_info.value.details["operation"] == "download"


def test_upload_games_integration(s3_client: S3Client, sample_games: list[SteamOwnedGame]) -> None:
    """Test full workflow: games → CSV → S3."""
    user_id = "integration_user"

    # Mock datetime for consistent path
    fixed_time = datetime(2024, 12, 15, 16, 0, 0, tzinfo=UTC)

    with patch("lambdas.clients.s3.datetime") as mock_datetime:
        mock_datetime.now.return_value = fixed_time

        s3_uri = s3_client.upload_games(user_id, sample_games)

    # Verify S3 URI format
    expected_key = "imports/integration_user/20241215160000-raw.csv"
    expected_uri = f"s3://{s3_client.bucket}/{expected_key}"
    assert s3_uri == expected_uri

    # Verify content in S3
    s3 = boto3.client("s3", region_name="us-east-1")
    response = s3.get_object(Bucket=s3_client.bucket, Key=expected_key)
    uploaded_content = response["Body"].read().decode("utf-8")

    # Parse and verify
    parsed_games = s3_client.csv_to_games(uploaded_content)
    assert len(parsed_games) == len(sample_games)
    assert parsed_games[0]["appid"] == sample_games[0].appid
    assert parsed_games[0]["name"] == sample_games[0].name


def test_upload_games_with_empty_list(s3_client: S3Client) -> None:
    """Test upload_games with empty game list."""
    user_id = "empty_user"

    s3_uri = s3_client.upload_games(user_id, [])

    # Verify URI format and extract key
    assert s3_uri.startswith(f"s3://{s3_client.bucket}/")
    key = s3_uri.replace(f"s3://{s3_client.bucket}/", "")

    # Verify file was created
    s3 = boto3.client("s3", region_name="us-east-1")
    response = s3.get_object(Bucket=s3_client.bucket, Key=key)
    uploaded_content = response["Body"].read().decode("utf-8")

    # Should have headers only
    lines = uploaded_content.strip().split("\n")
    assert len(lines) == 1
    assert lines[0] == "appid,name,playtime_forever,img_icon_url,rtime_last_played"


def test_client_initialization() -> None:
    """Test S3Client initialization with custom parameters."""
    client = S3Client(bucket="custom-bucket", region="eu-west-1")

    assert client.bucket == "custom-bucket"
    assert client.region == "eu-west-1"


def test_client_default_region() -> None:
    """Test S3Client uses default region when not specified."""
    client = S3Client(bucket="test-bucket")

    assert client.region == "us-east-1"
