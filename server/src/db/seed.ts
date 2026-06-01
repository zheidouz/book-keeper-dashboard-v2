import { db, schema } from "./adapter.js";
import { eq } from "drizzle-orm";
export async function seedBIRForms() {
  const forms: Array<{formCode:string;name:string;description?:string;category:string;filingFrequency:"monthly"|"quarterly"|"annually"|"semi_annual";deadlineDay:number;deadlineMonthOffset:number;deadlineRule?:string}> = [
    // ── Income Tax ──
    {formCode:"1700",name:"Annual Income Tax Return (Individuals Earning Purely Compensation Income)",description:"Annual ITR for employees",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"Apr-15"},
    {formCode:"1701",name:"Annual Income Tax Return for Individuals, Estates and Trusts",description:"Annual ITR for self-employed/mixed income",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"Apr-15"},
    {formCode:"1701A",name:"Annual Income Tax Return (Purely Business/Professional Income)",description:"Simplified annual ITR for 8%/OSD taxpayers",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"Apr-15"},
    {formCode:"1701Q",name:"Quarterly Income Tax Return",description:"Quarterly income tax filing for individuals",category:"income_tax",filingFrequency:"quarterly",deadlineDay:15,deadlineMonthOffset:1,deadlineRule:"May 15, Aug 15, Nov 15"},
    {formCode:"1702",name:"Annual Income Tax Return for Corporations",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4},
    {formCode:"1702-EX",name:"Annual Income Tax Return (EXEMPT Corporation)",description:"For exempt corporations",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"15th day of 4th month after fiscal year"},
    {formCode:"1702-MX",name:"Annual Income Tax Return (Mixed Income Corporation)",description:"Corporate annual ITR",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"15th day of 4th month after fiscal year"},
    {formCode:"1702-RT",name:"Annual Income Tax Return (Regular Corporation)",description:"Corporate annual ITR",category:"income_tax",filingFrequency:"annually",deadlineDay:15,deadlineMonthOffset:4,deadlineRule:"15th day of 4th month after fiscal year"},
    {formCode:"1702Q",name:"Quarterly Income Tax Return for Corporations",description:"Corporate quarterly income tax",category:"income_tax",filingFrequency:"quarterly",deadlineDay:15,deadlineMonthOffset:1,deadlineRule:"Within 60 days after quarter"},
    {formCode:"1706",name:"Capital Gains Tax Return (Real Property)",description:"Sale/transfer of real property",category:"income_tax",filingFrequency:"quarterly",deadlineDay:30,deadlineMonthOffset:0,deadlineRule:"Within 30 days of sale"},
    {formCode:"1707",name:"Capital Gains Tax Return (Shares Not Traded)",description:"Sale of unlisted shares",category:"income_tax",filingFrequency:"quarterly",deadlineDay:30,deadlineMonthOffset:0,deadlineRule:"Within 30 days after transaction"},
    // ── Withholding Tax ──
    {formCode:"0619-E",name:"Monthly Remittance Form of Creditable Income Taxes Withheld (Expanded)",description:"Monthly remittance of expanded withholding tax",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0,deadlineRule:"10th day of following month"},
    {formCode:"0619-F",name:"Monthly Remittance Form of Final Income Taxes Withheld",description:"Monthly remittance of final withholding taxes",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0,deadlineRule:"10th day of following month"},
    {formCode:"1601-C",name:"Monthly Remittance Return of Income Taxes Withheld on Compensation",description:"Employer withholding tax on salaries",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0,deadlineRule:"10th day of following month"},
    {formCode:"1601-EQ",name:"Quarterly Remittance Return of Creditable Income Taxes Withheld",description:"Quarterly expanded withholding taxes",category:"withholding_tax",filingFrequency:"quarterly",deadlineDay:31,deadlineMonthOffset:0,deadlineRule:"Last day of month after quarter"},
    {formCode:"1601-FQ",name:"Quarterly Remittance Return of Final Income Taxes Withheld",description:"Quarterly final withholding taxes",category:"withholding_tax",filingFrequency:"quarterly",deadlineDay:31,deadlineMonthOffset:0,deadlineRule:"Last day of month after quarter"},
    {formCode:"1601C",name:"Monthly Remittance Return of Income Taxes Withheld on Compensation",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0},
    {formCode:"1601E",name:"Monthly Remittance Return of Income Taxes Withheld on Expanded",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0},
    {formCode:"1601F",name:"Monthly Remittance Return of Final Income Taxes Withheld",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0},
    {formCode:"1603",name:"Monthly Remittance Return of Creditable Income Taxes Withheld",category:"withholding_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0},
    {formCode:"1604-CF",name:"Annual Information Return of Income Taxes Withheld on Compensation and Final Withholding Taxes",description:"Annual summary of compensation withholding",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1,deadlineRule:"Jan-31"},
    {formCode:"1604-E",name:"Annual Information Return of Creditable Income Taxes Withheld",description:"Annual summary of expanded withholding taxes",category:"withholding_tax",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:3,deadlineRule:"Mar-01"},
    {formCode:"1604C",name:"Annual Information Return of Income Taxes Withheld on Compensation",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1},
    {formCode:"1604E",name:"Annual Information Return of Income Taxes Withheld on Expanded",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1},
    {formCode:"1604F",name:"Annual Information Return of Final Income Taxes Withheld",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1},
    {formCode:"2304",name:"Certificate of Income Payment Not Subject to Withholding Tax",description:"Certification of tax-exempt payments",category:"withholding_tax",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Issued as needed"},
    {formCode:"2306",name:"Certificate of Final Tax Withheld",description:"Proof of final tax withheld",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1,deadlineRule:"Jan-31"},
    {formCode:"2307",name:"Certificate of Creditable Tax Withheld at Source",description:"Proof of expanded withholding tax",category:"withholding_tax",filingFrequency:"quarterly",deadlineDay:20,deadlineMonthOffset:1,deadlineRule:"20th day after quarter"},
    {formCode:"2316",name:"Certificate of Compensation Payment/Tax Withheld",description:"Employee annual withholding certificate",category:"withholding_tax",filingFrequency:"annually",deadlineDay:31,deadlineMonthOffset:1,deadlineRule:"Jan-31"},
    // ── VAT ──
    {formCode:"2550M",name:"Monthly VAT Declaration",description:"Monthly VAT filing",category:"vat",filingFrequency:"monthly",deadlineDay:20,deadlineMonthOffset:0,deadlineRule:"20th day after month"},
    {formCode:"2550Q",name:"Quarterly VAT Return",description:"Quarterly VAT return",category:"vat",filingFrequency:"quarterly",deadlineDay:25,deadlineMonthOffset:1,deadlineRule:"25th day after quarter"},
    {formCode:"1600-VT",name:"Monthly Remittance Return of VAT Withheld",description:"VAT withholding taxes",category:"vat",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0,deadlineRule:"10th day of following month"},
    // ── Percentage Tax ──
    {formCode:"2551M",name:"Monthly Percentage Tax Return",category:"percentage_tax",filingFrequency:"monthly",deadlineDay:20,deadlineMonthOffset:0},
    {formCode:"2551Q",name:"Quarterly Percentage Tax Return",description:"Percentage tax for non-VAT taxpayers",category:"percentage_tax",filingFrequency:"quarterly",deadlineDay:25,deadlineMonthOffset:1,deadlineRule:"25th day after quarter"},
    {formCode:"1600-PT",name:"Monthly Remittance Return of Percentage Taxes Withheld",description:"Percentage taxes withheld",category:"percentage_tax",filingFrequency:"monthly",deadlineDay:10,deadlineMonthOffset:0,deadlineRule:"10th day of following month"},
    // ── DST ──
    {formCode:"2000",name:"Documentary Stamp Tax Return",description:"DST filing/payment",category:"dst",filingFrequency:"monthly",deadlineDay:5,deadlineMonthOffset:0,deadlineRule:"5 days after month-end"},
    // ── Payments ──
    {formCode:"0605",name:"Payment Form/Tax Remittance Advice",category:"payments",filingFrequency:"monthly",deadlineDay:15,deadlineMonthOffset:0},
    {formCode:"605",name:"Payment Form",description:"Used for tax payments without a dedicated tax return form",category:"payments",filingFrequency:"monthly",deadlineDay:15,deadlineMonthOffset:0,deadlineRule:"Depends on tax type"},
    // ── Registration ──
    {formCode:"1901",name:"Application for Registration (Self-Employed & Mixed Income)",description:"Registration for freelancers/business owners",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Upon start of business"},
    {formCode:"1902",name:"Application for Registration (Employees)",description:"Employee TIN registration",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Upon employment"},
    {formCode:"1903",name:"Application for Registration (Corporations/Partnerships)",description:"Business/corporation registration",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Before business operations"},
    {formCode:"1904",name:"Application for Registration (One-Time Taxpayer)",description:"TIN for one-time transactions",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Before transaction"},
    {formCode:"1905",name:"Application for Registration Update",description:"Updates/corrections/cancellation",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"As needed"},
    {formCode:"1906",name:"Application for Authority to Print Receipts/Invoices",description:"Authority to print invoices",category:"registration",filingFrequency:"annually",deadlineDay:1,deadlineMonthOffset:0,deadlineRule:"Before printing"},
    // ── Donor & Estate Tax ──
    {formCode:"1800",name:"Donor's Tax Return",description:"Donation/gift tax filing",category:"donor_estate",filingFrequency:"quarterly",deadlineDay:30,deadlineMonthOffset:0,deadlineRule:"Within 30 days after donation"},
    {formCode:"1801",name:"Estate Tax Return",description:"Estate settlement tax",category:"donor_estate",filingFrequency:"annually",deadlineDay:30,deadlineMonthOffset:0,deadlineRule:"Within 1 year from death"},
  ];
  for (const f of forms) {
    try {
      await db.insert(schema.birForms).values(f).onConflictDoNothing();
    } catch { /* skip duplicates */ }
  }
  console.log("Seeded " + forms.length + " BIR forms (duplicates skipped)");
}
export async function seedDefaultAdmin() {
  const existing = await db.select().from(schema.users).where(eq(schema.users.role, "admin"));
  if (existing.length > 0) return;
  await db.insert(schema.users).values({clerkId:"default_admin",name:"System Admin",email:"admin@bookkeeper.app",role:"admin"});
  console.log("Seeded default admin user");
}
