# Quarkus example project for AWS Lambda

This example project demonstrates how Quarkus can be used to implement lightweight Java-based applications using AWS Lambda.
In this documentation, we'll cover how to

* Compile the application to a native executable
* Packaging of the application in a Custom Runtime for AWS Lambda
* Set up the infrastructure using [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

The infrastructure is set up using AWS SAM and implemented with YAML.

## Application architecture

The architecture of the application is pretty simple and consists of a few classes that implement a REST-service that stores all information in an Amazon DynamoDB-table. Quarkus offers an [extension](https://quarkus.io/guides/dynamodb) for Amazon DynamoDB that is based  on AWS SDK for Java V2. The Quarkus extension supports two programming models:

* Blocking access
* Asynchronous programming


## Compile the Java application

Compiling the application to an Uber-JAR is very straight forward:

```
$ mvn clean package
```

## Native Image build

Native image requires the addition of SSL related dependencies to the `function.zip`.

Please refer to the Quarkus documentation `https://quarkus.io/guides/amazon-lambda#additional-requirements-for-client-ssl`
If using Linux you can copy these files direct, however if using Docker please follow the `Quarkus` guide.

```
cp $GRAALVM_HOME/lib/libsunec.o $PROJECT_DIR/src/main/zip.native/
cp $GRAALVM_HOME/lib/security/cacerts $PROJECT_DIR/src/main/zip.native/
```

To compile the application to a native binary and generate the `function.zip` use the below command.
```
$ mvn package -Pnative -Dnative-image.docker-build=true
```

## Testing with SAM local

Modify the DynamoDB configuration as below, and startup DynamoDB-local.

Launch the local API, which should startup on `http://127.0.0.1:3000`
```
$ sam local start-api --template sam.jvm.yaml 
```

You should see the following output:

```
Mounting LambdaQuarkusFunction at http://127.0.0.1:3000/users [GET, POST]
Mounting LambdaQuarkusFunction at http://127.0.0.1:3000/users/{userId} [DELETE, GET]
You can now browse to the above endpoints to invoke your functions. You do not need to restart/reload SAM CLI while working on your functions, changes will be reflected instantly/automatically. You only need to restart SAM CLI if you update your AWS SAM template
* Running on http://127.0.0.1:3000/ (Press CTRL+C to quit)
```

After the resources has been created successfully, you can start testing. First we want to create a user:

```
$ curl -v -d '{"userName":"jdoe", "firstName":"John", "lastName":"Doe", "age":"35"}' -H "Content-Type: application/json" -X POST  http://127.0.0.1:3000/users
```

Logging to the active SAM local API will appear:

```
START RequestId: 129e40ca-98ad-1f53-2a5d-08fcd63c1802 Version: $LATEST
INFO  [com.ama.exa.ProcessingLambda] (main) [{resource: /users,path: /users,httpMethod: POST,headers: {Host=127.0.0.1:3000, User-Agent=curl/7.64.1, Accept=*/*, Content-Type=application/json, Content-Length=69, X-Forwarded-Proto=http, X-Forwarded-Port=3000},multiValueHeaders: {Host=[127.0.0.1:3000], User-Agent=[curl/7.64.1], Accept=[*/*], Content-Type=[application/json], Content-Length=[69], X-Forwarded-Proto=[http], X-Forwarded-Port=[3000]},requestContext: {accountId: 123456789012,resourceId: 123456,stage: prod,requestId: c6af9ac6-7b61-11e6-9a41-93e8deadbeef,identity: {sourceIp: 127.0.0.1,userAgent: Custom User Agent String,},resourcePath: /users,httpMethod: POST,apiId: 1234567890,path: /users},body: {"userName":"jdoe", "firstName":"John", "lastName":"Doe", "age":"35"},isBase64Encoded: false}] Processed data
INFO  [com.ama.exa.ProcessingLambda] (main) POST: UserPojo{userId=a700af5b-af80-4a6d-acfd-a9881568ebdd, userName='jdoe', firstName='John', lastName='Doe', age=35}
END RequestId: 129e40ca-98ad-1f53-2a5d-08fcd63c1802
REPORT RequestId: 129e40ca-98ad-1f53-2a5d-08fcd63c1802  Init Duration: 5583.39 ms       Duration: 1653.22 ms    Billed Duration: 1700 ms        Memory Size: 256 MB     Max Memory Used: 106 MB 
```


Now we can list all users that we have created:

```
$ curl -v http://127.0.0.1:3000/users
```

Output should be like:

```
[{"userId":"a700af5b-af80-4a6d-acfd-a9881568ebdd","userName":"jdoe","firstName":"John","lastName":"Doe","age":35},{"userId":"77492694-cdec-40a0-a27f-38173960c8e0","userName":"jdoe","firstName":"John","lastName":"Doe","age":35}]
```

### DynamoDB Local
[DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) is also supported: 
The downloadable version of DynamoDB lets you write and test applications without  accessing the DynamoDB web service. Instead, the database is self-contained on your computer. When you're ready to  deploy your application in production, you can make a few minor changes to the code so that it uses the DynamoDB web service.

Simply run the below command to execute DynamoDB locally.

```
$ docker run -p 8000:8000 amazon/dynamodb-local  -jar DynamoDBLocal.jar -inMemory -sharedDb
```

Update the `application.properties` to use the local DynamoDB

```
quarkus.dynamodb.endpoint-override=http://localhost:8000

quarkus.dynamodb.aws.region=eu-central-1
quarkus.dynamodb.aws.credentials.type=static
quarkus.dynamodb.aws.credentials.static-provider.access-key-id=test-key
quarkus.dynamodb.aws.credentials.static-provider.secret-access-key=test-secret
```

Where:
```
quarkus.dynamodb.endpoint-override - Override the DynamoDB client to use a local instance instead of an AWS service
quarkus.dynamodb.aws.region - It’s required by the client, but since you’re using a local DynamoDB instance you can pick any valid AWS region.
quarkus.dynamodb.aws.credentials.type - Set static credentials provider with any values for access-key-id and secret-access-key
```

## AWS Deployment: Setting up the infrastructure and deploying the application using AWS SAM

After we've built the AWS Lambda function (native-image or JVM-based), we need to package our application and deploy it. The SAM package command creates a zip of your code and dependencies and uploads it to S3. SAM deploy creates a Cloudformation Stack and deploys your resources.

The following commands package and deploy the JVM-based version of the application.

```
$ sam package --template-file sam.jvm.yaml --output-template-file output.yaml --s3-bucket <your_s3_bucket>

$ sam deploy --template-file output.yaml --stack-name APIGatewayQuarkusDemo --capabilities CAPABILITY_IAM
```

If you want to deploy the native version of the application, you have to use a different SAM template.

```
$ sam package --template-file sam.native.yaml --output-template-file output.native.yaml --s3-bucket <your_s3_bucket>

$ sam deploy --template-file output.native.yaml --stack-name APIGatewayQuarkusDemo --capabilities CAPABILITY_IAM
```

During deployment, the CloudFormation template creates the AWS Lambda function, an Amazon DynamoDB table, an Amazon API Gateway REST-API, and all necessary IAM roles.

## Testing with AWS

After the resources has been created successfully, you can start testing. First we want to create a user:

```
$ curl -v -d '{"userName":"jdoe", "firstName":"John", "lastName":"Doe", "age":"35"}' -H "Content-Type: application/json" -X POST  https://<your-api-gateway-url>/prod/users
```

Now we can list all users that we have created:

```
$ curl -v https://<your-api-gateway-url>/prod/users
```

Of course we can get a specific user with the `userId`:

```
$ curl -v -X GET 'https://<your-api-gateway-url>/prod/users?userId=<userId>'
```

If we want to delete the user that we've created recently, we only need to specifc the `userId`:

```
$ curl -v -X DELETE 'https://<your-api-gateway-url>/prod/users/<userId>'
```

## Contributing
Please create a new GitHub issue for any feature requests, bugs, or documentation improvements.

Where possible, please also submit a pull request for the change.