# README

The getOptions runs in the CodePipeline to pull the SSM Parameter Store config and generate a config.json. The config.json is then used aas an input into the CDK deployment. This util can be run directly.

To pull the correct SSM Parameter Store values we must set the `INSTANCE_NAME` that is used in the prefix. By default this is `main`. 

```
export INSTANCE_NAME="main"
npm run start
```

The CodePipeline synth step copies the result of this util into the CDK working directory (/infrastructure).

```sh
cp ./config.json ../../infrastructure/config.json && cat ../../infrastructure/config.json
```