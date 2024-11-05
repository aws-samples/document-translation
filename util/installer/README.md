# README

The installer util can be run directly or in steps. Previx these actions with `npm run`.

```
npm run wizard
```

## Actions

- `wizard`: Runs all parts of the wizard

The wizard is broken into steps run in this specific order. 

1. `awsconfig`: Gets the AWS config details (E.g. Account ID, Region ID)
2. `options`: Gets the options from the user via interactive CLI
3. `prereq`: Performs preqrequisites (E.g. Enable Macie)
4. `parameters`: Pushes options into parameter store
5. `deploy`: Runs CDK deployment
6. `monitor`: Monitors CodePipeline

For quickly testing manual config changes the parameters and deploy steps can be run with this:

- `parameters_deploy`: combines `parameters` & `deploy` from above

## config.json
A config.json file is created by the installer into the /infrastructure directory. When calling the actions individually this file will need to be copied to the working directory. You can then edit the config.json for quick edits.

```sh
$ pwd
/home/philipws/src/document-translation/util/installer
cp ../../infrastructure/config.json config.json
```

When using the wizard action the json data is passed through the script so no config.json is used. This only applies when being called directly.