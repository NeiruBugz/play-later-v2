from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import boto3
from botocore.exceptions import ClientError

from lambdas.errors import S3Error
from lambdas.logging import get_logger

if TYPE_CHECKING:
    from lambdas.models.steam import SteamOwnedGame


class S3Client:
    """Client for S3 operations related to Steam imports.

    This client handles CSV operations for storing raw and enriched Steam library
    import data. It provides methods for generating S3 paths, converting games
    to/from CSV format, and uploading/downloading CSV files.

    Attributes:
        bucket: S3 bucket name for storing CSV files
        region: AWS region for S3 operations
    """

    def __init__(self, bucket: str, region: str = "us-east-1") -> None:
        """Initialize S3 client.

        Args:
            bucket: S3 bucket name
            region: AWS region
        """
        self.bucket = bucket
        self.region = region
        self._s3 = boto3.client("s3", region_name=region)
        self._logger = get_logger(service="S3Client", bucket=bucket)

    def generate_raw_csv_path(self, user_id: str) -> str:
        """Generate S3 path for raw import CSV.

        Format: imports/{user_id}/{timestamp}-raw.csv

        Args:
            user_id: The user's ID

        Returns:
            S3 key path
        """
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        return f"imports/{user_id}/{timestamp}-raw.csv"

    def generate_enriched_csv_path(self, user_id: str) -> str:
        """Generate S3 path for enriched import CSV.

        Format: imports/{user_id}/{timestamp}-enriched.csv

        Args:
            user_id: The user's ID

        Returns:
            S3 key path
        """
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        return f"imports/{user_id}/{timestamp}-enriched.csv"

    def games_to_csv(self, games: list[SteamOwnedGame]) -> str:
        """Convert a list of Steam games to CSV string.

        CSV columns: appid, name, playtime_forever, img_icon_url, rtime_last_played

        Args:
            games: List of Steam games

        Returns:
            CSV string with headers
        """
        output = io.StringIO(newline="")
        writer = csv.DictWriter(
            output,
            fieldnames=["appid", "name", "playtime_forever", "img_icon_url", "rtime_last_played"],
            quoting=csv.QUOTE_MINIMAL,
            lineterminator="\n",
        )

        writer.writeheader()

        for game in games:
            writer.writerow({
                "appid": game.appid,
                "name": game.name or "",
                "playtime_forever": game.playtime_forever,
                "img_icon_url": game.img_icon_url or "",
                "rtime_last_played": game.rtime_last_played or "",
            })

        csv_content = output.getvalue()
        output.close()

        self._logger.debug(
            "Converted games to CSV",
            game_count=len(games),
            csv_size_bytes=len(csv_content.encode("utf-8")),
        )

        return csv_content

    def csv_to_games(self, csv_content: str) -> list[dict[str, str | int | None]]:
        """Parse CSV content back to game dictionaries.

        Args:
            csv_content: CSV string with headers

        Returns:
            List of game dictionaries
        """
        input_stream = io.StringIO(csv_content)
        reader = csv.DictReader(input_stream)

        games: list[dict[str, str | int | None]] = []

        for row in reader:
            # Convert empty strings back to None for optional fields
            game: dict[str, str | int | None] = {
                "appid": int(row["appid"]),
                "name": row["name"] if row["name"] else None,
                "playtime_forever": int(row["playtime_forever"]),
                "img_icon_url": row["img_icon_url"] if row["img_icon_url"] else None,
                "rtime_last_played": int(row["rtime_last_played"]) if row["rtime_last_played"] else None,
            }
            games.append(game)

        input_stream.close()

        self._logger.debug(
            "Parsed CSV to games",
            game_count=len(games),
        )

        return games

    def upload_csv(self, key: str, csv_content: str) -> str:
        """Upload CSV content to S3.

        Args:
            key: S3 object key
            csv_content: CSV string to upload

        Returns:
            Full S3 URI (s3://bucket/key)

        Raises:
            S3Error: If upload fails
        """
        try:
            self._logger.info(
                "Uploading CSV to S3",
                key=key,
                size_bytes=len(csv_content.encode("utf-8")),
            )

            self._s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=csv_content.encode("utf-8"),
                ContentType="text/csv",
            )

            s3_uri = f"s3://{self.bucket}/{key}"

            self._logger.info(
                "CSV uploaded successfully",
                key=key,
                s3_uri=s3_uri,
            )

            return s3_uri

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")

            if error_code == "NoSuchBucket":
                msg = f"S3 bucket does not exist: {self.bucket}"
                self._logger.error(msg, error_code=error_code, key=key)
                raise S3Error(
                    msg,
                    operation="upload",
                    details={"key": key, "error_code": error_code},
                ) from e

            msg = f"Failed to upload CSV to S3: {e}"
            self._logger.error(msg, error_code=error_code, key=key)
            raise S3Error(
                msg,
                operation="upload",
                details={"key": key, "error_code": error_code},
            ) from e

    def download_csv(self, key: str) -> str:
        """Download CSV content from S3.

        Args:
            key: S3 object key

        Returns:
            CSV content as string

        Raises:
            S3Error: If download fails or object not found
        """
        try:
            self._logger.info("Downloading CSV from S3", key=key)

            response = self._s3.get_object(Bucket=self.bucket, Key=key)
            csv_content = response["Body"].read().decode("utf-8")

            self._logger.info(
                "CSV downloaded successfully",
                key=key,
                size_bytes=len(csv_content.encode("utf-8")),
            )

            return csv_content

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")

            if error_code == "NoSuchKey":
                msg = f"S3 object not found: {key}"
                self._logger.error(msg, error_code=error_code, key=key)
                raise S3Error(
                    msg,
                    operation="download",
                    details={"key": key, "error_code": error_code},
                ) from e

            if error_code == "NoSuchBucket":
                msg = f"S3 bucket does not exist: {self.bucket}"
                self._logger.error(msg, error_code=error_code, key=key)
                raise S3Error(
                    msg,
                    operation="download",
                    details={"key": key, "error_code": error_code},
                ) from e

            msg = f"Failed to download CSV from S3: {e}"
            self._logger.error(msg, error_code=error_code, key=key)
            raise S3Error(
                msg,
                operation="download",
                details={"key": key, "error_code": error_code},
            ) from e

    def upload_games(self, user_id: str, games: list[SteamOwnedGame]) -> str:
        """Convert games to CSV and upload to S3.

        This is a convenience method that combines games_to_csv,
        generate_raw_csv_path, and upload_csv.

        Args:
            user_id: The user's ID
            games: List of Steam games

        Returns:
            S3 key where the CSV was uploaded

        Raises:
            S3Error: If upload fails
        """
        self._logger.info(
            "Starting game upload workflow",
            user_id=user_id,
            game_count=len(games),
        )

        csv_content = self.games_to_csv(games)
        key = self.generate_raw_csv_path(user_id)
        self.upload_csv(key, csv_content)

        self._logger.info(
            "Game upload workflow completed",
            user_id=user_id,
            key=key,
        )

        return key
