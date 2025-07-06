// --- MOCK DATABASE ---
// In a real application, this data would live in a database like Firestore or PostgreSQL.

export interface BankInfo {
    bank_name: string;
    account_number: string;
    account_name: string;
}

interface Investor {
    id: string;
    name: string;
    total_investment: number;
    current_balance: number;
    total_earnings: number;
    total_withdrawn: number;
    join_date: string;
    bank_info: BankInfo;
    auto_withdraw: {
        enabled: boolean;
        threshold: number;
    };
}

interface DailyReport {
    date: string;
    total_revenue: number;
    milestone_status: boolean;
    distributions: {
        founder_share: number;
        investor_pool: number;
        development_fund: number;
    };
    investor_earnings: { [investorId: string]: number };
}

interface Withdrawal {
    withdrawal_id: string;
    investor_id: string;
    amount: number;
    status: 'processing' | 'completed' | 'failed';
    type: 'auto' | 'manual';
    transaction_id?: string;
    created_at: string;
    completed_at?: string;
}


let investors: Investor[] = [
    { 
        id: 'inv_001', name: 'Nattapong', total_investment: 100000, current_balance: 0, 
        total_earnings: 0, total_withdrawn: 0, join_date: '2024-01-01', 
        bank_info: { bank_name: 'K-Bank', account_number: 'xxx-x-x1234-x', account_name: 'Nattapong' },
        auto_withdraw: { enabled: true, threshold: 5000 }
    },
    { 
        id: 'inv_002', name: 'Siriporn', total_investment: 250000, current_balance: 0, 
        total_earnings: 0, total_withdrawn: 0, join_date: '2024-01-15', 
        bank_info: { bank_name: 'SCB', account_number: 'xxx-x-x5678-x', account_name: 'Siriporn' },
        auto_withdraw: { enabled: true, threshold: 10000 }
    },
    { 
        id: 'inv_003', name: 'Somchai', total_investment: 50000, current_balance: 0, 
        total_earnings: 0, total_withdrawn: 0, join_date: '2024-02-01', 
        bank_info: { bank_name: 'BBL', account_number: 'xxx-x-x9012-x', account_name: 'Somchai' },
        auto_withdraw: { enabled: false, threshold: 0 }
    },
];

let dailyReports: DailyReport[] = [];
let withdrawals: Withdrawal[] = [];

// --- BUSINESS LOGIC ---

const FOUNDER_MILESTONE = 50000;
const FOUNDER_SHARE_RATE = 0.20;
const INVESTOR_SHARE_RATE = 0.70;
const DEVELOPMENT_SHARE_RATE = 0.10;

function processDailyRevenue(daily_revenue: number): DailyReport {
    const total_investment_pool = investors.reduce((sum, inv) => sum + inv.total_investment, 0);

    let founder_share: number;
    let investor_pool: number;
    let development_fund: number;
    const investor_earnings: { [investorId: string]: number } = {};

    // Milestone logic is now based on the total investment pool.
    if (total_investment_pool <= FOUNDER_MILESTONE) {
        founder_share = daily_revenue;
        investor_pool = 0;
        development_fund = 0;
        // No earnings for investors as the pool is 0.
    } else {
        founder_share = daily_revenue * FOUNDER_SHARE_RATE;
        investor_pool = daily_revenue * INVESTOR_SHARE_RATE;
        development_fund = daily_revenue * DEVELOPMENT_SHARE_RATE;

        // Distribute the investor pool based on their share of the total investment.
        if (total_investment_pool > 0) {
            investors.forEach(investor => {
                const investment_share = investor.total_investment / total_investment_pool;
                const earnings = investor_pool * investment_share;
                investor.total_earnings += earnings;
                investor.current_balance += earnings;
                investor_earnings[investor.id] = earnings;
            });
        }
    }

    const newReport: DailyReport = {
        date: new Date().toISOString().split('T')[0],
        total_revenue: daily_revenue,
        milestone_status: total_investment_pool > FOUNDER_MILESTONE,
        distributions: {
            founder_share,
            investor_pool,
            development_fund,
        },
        investor_earnings,
    };
    
    return newReport;
}

