#!/usr/bin/env bash

./runner \
    -Djava.library.path=${LAMBDA_TASK_ROOT}/ssl \
    -Djavax.net.ssl.trustStore=${LAMBDA_TASK_ROOT}/ssl/cacerts \
    -Djavax.net.ssl.trustAnchors=${LAMBDA_TASK_ROOT}/ssl/cacerts