import React from "react";

import { formatJobNameId } from "./formatJobNameId";

describe("formatJobNameId", () => {
	test("formats job name and ID correctly", () => {
		const jobName = "Job Name";
		const jobId = "job-id";

		const formattedJobNameId = formatJobNameId(jobName, jobId);

		expect(formattedJobNameId).toEqual(
			<span>
				<span>Job Name</span>
				<br />
				<span className="jobId">job-id</span>
			</span>
		);
	});
});