// Simulate some past data
if (dailyReports.length === 0) {
    // Reset earnings before recalculating with new logic
    investors.forEach(inv => {
        inv.total_earnings = 0;
        inv.current_balance = 0;
        inv.total_withdrawn = 0;
    });
    dailyReports.push(processDailyRevenue(40000));
    dailyReports.push(processDailyRevenue(30000));
}

// --- API-like Functions ---

/**
 * Adds a new investor to the system.
 * @param id The unique ID for the new investor.
 * @param name The name of the investor.
 * @param amount The investment amount. Must be at least 10,000.
 * @param bank_info The investor's bank account information.
 * @returns A status object with the result of the operation.
 */
export async function addInvestor(
  id: string,
  name: string,
  amount: number,
  bank_info: BankInfo
): Promise<{
    success: boolean;
    message?: string;
    investor_id?: string;
    investment_amount?: number;
    percentage?: number;
    milestone_status?: {
      current_total: number;
      milestone_reached: boolean;
      amount_to_milestone: number;
    };
  }> {
    // Validate minimum investment
    if (amount < 10000) {
        return { success: false, message: 'Minimum investment is 10,000 baht.' };
    }

    // Check if investor already exists
    if (investors.find(inv => inv.id === id)) {
        return { success: false, message: `Investor with ID ${id} already exists.` };
    }

    const newInvestor: Investor = {
        id,
        name,
        total_investment: amount,
        current_balance: 0,
        total_earnings: 0,
        total_withdrawn: 0,
        join_date: new Date().toISOString().split('T')[0],
        bank_info,
        auto_withdraw: { enabled: false, threshold: 5000 }, // Default auto-withdraw to off
    };

    investors.push(newInvestor);

    const total_investment_pool = investors.reduce((sum, inv) => sum + inv.total_investment, 0);
    const percentage = (amount / total_investment_pool) * 100;
    const milestone_reached = total_investment_pool > FOUNDER_MILESTONE;
    const amount_to_milestone = Math.max(0, FOUNDER_MILESTONE - total_investment_pool);


    return {
        success: true,
        investor_id: id,
        investment_amount: amount,
        percentage: parseFloat(percentage.toFixed(2)),
        milestone_status: {
            current_total: total_investment_pool,
            milestone_reached: milestone_reached,
            amount_to_milestone: amount_to_milestone,
        },
    };
}


export async function getInvestmentData() {
    const totalInvestment = investors.reduce((sum, inv) => sum + inv.total_investment, 0);
    const totalRevenue = dailyReports.reduce((sum, rep) => sum + rep.total_revenue, 0);
    const totalFounderEarnings = dailyReports.reduce((sum, rep) => sum + rep.distributions.founder_share, 0);

    const overview = {
        totalInvestment,
        totalRevenue,
        totalInvestors: investors.length,
        totalFounderEarnings,
    };

    const investorsWithROI = investors.map(inv => ({
        ...inv,
        roi: inv.total_investment > 0 ? (inv.total_earnings / inv.total_investment) * 100 : 0
    }));

    // Return a deep copy to avoid direct mutation of mock DB
    return Promise.resolve({
        overview: JSON.parse(JSON.stringify(overview)),
        investors: JSON.parse(JSON.stringify(investorsWithROI)),
        dailyReports: JSON.parse(JSON.stringify(dailyReports.slice(-5).reverse())), // last 5 days
    });
}

/**
 * Mocks the processing of a single withdrawal request.
 * In a real app, this would interact with a payment gateway.
 */
