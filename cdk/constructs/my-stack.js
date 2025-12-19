import { Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';

class MyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const api = new RestApi(this, `${props.stageName}-${props.serviceName}`, {
      deployOptions: {
        stageName: props.stageName,
        tracingEnabled: true,
      },
    });
    const helloWorldFunction = this.createHelloWorldFunction(props);

    this.createApiEndpoints(api, { hello: helloWorldFunction });
  }

  createHelloWorldFunction(props) {
    return this.createFunction(props, 'helloWorld.js', 'HelloWorldFunction');
  }

  createFunction(props, fileName, logicalId) {
    const func = new NodejsFunction(this, logicalId, {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: `./src/${fileName}`,
      memorySize: 1024,
      environment: {
        POWERTOOLS_LOG_LEVEL: props.stageName === 'prod' ? 'INFO' : 'DEBUG',
        SERVICE_NAME: props.serviceName,
        STAGE_NAME: props.stageName,
        STABLE_STAGE_NAME: props.stableStageName,
      },
    });

    return func;
  }

  createApiEndpoints(api, functions) {
    const helloResource = api.root.addResource('hello');

    // GET /hello
    helloResource.addMethod('GET', new LambdaIntegration(functions.hello));
  }
}

export { MyStack };
