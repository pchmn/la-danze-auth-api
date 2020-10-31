#!/bin/bash

# Install aws cli
pip install --upgrade pip
pip install --user awscli
export PATH=$PATH:$HOME/.local/bin

# Login to docker hub
echo ${DOCKER_HUB_PWD} | docker login -u ${DOCKER_HUB_USER} --password-stdin

# Build and push docker image
docker build --build-arg NODE_ENV=${NODE_ENV} -t pchmn/la-danze-en-ldc-auth-api . 
docker push pchmn/la-danze-en-ldc-auth-api:${IMAGE_TAG}

# Deploy to aws ecs
if [-n ${TRAVIS_TAG}]
then
  # If there is a tag (prod deploy), we have to create a new task definition revision, because task image url will change
  # Get current task definition
  TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition ${TASK_FAMILY} --region ${REGION_NAME})
  # Create new task definition (based on previous) to update image url
  NEW_TASK_DEFINTIION=$(echo $TASK_DEFINITION | jq --arg IMAGE registry.hub.docker.com/pchmn/la-danze-en-ldc-auth-api:${IMAGE_TAG} '.taskDefinition | .containerDefinitions[0].image = ${IMAGE} | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities)')
  # Register new task definition revision, and get revision number
  NEW_TASK_INFO=$(aws ecs register-task-definition --cli-input-json ${NEW_TASK_DEFINTIION} --region ${REGION_NAME})
  NEW_REVISION=$(echo $NEW_TASK_INFO | jq '.taskDefinition.revision')
  # Update service to use new revision
  aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --task-definition ${TASK_FAMILY}:${NEW_REVISION} --force-new-deployment --region ${REGION_NAME}
else
  # If there is no tag (dev deploy), we juste update service, because task image url stays the same (:latest tag)
  # Update service 
  aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --force-new-deployment --region ${REGION_NAME}
fi  