#!/bin/bash

# Clone the repository
echo "Cloning the repository..."
git clone https://github.com/aws-samples/document-translation.git
cd "document-translation" || exit

# Set the working directory
WORKDIR=$(pwd)
INSTALLERDIR="${WORKDIR}/util/installer"
INFRADIR="${WORKDIR}/infrastructure"

# See https://github.com/aws-samples/document-translation/issues/93
export UV_USE_IO_URING=0

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
