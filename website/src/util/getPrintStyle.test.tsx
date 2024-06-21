import { getPrintStyle } from "./getPrintStyle";

// Set the Jest environment to use JSDOM
jest.config = {
	testEnvironment: "jest-environment-jsdom",
};

describe("getPrintStyle", () => {
	let originalLocation: Location;

	beforeEach(() => {
		// Save the original window.location object
		originalLocation = window.location;

		// Mock the window.location.search property
		Object.defineProperty(window, "location", {
			value: {
				search: "?printStyle=print",
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

	test("retrieves print style correctly from URL query parameters", () => {
		const printStyle = getPrintStyle();
		expect(printStyle).toBe("print");
	});
});
