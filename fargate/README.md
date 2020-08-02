# Quarkus example project for Amazon ECS with AWS Fargate

This example project demonstrates how Quarkus can be used to implement lightweight Java-based applications. 
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

[DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) is also supported: The downloadable version of DynamoDB lets you write and test applications without 
accessing the DynamoDB web service. Instead, the database is self-contained on your computer. When you're ready to 
deploy your application in production, you can make a few minor changes to the code so that it uses the DynamoDB web 
service.

Simply run `docker run -p 8000:8000 amazon/dynamodb-local` to execute DynamoDB locally.

## Compiling the application

Compiling the application to an Uber-JAR is very straight forward:

```
$ ./mvnw package -DskipTests
```

To compile the application to a native image we have to add a few parameters:

```
$ ./mvnw package -Pnative -Dquarkus.native.container-build=true -DskipTests
```

## Packaging the application as Docker image

Now we have to build a Docker image containing the native image of our Java application. Under `src/main/docker` we have  two different Dockerfiles: `Dockerfile.jvm` and `Dockerfile.native`. The `Dockerfile.native`-file contains a few GraalVM-specific modifications to support TLS which is necessary for the AWS SDK for Java.

```
$ docker build -f src/main/docker/Dockerfile.native -t <repo/image:tag> .
$ docker push <repo/image:tag>
```

## Set up the infrastructure using AWS CDK

After we've built and pushed the Docker image containing the native image of the application, we need to set up the basic infrastructure in `us-east-1`:

```
$ npm install -g aws-cdk
$ cd ecs_cdk
$ npm install
$ npm run build
$ cdk deploy  // Deploys the CloudFormation template
```

## Testing the application

After the infrastructure has been created successfully, the outputs of the CloudFormation stack is the load balancer URL. You can test the application using the following statements:

```
$ curl -v -d '{"userName":"hmueller", "firstName":"Hans", "lastName":"Mueller", "age":"35"}' -H "Content-Type: application/json" -X POST http://<lb-url>:8080/users
$ curl -v http://<lb-url>:8080/users/<user-id>
$ curl -v http://<lb-url>:8080/users
$ curl -v -X DELETE http://<lb-url>:8080/users/<user-id>
```

## Contributing
Please create a new GitHub issue for any feature requests, bugs, or documentation improvements.

Where possible, please also submit a pull request for the change.
