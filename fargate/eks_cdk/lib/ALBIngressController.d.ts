import * as eks from '@aws-cdk/aws-eks';
import * as cdk from '@aws-cdk/core';
export interface ALBIngressControllerProps {
    readonly cluster: eks.Cluster;
    readonly vpcId: string;
    readonly region: string;
    readonly version: string;
}
export declare class ALBIngressController extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: ALBIngressControllerProps);
}
