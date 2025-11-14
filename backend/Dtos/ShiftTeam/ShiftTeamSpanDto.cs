using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Dtos.ShiftTeam
{
    public class ShiftTeamSpanDto
    {
        public int TeamId { get; set; }
        public string Name { get; set; } = "";
        public string Label { get; set; } = "";
        public string Start { get; set; } = "";
        public string End { get; set; } = "";

        public string LightColorHex { get; set; } = "#212121";
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public string LightTextColorHex { get; set; } = "#ffffff";
        public string DarkTextColorHex { get; set; } = "#000000";
        public bool ReverseColor { get; set; }
    }
}
