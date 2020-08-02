"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const ecs = require("@aws-cdk/aws-ecs");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const ecs_patterns = require("@aws-cdk/aws-ecs-patterns");
const iam = require("@aws-cdk/aws-iam");
class EcsCdkStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const vpc = new ec2.Vpc(this, "quarkus-demo-vpc", {
            maxAzs: 3
        });
        const table = new dynamodb.Table(this, 'Users', {
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING, },
            tableName: 'Users',
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const cluster = new ecs.Cluster(this, "quarkus-demo-cluster", {
            vpc: vpc
        });
        const logging = new ecs.AwsLogDriver({
            streamPrefix: "quarkus-demo"
        });
        const taskRole = new iam.Role(this, 'quarkus-demo-taskRole', {
            roleName: 'quarkus-demo-taskRole',
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        const taskDef = new ecs.FargateTaskDefinition(this, "quarkus-demo-taskdef", {
            taskRole: taskRole
        });
        const container = taskDef.addContainer('quarkus-demo-web', {
            image: ecs.ContainerImage.fromRegistry("smoell/quarkus_ecs_demo:0.7"),
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
        scaling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 10,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60)
        });
        table.grantReadWriteData(taskRole);
        new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    }
}
exports.EcsCdkStack = EcsCdkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzX2Nkay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVjc19jZGstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBc0M7QUFFdEMsd0NBQXlDO0FBQ3pDLHdDQUF5QztBQUN6QyxrREFBbUQ7QUFDbkQsMERBQTJEO0FBQzNELHdDQUF5QztBQUV6QyxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUN4QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDaEQsTUFBTSxFQUFFLENBQUM7U0FDVixDQUFDLENBQUM7UUFFSCxNQUFNLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUM5QyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRztZQUN0RSxTQUFTLEVBQUUsT0FBTztZQUNsQixZQUFZLEVBQUUsQ0FBQztZQUNmLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM1RCxHQUFHLEVBQUUsR0FBRztTQUNULENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQztZQUNuQyxZQUFZLEVBQUUsY0FBYztTQUM3QixDQUFDLENBQUE7UUFFRixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzNELFFBQVEsRUFBRSx1QkFBdUI7WUFDakMsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDO1NBQy9ELENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUMxRSxRQUFRLEVBQUUsUUFBUTtTQUNuQixDQUFDLENBQUM7UUFFSCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFO1lBQ3pELEtBQUssRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyw2QkFBNkIsQ0FBQztZQUNyRSxjQUFjLEVBQUUsR0FBRztZQUNuQixHQUFHLEVBQUUsR0FBRztZQUNSLE9BQU87U0FDUixDQUFDLENBQUM7UUFFSCxTQUFTLENBQUMsZUFBZSxDQUFDO1lBQ3hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFFBQVEsRUFBRSxJQUFJO1lBQ2QsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRztTQUMzQixDQUFDLENBQUM7UUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLFlBQVksQ0FBQyxxQ0FBcUMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDMUcsT0FBTyxFQUFFLE9BQU87WUFDaEIsY0FBYyxFQUFFLE9BQU87WUFDdkIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixZQUFZLEVBQUUsQ0FBQztZQUNmLFlBQVksRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RSxPQUFPLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFO1lBQzFDLHdCQUF3QixFQUFFLEVBQUU7WUFDNUIsZUFBZSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN6QyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRWxDLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7SUFDekcsQ0FBQztDQUVGO0FBbEVELGtDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5cbmltcG9ydCBlYzIgPSByZXF1aXJlKFwiQGF3cy1jZGsvYXdzLWVjMlwiKTtcbmltcG9ydCBlY3MgPSByZXF1aXJlKFwiQGF3cy1jZGsvYXdzLWVjc1wiKTtcbmltcG9ydCBkeW5hbW9kYiA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYicpO1xuaW1wb3J0IGVjc19wYXR0ZXJucyA9IHJlcXVpcmUoXCJAYXdzLWNkay9hd3MtZWNzLXBhdHRlcm5zXCIpO1xuaW1wb3J0IGlhbSA9IHJlcXVpcmUoXCJAYXdzLWNkay9hd3MtaWFtXCIpO1xuXG5leHBvcnQgY2xhc3MgRWNzQ2RrU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgXCJxdWFya3VzLWRlbW8tdnBjXCIsIHtcbiAgICAgIG1heEF6czogM1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2VycycsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsIH0sXG4gICAgICB0YWJsZU5hbWU6ICdVc2VycycsXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXG4gICAgICB3cml0ZUNhcGFjaXR5OiAxLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgXCJxdWFya3VzLWRlbW8tY2x1c3RlclwiLCB7XG4gICAgICB2cGM6IHZwY1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGxvZ2dpbmcgPSBuZXcgZWNzLkF3c0xvZ0RyaXZlcih7XG4gICAgICBzdHJlYW1QcmVmaXg6IFwicXVhcmt1cy1kZW1vXCJcbiAgICB9KVxuXG4gICAgY29uc3QgdGFza1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ3F1YXJrdXMtZGVtby10YXNrUm9sZScsIHtcbiAgICAgIHJvbGVOYW1lOiAncXVhcmt1cy1kZW1vLXRhc2tSb2xlJyxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgdGFza0RlZiA9IG5ldyBlY3MuRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwicXVhcmt1cy1kZW1vLXRhc2tkZWZcIiwge1xuICAgICAgdGFza1JvbGU6IHRhc2tSb2xlXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgY29udGFpbmVyID0gdGFza0RlZi5hZGRDb250YWluZXIoJ3F1YXJrdXMtZGVtby13ZWInLCB7XG4gICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeShcInNtb2VsbC9xdWFya3VzX2Vjc19kZW1vOjAuN1wiKSxcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyNTYsXG4gICAgICBjcHU6IDI1NixcbiAgICAgIGxvZ2dpbmdcbiAgICB9KTtcbiAgICBcbiAgICBjb250YWluZXIuYWRkUG9ydE1hcHBpbmdzKHtcbiAgICAgIGNvbnRhaW5lclBvcnQ6IDgwODAsXG4gICAgICBob3N0UG9ydDogODA4MCxcbiAgICAgIHByb3RvY29sOiBlY3MuUHJvdG9jb2wuVENQXG4gICAgfSk7XG5cbiAgICBjb25zdCBmYXJnYXRlU2VydmljZSA9IG5ldyBlY3NfcGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSh0aGlzLCBcInF1YXJrdXMtZGVtby1zZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogdGFza0RlZixcbiAgICAgIHB1YmxpY0xvYWRCYWxhbmNlcjogdHJ1ZSxcbiAgICAgIGRlc2lyZWRDb3VudDogMyxcbiAgICAgIGxpc3RlbmVyUG9ydDogODA4MFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2NhbGluZyA9IGZhcmdhdGVTZXJ2aWNlLnNlcnZpY2UuYXV0b1NjYWxlVGFza0NvdW50KHsgbWF4Q2FwYWNpdHk6IDYgfSk7XG4gICAgc2NhbGluZy5zY2FsZU9uQ3B1VXRpbGl6YXRpb24oJ0NwdVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDEwLFxuICAgICAgc2NhbGVJbkNvb2xkb3duOiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICBzY2FsZU91dENvb2xkb3duOiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MClcbiAgICB9KTtcbiAgICBcbiAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGFza1JvbGUpXG4gICAgXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xvYWRCYWxhbmNlckROUycsIHsgdmFsdWU6IGZhcmdhdGVTZXJ2aWNlLmxvYWRCYWxhbmNlci5sb2FkQmFsYW5jZXJEbnNOYW1lIH0pO1xuICB9XG5cbn1cbiJdfQ==