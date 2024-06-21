import { getPageJobId } from "./getPageJobId";

// Set the Jest environment to use JSDOM
jest.config = {
	testEnvironment: "jest-environment-jsdom",
};

describe("getPageJobId", () => {
	let originalLocation: Location;

	beforeEach(() => {
		// Save the original window.location object
		originalLocation = window.location;

		// Mock the window.location.search property
		Object.defineProperty(window, "location", {
			value: {
				search: "?jobId=job-123",
			},
			writable: true,
		});
	});

	afterEach(() => {
		// Restore the original window.location object
		Object.defineProperty(window, "location", {
			value: originalLocation,
			writable: true,
		});
	});

	test("retrieves job ID correctly from URL query parameters", () => {
		const jobId = getPageJobId();
		expect(jobId).toBe("job-123");
	});
});
