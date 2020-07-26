/**
 * @copyright : Sachin Kekarjawalekar - 2020
 * github : https://github.com/sachink23
 */

// tslint:disable:no-console

import {LambdaDeployConfiguration} from './lambda-deploy-configuration';
import fs from 'fs';
import AWS, {IAM, Lambda} from 'aws-sdk';
import JSZip from 'jszip';
import {CreateFunctionRequest, FunctionConfiguration, UpdateFunctionConfigurationRequest} from 'aws-sdk/clients/lambda';
import crypto from 'crypto';
import {CreateRoleResponse} from 'aws-sdk/clients/iam';

export class DeployToLambda {
    private config: LambdaDeployConfiguration;
    private lambdaInstance: Lambda;

    constructor(config: LambdaDeployConfiguration) {
        this.config = config;
        // initialize aws sdk
        AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        if (this.validateConfiguration())
            console.log('Configuration Validated Successfully!');
        else {
            console.error('Failed To Validate Deployment Configuration!');
            process.exit(1);
        }
        const lambdaConfigOptions = {
            apiVersion: '2015-03-31',
            maxRetries: 3,
            sslEnabled: true,
            region: this.config.awsRegion,
            logger: console
        };
        this.lambdaInstance = new Lambda(lambdaConfigOptions);
    }

    async deploy(): Promise<boolean> {
        try {
            let functionConfigs: FunctionConfiguration;
            this.config.package = await this.createZipPackageForUpload();
            const functionExists = await this.functionExists();
            if (functionExists) {
                functionConfigs = await this.updateFunctionCode();
                console.log('Comparing configuration of ' + this.config.functionName + ' with the deployment configuration...');
                if (functionConfigs)
                    if (!(functionConfigs.Description === this.config.description && functionConfigs.MemorySize === this.config.memorySize && functionConfigs.Timeout === this.config.timeOut))
                        functionConfigs = await this.updateFunctionConfig();
                    else
                        console.log('No need to update the configuration of ' + this.config.functionName + '!');
            } else
                functionConfigs = await this.createNewFunction();

            console.log('Successfully deployed function with following configuration -');
            console.log(functionConfigs);

        } catch (e) {
            throw new Error(e);
        }
        console.log(this.config.package);
        return true;
    }

    private validateConfiguration(): boolean {
        console.log('Validating Deployment Configuration...');
        if (this.config.functionName === undefined) {
            console.error('Please Provide Valid Function Name In Deployment Configuration');
            return false;
        }
        if (this.config.indexFileLocation === undefined)
            this.config.indexFileLocation = 'dist/index.js';
        if (!fs.existsSync(this.config.indexFileLocation)) {
            console.error('Index file' + this.config.indexFileLocation + ' not found');
            return false;
        }
        if (this.config.description === undefined)
            this.config.description = '';
        if (this.config.timeOut === undefined)
            this.config.timeOut = 3;
        if (this.config.awsRegion === undefined)
            if (AWS.config.region === undefined) {
                console.error('AWS region is undefined in deployment configuration!');
                return false;
            } else
                this.config.awsRegion = AWS.config.region;


        this.config.versionId = crypto.randomBytes(8).toString('hex');
        return true;
    }

    private async createZipPackageForUpload(): Promise<string> {
        const zipLocation = 'dist/lambda-' + this.config.versionId + '.zip';
        console.log('Zipping ' + this.config.indexFileLocation + ' to ' + zipLocation + ' for uploading...');
        const ZipBuffer = new JSZip();
        ZipBuffer.file('index.js', fs.readFileSync(this.config.indexFileLocation).toString());
        return new Promise((resolve, reject) => {
            ZipBuffer.generateNodeStream({type: 'nodebuffer', streamFiles: true})
                .pipe(fs.createWriteStream(zipLocation))
                .on('finish', () => {
                    console.log(zipLocation + ' created successfully!');
                    return resolve(zipLocation);
                })
                .on('error', () => {
                    return reject('Failed to zip ' + this.config.indexFileLocation);
                });
        });
    }

    private async functionExists(): Promise<Lambda.GetFunctionResponse | false> {
        return new Promise((resolve, reject) => {
            console.log('Checking if ' + this.config.functionName + ' exists in the region ' + this.config.awsRegion + '...');
            this.lambdaInstance.getFunction({FunctionName: this.config.functionName}, (err, functionResponse) => {
                if (err)
                    if (err.code === 'ResourceNotFoundException') {
                        console.log(this.config.functionName + ' not found in the region ' + this.config.awsRegion + '!');
                        return resolve(false);
                    } else
                        return reject(err.message);
                else {
                    console.log(this.config.functionName + ' found in the region ' + this.config.awsRegion + '!');
                    return resolve(functionResponse);
                }
            });

        });
    }

