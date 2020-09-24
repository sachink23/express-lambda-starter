_Express Lambda Starter_
---
Boilerplate to automate express-js deployment with typescript for aws-lambda.

![Deploy to AWS Lambda](https://github.com/sachink23/express-lambda-starter/workflows/Deploy%20to%20AWS%20Lambda/badge.svg)

### Prerequisites

You need to have node 12x version installed on your computer.

### Getting Started

-   To get started clone this repository using -

        git clone https://github.com/sachink23/express-lambda-starter
       


### Usage

-   Set the name of your package, repository in [package.json](package.json)
-   Set deployment configuration for lambda deployment in [deployment.config.json](deployment-config.json)

-   Install npm dependencies using npm install in the root directory of project

    ```
    npm install
    ```
-   Now you can start coding your express with typescript in [src/app.ts](src/app.ts)

-   To Start development server use

    ```
    npm run dev
    ```
    - By default, development server will start on port 8000
    
-   To build the project use 
    ```
    npm run build
    ```

    - Build files are stored in the dist/ directory
    - The function to deploy is stored in dist/index.js


### Deployment
-   You can deploy project from your computer or setup your continuous deployment pipeline to deploy on every pull request using [github actions](/.github/workflows/deploy-to-aws.yml).
-   For deployment configuration use [deoloyment-config.json](deployment-config.json)
-   **Deploy From your local computer**
    -   To deploy locally you must have environment variables set as follows -
        ````
        AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_FOR_ACCESS_KEY
        ````
    - Once you have successfully set the environment variables build and deploy the project
        ```
       npm run build && npm run deploy
        ```
        
-   **Deploy Using Github Actions**
    -   To deploy using github actions set the following secrets for your cloned repository in github
        
        ````
        AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_FOR_ACCESS_KEY
        ````
    
-   You can also use [serverless-framework](https://www.serverless.com/) for easier deployment

