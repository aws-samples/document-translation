// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

function detiledTimestamp(unixSeconds) {
	const unixMilliseconds = unixSeconds * 1000;
	const timestamp = new Date(unixMilliseconds);
	return timestamp.toLocaleString();
}

export function formatTimestamp(unixSeconds) {
	const unixMilliseconds = unixSeconds * 1000;
	const timestamp = new Date(unixMilliseconds);

	// Create relative timestemp
	const now = new Date();
	const diff = now - timestamp;
	const diffMinutes = Math.floor(diff / (1000 * 60));
	if (diffMinutes < 60) {
		return (
			<span title={detiledTimestamp(unixSeconds)}>
				{diffMinutes} minutes ago
			</span>
		);
	}
	const diffHours = Math.floor(diff / (1000 * 60 * 60));
	if (diffHours < 24) {
		return (
			<span title={detiledTimestamp(unixSeconds)}>{diffHours} hours ago</span>
		);
	}
	const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
	if (diffDays < 7) {
		return (
			<span title={detiledTimestamp(unixSeconds)}>{diffDays} days ago</span>
		);
	}
	const diffWeeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
	if (diffWeeks < 4) {
		return (
			<span title={detiledTimestamp(unixSeconds)}>{diffWeeks} weeks ago</span>
		);
	}
	const diffMonths = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
	if (diffMonths < 12) {
		return (
			<span title={detiledTimestamp(unixSeconds)}>{diffMonths} months ago</span>
		);
	}
	const diffYears = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
	return (
		<span title={detiledTimestamp(unixSeconds)}>{diffYears} years ago</span>
	);
}
