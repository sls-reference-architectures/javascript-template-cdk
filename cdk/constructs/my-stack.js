import { Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnOutput } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

class MyStack extends Stack {
  constructor({ scope, id, props }) {
    super(scope, id, props);
    const api = new HttpApi(this, `${props.stageName}-${props.serviceName}`, {
      deployOptions: {
        stageName: props.stageName,
        tracingEnabled: true,
      },
    });
    const helloWorldFunction = this.createHelloWorldFunction(props);
    this.createApiEndpoints({ api, functions: { hello: helloWorldFunction } });

    // Outputs
    new CfnOutput(this, 'HttpApiUrl', {
      description: 'URL of the HTTP API',
      value: api.apiEndpoint,
    });
  }

  createHelloWorldFunction(props) {
    return this.createFunction({
      props,
      fileName: 'helloWorld.js',
      logicalId: 'HelloWorldFunction',
    });
  }

  createFunction({ props, fileName, logicalId }) {
    const func = new NodejsFunction(this, logicalId, {
      bundling: {
        minify: true,
      },
      runtime: Runtime.NODEJS_22_X,
      handler: 'default',
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

  createApiEndpoints({ api, functions }) {
    // const helloResource = api.root.addResource('hello');

    // // GET /hello
    // helloResource.addMethod('GET', new HttpLambdaIntegration(functions.hello));
    api.addRoutes({
      path: '/hello',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HelloWorldIntegration', functions.hello),
    });
  }
}

export { MyStack };