    private async updateFunctionCode(): Promise<Lambda.FunctionConfiguration> {
        return new Promise((resolve, rejects) => {
            this.lambdaInstance.updateFunctionCode({
                FunctionName: this.config.functionName,
                ZipFile: fs.readFileSync(this.config.package),
                Publish: true

            }, (err, functionConfiguration) => {
                if (err)
                    rejects(err.message);
                else {
                    console.log('Code of function ' + this.config.functionName + ' updated successfully in the region ' + this.config.awsRegion + '!');
                    resolve(functionConfiguration);
                }
            });
        });
    }

    private async createNewFunction(): Promise<FunctionConfiguration> {
        if (this.config.arn_role === undefined)
            try {
                const role = await this.createNewRoleForLambdaExecution();
                if (role.Role.Arn)
                    this.config.arn_role = role.Role.Arn;
            } catch (e) {
                return new Promise((resolve, reject) => {
                    return reject(e);
                });
            }
        // wait for 25 seconds as role creation might take some time to get ready to use
        console.log('As IAM role creation takes time, waiting for 25 seconds...');
        const wait = await new Promise(resolve => setTimeout(() => resolve(true), 30000));
        console.log('Finished Waiting!');
        let functionConfig: CreateFunctionRequest;
        functionConfig = {
            FunctionName: this.config.functionName,
            Description: this.config.description,
            MemorySize: this.config.memorySize,
            Handler: 'index.handler',
            Role: this.config.arn_role,
            Runtime: 'nodejs12.x',
            Timeout: this.config.timeOut,
            Code: {
                ZipFile: fs.readFileSync(this.config.package)
            }

        };
        return new Promise(((resolve, reject) => {
            console.log('Creating new function ' + this.config.functionName + ' in the region ' + this.config.awsRegion);
            this.lambdaInstance.createFunction(functionConfig, (err, functionConfigs) => {
                if (err)
                    reject(err.message);
                console.log(this.config.functionName + ' created successfully in the region ' + this.config.awsRegion);
                resolve(functionConfigs);
            });
        }));
    }

    private async createNewRoleForLambdaExecution(): Promise<CreateRoleResponse> {
        const roleName = ('lambda_' + this.config.functionName + '_' + crypto.randomBytes(8).toString('hex'));

        console.log('Creating new role - ' + roleName + ' for ' + this.config.functionName + '!');
        const iam = new AWS.IAM({apiVersion: '2010-05-08'});
        const lambdaExecutionPolicy = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }
            ]
        };
        const createParams: AWS.IAM.CreateRoleRequest = {
            AssumeRolePolicyDocument: JSON.stringify(lambdaExecutionPolicy),
            RoleName: roleName
        };
        const policyParams: IAM.AttachRolePolicyRequest = {
            PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole',
            RoleName: roleName
        };
        return new Promise((resolve, reject) => {
            iam.createRole(createParams, (err, roleCreationResponse) => {
                if (err)
                    return reject(err.message);
                console.log(roleName + ' created successfully!');
                console.log('Attaching ' + roleName + ' to the policy arn:aws:iam::aws:policy/service-role/AWSLambdaRole');

                iam.attachRolePolicy(policyParams, err1 => {
                    if (err1)
                        return reject(err1.message);
                    return resolve(roleCreationResponse);
                });
                console.log(roleName + ' successfully attached to  the policy arn:aws:iam::aws:policy/service-role/AWSLambdaRole');
            });
        });
    }

    private async updateFunctionConfig(): Promise<Lambda.FunctionConfiguration> {
        console.log('Updating configuration of ' + this.config.functionName + ' with the deployment configuration...');

        const params: UpdateFunctionConfigurationRequest = {
            FunctionName: this.config.functionName,
            MemorySize: this.config.memorySize,
            Description: this.config.description,
            Timeout: this.config.timeOut
        };
        return new Promise((resolve, reject) => {
            this.lambdaInstance.updateFunctionConfiguration(params, (err, data) => {
                if (err)
                    return reject(err.message);
                console.log('Successfully updated configuration of ' + this.config.functionName + ' with the deployment configuration!');
                return resolve(data);
            });
        });
    }
}
