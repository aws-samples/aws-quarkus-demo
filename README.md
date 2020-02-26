# Quarkus example projects for Amazon ECS with AWS Fargate and AWS Lambda

This repository contains two different examples how [Quarkus](https://quarkus.io) can be used in combination with different AWS services:

* [Amazon ECS](https://aws.amazon.com/ecs/) with [AWS Fargate](https://aws.amazon.com/fargate/)
* [AWS Lambda](https://aws.amazon.com/lambda/)

Quarkus is "`A Kubernetes Native Java stack tailored for OpenJDK HotSpot and GraalVM, crafted from the best of breed Java libraries and standards.`"

In the examples in this repository, two different approaches have been used: a JVM based built (with an Uber-Jar) and a native-image that is created using SubstrateVM. For the [container example](fargate) we use Amazon ECS and AWS Fargate as base infrastructure which is created using [AWS CDK](https://github.com/aws/aws-cdk). The [second example](lambda) uses AWS Lambda and [AWS SAM](https://github.com/awslabs/serverless-application-model). SAM is an open-source framework for building serverless applications. It provides shorthand syntax to express functions, APIs, databases, and event source mappings.

## Contributing
Please create a new GitHub issue for any feature requests, bugs, or documentation improvements.

Where possible, please also submit a pull request for the change.