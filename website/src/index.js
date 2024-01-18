// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter }from 'react-router-dom';

// APP
import App from './App';
import './static/index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);