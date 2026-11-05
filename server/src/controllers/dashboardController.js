import { getDashboardSummaryMetrics } from '../services/finance/calculationEngine.js';

/**
 * Controller for retrieving dashboard financial summary metrics
 * GET /api/v1/dashboard/summary
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const summary = await getDashboardSummaryMetrics(req.user._id, startDate, endDate);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
}
