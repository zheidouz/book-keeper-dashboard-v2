interface DeadlineInput {
  filingFrequency: string;
  deadlineDay: number;
  deadlineMonthOffset: number;
  referenceDate?: Date;
}

interface DeadlineResult {
  deadline: string;
  filingPeriod: string;
  taxYear: number;
  label: string;
}

export function calculateDeadline(input: DeadlineInput): DeadlineResult {
  const now = input.referenceDate || new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let deadlineMonth, deadlineYear, filingPeriod, taxYear, label;
  switch (input.filingFrequency) {
    case "monthly":
      deadlineMonth = month + input.deadlineMonthOffset; deadlineYear = year;
      if (deadlineMonth > 11) { deadlineMonth -= 12; deadlineYear++; }
      filingPeriod = year + "-" + String(month + 1).padStart(2, "0"); taxYear = year;
      label = "Monthly filing for " + filingPeriod; break;
    case "quarterly":
      const q = Math.floor(month / 3) + 1;
      deadlineMonth = q * 3 + input.deadlineMonthOffset; deadlineYear = year;
      if (deadlineMonth > 11) { deadlineMonth -= 12; deadlineYear++; }
      filingPeriod = year + "-Q" + q; taxYear = year; label = "Q" + q + " " + year; break;
    case "annually":
      // deadlineMonthOffset is 1-indexed month number (1=Jan, 4=Apr)
      deadlineMonth = Math.max(0, input.deadlineMonthOffset - 1);
      // Use current year if the deadline month hasn't passed yet, else next year
      deadlineYear = (deadlineMonth > month || (deadlineMonth === month && input.deadlineDay >= now.getDate()))
        ? year
        : year + 1;
      filingPeriod = "" + year; taxYear = year; label = "Annual filing for tax year " + year; break;
    default:
      deadlineMonth = month + input.deadlineMonthOffset; deadlineYear = year;
      if (deadlineMonth > 11) { deadlineMonth -= 12; deadlineYear++; }
      filingPeriod = year + "-" + String(month + 1).padStart(2, "0"); taxYear = year;
      label = "Filing for " + filingPeriod;
  }
  const lastDay = new Date(deadlineYear, deadlineMonth + 1, 0).getDate();
  const d = Math.min(input.deadlineDay, lastDay);

  // Use local date parts, not toISOString (which shifts by timezone offset)
  const deadlineDate = new Date(deadlineYear, deadlineMonth, d);
  const deadlineStr =
    deadlineYear + "-" +
    String(deadlineMonth + 1).padStart(2, "0") + "-" +
    String(d).padStart(2, "0");

  // Compare using local date value (midnight-to-midnight)
  const deadlineMs = deadlineDate.getTime();
  const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (deadlineMs < nowMs && input.filingFrequency !== "one_time") {
    return calculateDeadline({ ...input, referenceDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) });
  }
  return { deadline: deadlineStr, filingPeriod, taxYear, label };
}
