#!/bin/bash

# Clone the repository
echo "Cloning the repository..."
git clone https://github.com/aws-samples/document-translation.git
cd "document-translation" || exit

# Set the working directory
WORKDIR=$(pwd)
INSTALLERDIR="${WORKDIR}/installer"
INFRADIR="${WORKDIR}/infrastructure"

# Install dependencies
echo "Installing dependencies for CDK infrastructure..."
cd "${INFRADIR}" || exit
npm install

# Run the installer
echo "Installing dependencies for installer..."
cd "${INSTALLERDIR}" || exit
echo "Running installer..."
npm install
npm run wizard
