namespace backend.Services
{
    public static class AuditTrailConfig
    {
        public static readonly Dictionary<
            string,
            List<(string? EntityName, string? Action)>
        > Rules = new()
        {
            // Admins can see all actions but not user-related actions.
            ["Admin"] = new()
            {
                ("Category", null),
                ("News", null),
                ("NewsType", null),
                ("Report", null),
                ("Shift", null),
                ("ShiftTeam", null),
                ("TrendingPanel", null),
                ("UnitColumn", null),
                ("UnitCell", null),
                ("Unit", null),
                ("UnitGroup", null),
                ("ShiftChange", null),
                ("StopType", null),
                ("MasterPlan", null),
                ("MasterPlanField", null),
                ("MasterPlanElement", null),
            },

            // Developers can see all actions.
            ["Developer"] = new() { (null, null) },

            // Reporters can only see actions related to reports and unit cells.
            ["Reporter"] = new() { ("Report", null), ("UnitCell", null) },

            // Master planners can only see actions related to master plans.
            ["MasterPlanner"] = new()
            {
                ("MasterPlan", null),
                ("MasterPlanField", null),
                ("MasterPlanElement", null),
            },
        };
    }
}
