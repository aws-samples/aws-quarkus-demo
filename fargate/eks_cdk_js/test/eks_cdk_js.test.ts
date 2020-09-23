import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as EksCdkJs from '../lib/eks_cdk_js-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new EksCdkJs.EksCdkJsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
