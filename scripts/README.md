# Scripts

Shell utilities for local development.

## Files

### `init-localstack.sh`

Initializes LocalStack for local S3 development. Waits for LocalStack to be ready, creates the `savepoint-dev` S3 bucket against the local endpoint (`localhost:4568`), and applies the CORS configuration from `localstack-cors.json`.

### `localstack-cors.json`

CORS configuration applied to the local S3 bucket. Allows `GET`, `PUT`, and `POST` requests from `http://localhost:6060` with a max age of 3000 seconds.
