using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Dtos.ShiftTeam
{
    public class ShiftTeamSpanDto
    {
        public int TeamId { get; set; }
        public string Label { get; set; } = "";
        public string Start { get; set; } = "";
        public string End { get; set; } = "";
    }
}