function processWithdrawal(details: {
  investor_id: string;
  amount: number;
  type: 'auto' | 'manual';
  bank_info: BankInfo;
}): {
    success: boolean;
    message?: string;
    withdrawal_id?: string;
    amount?: number;
    status?: 'processing' | 'completed' | 'failed';
    estimated_completion?: string;
    transaction_reference?: string;
  } {
    const investor = investors.find(inv => inv.id === details.investor_id);

    if (!investor) {
        return { success: false, message: 'Investor not found.' };
    }

    if (investor.current_balance < details.amount) {
        return { success: false, message: 'Insufficient balance.' };
    }

    const withdrawal_id = `wd_${Date.now()}`;
    const newWithdrawal: Withdrawal = {
        withdrawal_id,
        investor_id: details.investor_id,
        amount: details.amount,
        status: 'completed', // Simulate immediate completion
        type: details.type,
        transaction_id: `txn_${Math.random().toString(36).substring(2, 15)}`,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
    };

    withdrawals.push(newWithdrawal);

    // Update investor's balance
    investor.current_balance -= details.amount;
    investor.total_withdrawn += details.amount;

    console.log(`Processed ${details.type} withdrawal for ${investor.name}: ${details.amount} THB`);

    return { 
        success: true,
        withdrawal_id: newWithdrawal.withdrawal_id,
        amount: newWithdrawal.amount,
        status: newWithdrawal.status,
        estimated_completion: newWithdrawal.completed_at,
        transaction_reference: newWithdrawal.transaction_id,
    };
}


/**
 * Filters and returns investors who have auto-withdrawal enabled.
 */
function getInvestorsForAutoWithdraw(): Investor[] {
    return investors.filter(investor => investor.auto_withdraw.enabled);
}


/**
 * Simulates the daily auto-withdrawal process.
 * This would be triggered by a cron job in a real application.
 */
export async function processAutoWithdrawals() {
  console.log('Starting auto-withdrawal process...');
  const eligible_investors = getInvestorsForAutoWithdraw();
  
  eligible_investors.forEach(investor => {
    if (investor.current_balance >= investor.auto_withdraw.threshold) {
      console.log(`Investor ${investor.name} is eligible for auto-withdrawal. Balance: ${investor.current_balance}, Threshold: ${investor.auto_withdraw.threshold}`);
      processWithdrawal({
        investor_id: investor.id,
        amount: investor.current_balance, // Withdraw the entire balance
        type: 'auto',
        bank_info: investor.bank_info
      });
    }
  });
  console.log('Auto-withdrawal process finished.');
  // Return a promise to match the async nature of other functions
  return Promise.resolve();
}

// --- Reporting Functions ---

// Mock helper functions for generateReport
function getDailyReports(start_date?: string, end_date?: string): DailyReport[] {
  // In a real app, this would filter by date. Here we return all reports.
  return dailyReports;
}

function getInvestorData(investor_id: string): Investor | undefined {
  return investors.find(inv => inv.id === investor_id);
}

function generatePDFReport(data: any): { format: string, data: any } {
  console.log("Generating PDF report...");
  return { format: "pdf", data };
}

function generateExcelReport(data: any): { format: string, data: any } {
  console.log("Generating Excel report...");
  return { format: "excel", data };
}


/**
 * Generates a detailed report for a specific investor over a given period.
 * Can return raw data or simulate creating a PDF/Excel file.
 * @param investor_id The ID of the investor to report on.
 * @param start_date The start date of the report period.
 * @param end_date The end date of the report period.
 * @param export_type 'json' (default), 'pdf', or 'excel'.
 * @returns A report object or a simulated file object.
 */
export async function generateReport(
    investor_id: string,
    start_date: string,
    end_date: string,
    export_type: 'json' | 'pdf' | 'excel' = 'json'
) {
  const reports = getDailyReports(start_date, end_date);
  const investor_data = getInvestorData(investor_id);

  if (!investor_data) {
    throw new Error(`Investor with ID ${investor_id} not found.`);
  }

  const report_data = {
    investor_info: investor_data,
    daily_reports: reports.map(report => {
        const my_earning = report.investor_earnings[investor_id] || 0;
        return {
            date: report.date,
            total_revenue: report.total_revenue,
            investor_pool: report.distributions.investor_pool,
            my_earning: my_earning,
        }
    }),
    summary: {
      total_days: reports.length,
      total_earnings: reports.reduce((sum, r) => {
          const my_earning = r.investor_earnings[investor_id] || 0;
          return sum + my_earning;
      }, 0),
      get avg_daily() {
          return this.total_days > 0 ? this.total_earnings / this.total_days : 0;
      }
    }
  };
  
  if (export_type === 'pdf') {
    return generatePDFReport(report_data);
  } else if (export_type === 'excel') {
    return generateExcelReport(report_data);
  }
  
  return report_data;
}
