#!/bin/bash
# prerequisites
# - aws cli
# - aws sso login --profile <your profile>

npm install
npm run build
# upload to s3
./config.sh
aws s3 cp --profile ${MY_PROFILE} ./dist/ s3://${S3BUCKET_NAME}/ --recursive
# invalidate cloudfront cache
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" --profile ${MY_PROFILE}