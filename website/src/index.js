// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React    from 'react';
import { createRoot } from 'react-dom/client';

// AMPLIFY
import '@aws-amplify/ui-react/styles.css';
// APP
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);