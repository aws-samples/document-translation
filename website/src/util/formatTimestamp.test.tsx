import React from "react";

import { formatTimestamp } from "./formatTimestamp";

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const minute = 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
const month = day * 30;
const year = day * 365;

describe("formatTimestamp", () => {
	it('should display "X minutes ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const fiveMinutesAgoInSeconds = currentTimeInSeconds - 5 * minute;

		render(formatTimestamp(fiveMinutesAgoInSeconds));

		expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
	});

	it('should display "X hours ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const twoHoursAgoInSeconds = currentTimeInSeconds - 2 * hour;

		render(formatTimestamp(twoHoursAgoInSeconds));

		expect(screen.getByText("2 hours ago")).toBeInTheDocument();
	});

	it('should display "X days ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const twoHoursAgoInSeconds = currentTimeInSeconds - 3 * day;

		render(formatTimestamp(twoHoursAgoInSeconds));

		expect(screen.getByText("3 days ago")).toBeInTheDocument();
	});

	it('should display "X weeks ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const twoHoursAgoInSeconds = currentTimeInSeconds - 3 * week;

		render(formatTimestamp(twoHoursAgoInSeconds));

		expect(screen.getByText("3 weeks ago")).toBeInTheDocument();
	});

	it('should display "X months ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const twoHoursAgoInSeconds = currentTimeInSeconds - 6 * month;

		render(formatTimestamp(twoHoursAgoInSeconds));

		expect(screen.getByText("6 months ago")).toBeInTheDocument();
	});

	it('should display "X years ago"', () => {
		const currentTimeInSeconds = Math.floor(Date.now() / 1000);
		const twoHoursAgoInSeconds = currentTimeInSeconds - 1 * year;

		render(formatTimestamp(twoHoursAgoInSeconds));

		expect(screen.getByText("1 years ago")).toBeInTheDocument();
	});
});
