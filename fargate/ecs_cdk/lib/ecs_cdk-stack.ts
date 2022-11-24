import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecs_patterns } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

class EcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "quarkus-demo-vpc", {
      maxAzs: 3
    });

    const table = new dynamodb.Table(this, "Users", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING, },
      tableName: "Users",
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const cluster = new ecs.Cluster(this, "quarkus-demo-cluster", {
      vpc: vpc
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "quarkus-demo"
    })

    const taskRole = new iam.Role(this, "quarkus-demo-taskRole", {
      roleName: "quarkus-demo-taskRole",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "quarkus-demo-taskdef", {
      taskRole: taskRole
    });

    const container = taskDef.addContainer("quarkus-demo-web", {
      image: ecs.ContainerImage.fromRegistry("275396840892.dkr.ecr.us-east-1.amazonaws.com/quarkus_ecs_demo:1.0"),
      memoryLimitMiB: 256,
      cpu: 256,
      logging
    });

    container.addPortMappings({
      containerPort: 8080,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "quarkus-demo-service", {
      cluster: cluster,
      taskDefinition: taskDef,
      publicLoadBalancer: true,
      desiredCount: 3,
      listenerPort: 8080
    });

    const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 6 });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 10,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60)
    });

    table.grantReadWriteData(taskRole)

    new cdk.CfnOutput(this, "LoadBalancerDNS", { value: fargateService.loadBalancer.loadBalancerDnsName });
  }
}

const app = new cdk.App();
new EcsCdkStack(app, "EcsCdkStack", {
  env: {
    region: "us-east-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }
});
