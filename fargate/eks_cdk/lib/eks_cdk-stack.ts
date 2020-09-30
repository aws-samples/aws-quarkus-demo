import * as cdk from '@aws-cdk/core';

import ec2 = require("@aws-cdk/aws-ec2");
import eks = require("@aws-cdk/aws-eks");
import dynamodb = require('@aws-cdk/aws-dynamodb');

import { ALBIngressController } from './ALBIngressController';

class EksCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define the vpc
    const vpc = new ec2.Vpc(this, "quarkus-demo-vpc", {
      maxAzs: 2
    });

    // create EKS cluster
    const cluster = new eks.FargateCluster(this, "quarkus-demo-cluster", {
      clusterName: "quarkus-demo-cluster",
      version: eks.KubernetesVersion.V1_17,
      vpc
    }
    );

    const sa = cluster.addServiceAccount('quarkus-service-account', {
      name: "quarkus-service-account",
      namespace: "default"
    });

    new cdk.CfnOutput(this, 'ServiceAccountIamRole', { value: sa.role.roleArn })

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
            securityContext: {    // To fix the file permission of the access token file, see https://github.com/kubernetes-sigs/external-dns/pull/1185
              fsGroup: 65534
            },
            containers: [
              {
                name: "quarkus-demo-web",
                image: "moralesl/quarkus-eks-demo:sts-included",
                ports: [{ containerPort: 8080 }]
              }
            ]
          }
        }
      }
    };

    const service = {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "quarkus-demo-svc",
        annotations: {
          "alb.ingress.kubernetes.io/target-type": "ip"
        }
      },
      spec: {
        type: "NodePort",
        ports: [{ port: 8080, targetPort: 8080 }],
        selector: appLabel
      }
    };

    const ingress = {
      apiVersion: "extensions/v1beta1",
      kind: "Ingress",
      metadata: {
         name: "quarkus-demo-ingress",
         annotations: {
            "kubernetes.io/ingress.class": "alb",
            "alb.ingress.kubernetes.io/scheme": "internet-facing",
            "alb.ingress.kubernetes.io/healthcheck-path": "/health"
            // "alb.ingress.kubernetes.io/listen-ports": "[{\"HTTP\": 8080}]"
         },
         labels: appLabel
      },
      spec: {
         rules: [
            {
               http: {
                  paths: [
                     {
                        path: "/*",
                        backend: {
                           serviceName: "quarkus-demo-svc",
                           servicePort: 8080
                        }
                     }
                  ]
               }
            }
         ]
      }
   };

    // option 1: use a construct
    new eks.KubernetesManifest(this, 'quarkus-demo', {
      cluster,
      manifest: [deployment, service, ingress]
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

    const albIngressController = new ALBIngressController(this, 'ALB-ingress-controller', {
      cluster: cluster,
      vpcId: vpc.vpcId,
      region: this.region,
      version: '1.1.7'
    })

  }
}

const app = new cdk.App();
new EksCdkStack(app, 'EksCdkStack', {
  env: {
    region: "us-east-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }
});
