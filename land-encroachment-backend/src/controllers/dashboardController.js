
import { query } from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Main dashboard statistics
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM public.land_parcels) AS total_parcels,

        (SELECT COUNT(*) FROM public.satellite_images) AS total_images,

        (SELECT COUNT(*) FROM public.detected_changes) AS total_changes,

        (SELECT COUNT(*) FROM public.encroachment_cases) AS total_cases,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE risk_level = 'High') AS high_risk,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE risk_level = 'Medium') AS medium_risk,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE risk_level = 'Low') AS low_risk,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE status = 'Under Review') AS under_review,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE status = 'Verified') AS verified,

        (SELECT COUNT(*)
         FROM public.encroachment_cases
         WHERE status = 'Rejected') AS rejected
    `);

    // 2. Monthly change and case activity
    const activityResult = await query(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month
      )
      SELECT
        TO_CHAR(m.month, 'Mon') AS month,
        COALESCE(changes.total, 0) AS changes,
        COALESCE(cases.total, 0) AS cases
      FROM months m
      LEFT JOIN (
        SELECT
          date_trunc('month', detected_at) AS month,
          COUNT(*) AS total
        FROM public.detected_changes
        WHERE detected_at >=
          date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY 1
      ) changes ON changes.month = m.month
      LEFT JOIN (
        SELECT
          date_trunc('month', created_at) AS month,
          COUNT(*) AS total
        FROM public.encroachment_cases
        WHERE created_at >=
          date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
        GROUP BY 1
      ) cases ON cases.month = m.month
      ORDER BY m.month
    `);

    // 3. Recent encroachment cases
    const casesResult = await query(`
      SELECT
        c.id,
        c.case_code,
        c.risk_level,
        c.status,
        c.description,
        c.created_at,
        p.location_name,
        d.affected_area_sq_m
      FROM public.encroachment_cases c
      LEFT JOIN public.land_parcels p
        ON p.id = c.parcel_id
      LEFT JOIN public.detected_changes d
        ON d.id = c.detected_change_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        monitoring: activityResult.rows,
        recentCases: casesResult.rows,
      },
    });

  } catch (error) {
    console.error("Dashboard statistics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics.",
    });
  }
};
