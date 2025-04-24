// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Downloads a file from a Uint8Array with the specified filename
 */
export function downloadFile(
	data: Uint8Array,
	filename: string,
	contentType: string
): void {
	// Create a blob from the Uint8Array
	const blob = new Blob([data], { type: contentType });

	// Create a URL for the blob
	const url = URL.createObjectURL(blob);

	// Create a temporary anchor element
	const link = document.createElement("a");
	link.href = url;

	// Generate the download filename
	// Extract the original extension if present
	const lastDotIndex = filename.lastIndexOf(".");
	const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";
	const baseName =
		lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;

	// Append target language code if needed (will be handled by the caller)
	link.download = filename;

	// Append to the document, click it, and remove it
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL object
	setTimeout(() => URL.revokeObjectURL(url), 100);
}
