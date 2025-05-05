#!/bin/bash

# This script builds and pushes a Docker image to AWS ECR.
# Prerequisites:
# - SSO login to AWS with correct profile
# - Run this script at backend directory

source export.sh
# change to backend directory
cd ./backend || exit
# change profile name
aws ecr get-login-password --region ap-southeast-2 --profile $AWS_PROFILE | docker login --username AWS --password-stdin $ECR_URI
docker-compose --file docker-compose-prod.yaml build amark-api
#Get Current Date
current_date=$(date +"%Y-%m-%dT%H-%M-%SZ")
docker tag backend-amark-api:latest $ECR_REPO:$current_date
docker tag backend-amark-api:latest $ECR_REPO:latest
docker push $ECR_REPO:$current_date
docker push $ECR_REPO:latest