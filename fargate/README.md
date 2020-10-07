# Quarkus example projects for Amazon ECS and Amazon EKS with AWS Fargate

This example projects demonstrate how Quarkus can be used to implement lightweight Java-based applications. 
In this documentation, we'll cover how to

* Compile the application to a native executable
* Package of the application in a Docker image
* Set up the infrastructure using [AWS Cloud Development Kit](https://github.com/awslabs/aws-cdk)

The infrastructure is set up using AWS CDK and implemented with TypeScript.

## Application architecture

The architecture of the application is pretty simple and consists of a few classes that implement a REST-service 
that stores all information in an Amazon DynamoDB-table. Quarkus offers an [extension](https://quarkus.io/guides/dynamodb) for Amazon DynamoDB that is based 
on AWS SDK for Java V2. The Quarkus extension supports two programming models:

* Blocking access
* Asynchronous programming

## Compiling the application

Compiling the application to an Uber-JAR is very straight forward:

```
$ ./mvnw package -DskipTests
```

To compile the application to a native image we have to add a few parameters:

```
$ ./mvnw package -Pnative -Dquarkus.native.container-build=true -DskipTests
```

## Local testing

To test the application locally a Docker Compose file is provided. It sets up two containers, one with the compiled Uber-JAR
and one with [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html):
The local version of DynamoDB lets you write and test applications without accessing the DynamoDB web service.
Instead, the database is self-contained on your computer.

Simply run `docker-compose up` to build the application and run DynamoDB locally. The application will run on port `8080`.

In order to create the necessary table in your DynamoDB locally run:

```
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000
```

For interacting with the application simply go to `http://localhost:8080/`. For further interactions see [Testing the application](#testing-the-application).

## Packaging the application as Docker image

Now we have to build a Docker image containing the native image of our Java application. Under `src/main/docker` we have  two different Dockerfiles: `Dockerfile.jvm` and `Dockerfile.native`. The `Dockerfile.native`-file contains a few [GraalVM](https://www.graalvm.org/)-specific modifications to support TLS which is necessary for the AWS SDK for Java.

```
$ docker build -f src/main/docker/Dockerfile.native -t <repo/image:tag> .
$ docker push <repo/image:tag>
```

## Set up the infrastructure using AWS CDK

After we've built and pushed the Docker image containing the native image of the application, we need to set up the basic infrastructure in `us-east-1`:

```
| Amazon ECS | $cd ecs_cdk |
|------------|-------------|
| Amazon EKS | $cd eks_cdk |

$ npm install -g aws-cdk
$ npm install
$ cdk deploy  // Deploys the CloudFormation template
```

## Testing the application

After the infrastructure has been created successfully, the output `LoadBalancerDNS` of the CloudFormation stack is the load balancer URL. You can test the application using the following statements:

```
$ curl -v http://<lb-url>:8080/health // from HealthResource.java Resource
$ curl -v -d '{"userName":"hmueller", "firstName":"Hans", "lastName":"Mueller", "age":"35"}' -H "Content-Type: application/json" -X POST http://<lb-url>:8080/users
$ curl -v http://<lb-url>:8080/users/<user-id>
$ curl -v http://<lb-url>:8080/users
$ curl -v -X DELETE http://<lb-url>:8080/users/<user-id>
```

## Contributing
Please create a new GitHub issue for any feature requests, bugs, or documentation improvements.

Where possible, please also submit a pull request for the change.
