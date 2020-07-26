export type LambdaDeployConfiguration = {
    package: string;
    functionName: string;
    indexFileLocation: string;
    description: string;
    memorySize: number;
    awsRegion: string;
    arn_role: string;
    versionId: string;
    timeOut: number;
};
