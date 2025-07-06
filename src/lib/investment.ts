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
    join_date: string;
    bank_info: BankInfo;
}

interface DailyReport {
    date: string;
    total_revenue: number;
    milestone_reached: boolean;
    revenue_distribution: {
        founder_share: number;
        investor_pool: number;
        development_fund: number;
    };
    investor_earnings: { investorName: string; earnings: number }[];
}

let investors: Investor[] = [
    { 
        id: 'inv_001', name: 'Nattapong', total_investment: 100000, current_balance: 0, 
        total_earnings: 0, join_date: '2024-01-01', 
        bank_info: { bank_name: 'K-Bank', account_number: 'xxx-x-x1234-x', account_name: 'Nattapong' } 
    },
    { 
        id: 'inv_002', name: 'Siriporn', total_investment: 250000, current_balance: 0, 
        total_earnings: 0, join_date: '2024-01-15', 
        bank_info: { bank_name: 'SCB', account_number: 'xxx-x-x5678-x', account_name: 'Siriporn' } 
    },
    { 
        id: 'inv_003', name: 'Somchai', total_investment: 50000, current_balance: 0, 
        total_earnings: 0, join_date: '2024-02-01', 
        bank_info: { bank_name: 'BBL', account_number: 'xxx-x-x9012-x', account_name: 'Somchai' } 
    },
];

let dailyReports: DailyReport[] = [];

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
    const investor_earnings: { investorName: string; earnings: number }[] = [];

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
                investor_earnings.push({ investorName: investor.name, earnings });
            });
        }
    }

    const newReport: DailyReport = {
        date: new Date().toISOString().split('T')[0],
        total_revenue: daily_revenue,
        milestone_reached: total_investment_pool > FOUNDER_MILESTONE,
        revenue_distribution: {
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
): Promise<{ success: boolean; message: string; investorShare?: number }> {
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
    join_date: new Date().toISOString().split('T')[0],
    bank_info,
  };

  investors.push(newInvestor);

  const total_investment_pool = investors.reduce((sum, inv) => sum + inv.total_investment, 0);
  const investorShare = (amount / total_investment_pool) * 100;

  return { 
    success: true, 
    message: `Investor ${name} added successfully.`,
    investorShare: parseFloat(investorShare.toFixed(2))
  };
}

export async function getInvestmentData() {
    const totalInvestment = investors.reduce((sum, inv) => sum + inv.total_investment, 0);
    const totalRevenue = dailyReports.reduce((sum, rep) => sum + rep.total_revenue, 0);
    const totalFounderEarnings = dailyReports.reduce((sum, rep) => sum + rep.revenue_distribution.founder_share, 0);

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
