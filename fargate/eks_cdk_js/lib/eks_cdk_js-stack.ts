import * as cdk from '@aws-cdk/core';

import ec2 = require("@aws-cdk/aws-ec2");
import eks = require("@aws-cdk/aws-eks");
import dynamodb = require('@aws-cdk/aws-dynamodb');
import iam = require("@aws-cdk/aws-iam");

export class EksCdkJsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define the vpc
    const vpc = new ec2.Vpc(this, "quarkus-demo-vpc", {
      maxAzs: 2
    });
    
    // create EKS cluster
    const cluster = new eks.Cluster(this, "quarkus-demo-cluster",{
        clusterName: "quarkus-demo-cluster",
        vpc: vpc,
        defaultCapacity: 0, 
        // coreDnsComputeType: eks.CoreDnsComputeType.FARGATE,
        version: eks.KubernetesVersion.V1_17
      }
    );

    // add default fargate profile
    const fargate_profile = cluster.addFargateProfile('default-profile', {
      selectors: [ { namespace: 'default' }, { namespace: 'kube-system' } ]
    });
    
    const sa = cluster.addServiceAccount('quarkus-service-account', {
      name: "quarkus-service-account",
      namespace: "default"
    });

    new cdk.CfnOutput(this, 'ServiceAccountIamRole', { value: sa.role.roleArn })

    // [workaround] remove coredns annotation for ec2, so it can run on fargate
    // const coredns_patch_json = {"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}
    // new eks.KubernetesPatch(this, "coredns-patch", { 
    //   cluster,
    //   resourceName: "deployment/coredns",
    //   resourceNamespace: "kube-system",
    //   applyPatch: coredns_patch_json,
    //   restorePatch: coredns_patch_json
    // })
    // coredns_patch.node.addDependency(sa)

    // [workaround] enabling ec2 capacity for coredns - Fix for cycical dependencies when using eks.CoreDnsComputeType.FARGATE
    // // add dns nodes 
    cluster.addNodegroup('nodegroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      minSize: 2,
    });

    const appLabel = { app: "quarkus-demo" };

    const deployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "quarkus-demo-deploy" },
      spec: {
        replicas: 3,
        selector: { matchLabels: appLabel },
        template: {
          metadata: { labels: appLabel },
          spec: {
            serviceAccountName: sa.serviceAccountName,
            containers: [
              {
                name: "quarkus-demo-web",
                image: "smoell/quarkus_ecs_demo:0.7",
                ports: [ { containerPort: 8080 } ]
              }
            ]
          }
        }
      }
    };
    
    const service = {
      apiVersion: "v1",
      kind: "Service",
      metadata: { name: "quarkus-demo-svc" },
      spec: {
        type: "LoadBalancer",
        ports: [ { port: 80, targetPort: 8080 } ],
        selector: appLabel
      }
    };
    
    // option 1: use a construct
    new eks.KubernetesManifest(this, 'quarkus-demo', {
      cluster,
      manifest: [ deployment, service ]
    });
    
    // // or, option2: use `addManifest`
    // cluster.addManifest('hello-kub', service, deployment);

    // create the application Users dynomodb table
    const table = new dynamodb.Table(this, 'Users', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING, },
      tableName: 'Users',
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    table.grantReadWriteData(sa.role)

  }
}
