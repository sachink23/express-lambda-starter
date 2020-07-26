// tslint:disable:no-console
import fs from 'fs';
import {DeployToLambda} from './deploy-to-lambda';

const config = JSON.parse(fs.readFileSync('deployment-config.json').toString());

const deployToLambda = new DeployToLambda(config);

deployToLambda.deploy().then(() => {
    console.log('Deployment Successful!');
    process.exit(0);
}).catch(reason => {
    console.log(reason, 'Deployment Failed!');
    process.exit(1);
});

