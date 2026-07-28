import cdk, { Tags } from 'aws-cdk-lib';
import { MyStack } from './constructs/my-stack.js';

const app = new cdk.App();

let stageName = app.node.tryGetContext('stageName');
let stableStageName = app.node.tryGetContext('stableStageName');

if (!stageName) {
  console.log('Defaulting stage name to dev');
  stageName = 'dev';
}

if (!stableStageName) {
  console.log('Defaulting stable stage name to stageName');
  stableStageName = stageName;
}

const serviceName = 'javascript-template-cdk';

new MyStack({
  scope: app,
  id: `${serviceName}-${stageName}`,
  props: {
    serviceName,
    stageName,
    stableStageName,
  },
});

Tags.of(app).add('serviceName', serviceName);
Tags.of(app).add('stageName', stageName);
