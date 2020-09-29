import * as yaml from 'js-yaml';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import fs = require('fs');

export interface ALBIngressControllerProps {
  readonly cluster: eks.Cluster;
  readonly vpcId: string;
  readonly region: string;
  readonly version: string;
}

export class ALBIngressController extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ALBIngressControllerProps) {
    super(scope, id);

    const albNamespace = 'kube-system';
    const albServiceAccount = props.cluster.addServiceAccount('alb-ingress-controller', {
      name: 'alb-ingress-controller',
      namespace: albNamespace,
    });

    const policyJson = fs.readFileSync('./assets/iam-policy.json').toString();
      
      ((JSON.parse(policyJson))['Statement'] as []).forEach((statement, idx, array) => {
        albServiceAccount.addToPolicy(iam.PolicyStatement.fromJson(statement));
      });

    const rbacRoles = yaml.safeLoadAll(fs.readFileSync('./assets/rbac-role.yaml').toString())
      .filter((rbac: any) => { return rbac['kind'] != 'ServiceAccount' });

    const albDeployment = yaml.safeLoad(fs.readFileSync('./assets/alb-ingress-controller.yaml').toString());

    const albResources = props.cluster.addManifest('aws-alb-ingress-controller', ...rbacRoles, albDeployment);

    const albResourcePatch = new eks.KubernetesPatch(this, `alb-ingress-controller-patch`, {
      cluster: props.cluster,
      resourceName: "deployment/alb-ingress-controller",
      resourceNamespace: albNamespace,
      applyPatch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'alb-ingress-controller',
                  args: [
                    '--ingress-class=alb',
                    '--feature-gates=wafv2=false',
                    `--cluster-name=${props.cluster.clusterName}`,
                    `--aws-vpc-id=${props.vpcId}`,
                    `--aws-region=${props.region}`
                  ],
                  image: `docker.io/amazon/aws-alb-ingress-controller:v${props.version}`
                }
              ]
            }
          }
        }
      },
      restorePatch: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'alb-ingress-controller',
                  args: [
                    '--ingress-class=alb',
                    '--feature-gates=wafv2=false',
                    `--cluster-name=${props.cluster.clusterName}`,
                  ]
                }
              ]
            }
          }
        }
      },
    });
    albResourcePatch.node.addDependency(albResources);
  }
}