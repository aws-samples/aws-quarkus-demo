import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');
import ecr = require('@aws-cdk/aws-ecr')

export class ApplicationPipelineCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const imageRepository = new ecr.Repository(this, 'ImageRepository', {
      imageScanOnPush: true,
      repositoryName: 'aws-quarkus-demo'
    });

    const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket");

    const codeRepository = new codecommit.Repository(this, 'CodeRepository', {
      repositoryName: 'aws-quarkus-demo-repository'
    });

    // Pipeline creation starts
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactsBucket,
    });

    const sourceOutput = new codepipeline.Artifact();

    // Add source stage to pipeline
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: codeRepository,
          output: sourceOutput
        }),
      ],
    });

    // Declare build output as artifacts
    const buildOutput = new codepipeline.Artifact();

    // Declare a new CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'Build', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        computeType: codebuild.ComputeType.LARGE,
        privileged: true
      },
      environmentVariables: {
        'AWS_ACCOUNT_ID': {
          value: process.env.CDK_DEFAULT_ACCOUNT
        },
        'PACKAGE_BUCKET': {
          value: artifactsBucket.bucketName
        },
        'IMAGE_REPO_NAME': {
          value: imageRepository.repositoryName
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('fargate/buildspec.yaml')
    });

    // Add permission to authenticate at push images to the ECR registry
    imageRepository.grantPullPush(buildProject.grantPrincipal);

    // Add the build stage to our pipeline
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });
  }
}


const app = new cdk.App();
new ApplicationPipelineCdkStack(app, 'ApplicationPipelineCdkStack', {
  env: {
    region: "us-east-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }
});
