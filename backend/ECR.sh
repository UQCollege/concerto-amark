#!/bin/bash
current_datetime=$(date +"%Y-%m-%d_%H-%M-%S")
export TAG="$(date +%Y%m%d-%H%M)"
aws ecr get-login-password --region $REGION --profile $PROF | docker login --username AWS --password-stdin ${ECR_REPO}

docker compose -f docker-compose-prod.yaml build amark-api
docker tag backend-amark-api:latest ${ECR_REPO}/amark-api:$current_datetime
docker tag backend-amark-api:latest ${ECR_REPO}/amark-api:latest
docker push ${ECR_REPO}/amark-api:$current_datetime
docker push ${ECR_REPO}/amark-api:latest

