# evm-sqlite

the evm blockchain is a really terrible database, is sqlite better? lets find out.

## config env vars

AWS keys

S3_BUCKET (default `bsc-blocks`)

S3_REGION (default `us-east-1`)

S3_ENDPOINT (defaults to DO spaces nyc3)

## scripts

`download-block.mjs` to download blocks and all their transactions and receipts, package them up as json.gz and upload to S3

`prepare-block.mjs` to download from S3 and convert block to sqlite blocks.db, see `transactions` table
